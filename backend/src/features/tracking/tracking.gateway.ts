import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { z } from 'zod';
import { env } from '../../shared/config/env.js';
import { TrackingService } from './tracking.service.js';
import { authenticateAccessToken } from '../../shared/auth/authenticate-access-token.js';
import { GpsLocationIngestSchema } from './tracking.schema.js';
import { TokenBucketRateLimiter } from '../../shared/utils/rate-limiter.js';
import { AppError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { redis, isRedisReady } from '../../shared/database/redis.service.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  LiveVehicleState,
  VehiclePositionDelta,
  RouteLocationBroadcastDto,
  ITrackingPublisher,
} from './tracking.types.js';
import { Role } from '@prisma/client';

export type TrackingSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>;

export class TrackingGateway implements ITrackingPublisher {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, object, SocketData> | null = null;

  constructor(private readonly trackingService: TrackingService = new TrackingService()) {
    this.trackingService.setPublisher(this);
  }

  public init(httpServer: HttpServer): SocketIOServer<ClientToServerEvents, ServerToClientEvents, object, SocketData> {
    this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, object, SocketData>(httpServer, {
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
      },
      path: '/socket.io',
    });

    // Multi-instance horizontal scaling via Redis Adapter (Items 8 & 18)
    if (isRedisReady()) {
      this.attachRedisAdapter();
    } else {
      redis.once('connect', () => {
        this.attachRedisAdapter();
      });
    }

    // 1. Shared Authentication Middleware (Item 3 & 4: sanitize errors & zero leak)
    this.io.use(async (socket: TrackingSocket, next) => {
      const rawToken = socket.handshake.auth.token || socket.handshake.headers.authorization;
      if (!rawToken || typeof rawToken !== 'string') {
        return next(new Error('Authentication error: Token required'));
      }

      const match = rawToken.match(/^bearer\s+(\S+)$/i);
      const token = match && match[1] ? match[1] : rawToken.trim();
      if (!token) {
        return next(new Error('Authentication error: Malformed token'));
      }

      try {
        const user = await authenticateAccessToken(token);
        socket.data.userId = user.id;
        socket.data.tenantId = user.tenantId;
        socket.data.role = user.role;
        socket.data.wardId = user.wardId;
        if (user.exp !== undefined) {
          socket.data.tokenExp = user.exp;
        }
        next();
      } catch (err) {
        // Protect infrastructure: only echo message if known UnauthorizedError (Item 4)
        if (!(err instanceof UnauthorizedError)) {
          console.error('[TrackingGateway] Auth infra error:', err);
        }
        const message =
          err instanceof UnauthorizedError
            ? `Authentication error: ${err.message}`
            : 'Authentication error: Authentication failed';
        next(new Error(message));
      }
    });

    // 2. Connection and Room Management
    this.io.on('connection', (socket: TrackingSocket) => {
      const { tenantId, userId, role, wardId } = socket.data;

      // Per-socket rate limiter to protect against flood attacks & client bugs (Item 19)
      const telemetryLimiter = new TokenBucketRateLimiter(
        env.GPS_RATE_LIMIT_BURST,
        env.GPS_RATE_LIMIT_PER_SEC
      );

      // Handle token expiration disconnect with integer overflow cap (Item 5 & 10)
      if (socket.data.tokenExp !== undefined) {
        const msUntilExpiry = socket.data.tokenExp * 1000 - Date.now();
        if (msUntilExpiry <= 0) {
          socket.emit('tracking:error', {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
          });
          socket.disconnect(true);
          return;
        }

        // 32-bit signed integer limit for setTimeout (Item 5)
        const MAX_SET_TIMEOUT_MS = 2_147_483_647;
        const timeoutDelay = Math.min(msUntilExpiry, MAX_SET_TIMEOUT_MS);

        const expiryTimer = setTimeout(() => {
          socket.emit('tracking:error', {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
          });
          socket.disconnect(true);
        }, timeoutDelay);

        socket.on('disconnect', (reason) => {
          clearTimeout(expiryTimer);
          if (role === Role.DRIVER) {
            console.log(`[TrackingGateway] Driver ${userId} disconnected (${reason}). Heartbeat staleness will reflect in ops view.`);
          }
        });
      }

      // Operations Room: Municipal Admins, Dispatchers, Ward Officers, Super Admins monitor fleet (Item 4)
      socket.on('join:ops_room', (targetTenantId) => {
        // Only municipal administrative roles can monitor real-time ops room telemetry.
        // NOTE: WARD_OFFICER has tenant-wide ops room visibility intentionally to ensure cross-ward
        // situational awareness (e.g. transfer station congestion, arterial route transitions).
        const allowedRoles: Role[] = [
          Role.MUNICIPAL_ADMIN,
          Role.DISPATCHER,
          Role.WARD_OFFICER,
          Role.SUPER_ADMIN,
        ];

        if (!allowedRoles.includes(role)) {
          socket.emit('tracking:error', {
            code: 'FORBIDDEN',
            message: 'Access denied: Citizen accounts cannot join the municipal operations room',
          });
          return;
        }

        if (targetTenantId === tenantId) {
          socket.join(`tenant:${tenantId}:ops`);
        } else {
          socket.emit('tracking:error', {
            code: 'FORBIDDEN',
            message: 'Access denied: Cross-tenant operations room access prohibited',
          });
        }
      });

      socket.on('leave:ops_room', (targetTenantId) => {
        socket.leave(`tenant:${targetTenantId}:ops`);
      });

      // Route Room: Scoped route room subscription (Items 2 & 5)
      socket.on('join:route_room', async (routeId) => {
        if (!routeId || typeof routeId !== 'string') {
          socket.emit('tracking:error', {
            code: 'INVALID_ROUTE_ID',
            message: 'Route ID must be a valid string',
          });
          return;
        }

        const uuidParse = z.string().uuid().safeParse(routeId.trim());
        if (!uuidParse.success) {
          socket.emit('tracking:error', {
            code: 'INVALID_ROUTE_ID',
            message: 'Invalid route UUID format',
          });
          return;
        }

        const cleanRouteId = uuidParse.data;

        try {
          const hasAccess = await this.trackingService.verifyRouteAccess(
            tenantId,
            cleanRouteId,
            userId,
            role,
            wardId
          );

          if (!hasAccess) {
            socket.emit('tracking:error', {
              code: 'FORBIDDEN',
              message: 'Access denied: Route does not exist in your tenant or is not assigned to your scope',
            });
            return;
          }

          socket.join(`route:${cleanRouteId}`);
        } catch {
          socket.emit('tracking:error', {
            code: 'ROUTE_ACCESS_ERROR',
            message: 'Failed to verify route authorization',
          });
        }
      });

      socket.on('leave:route_room', (routeId) => {
        if (typeof routeId === 'string') {
          socket.leave(`route:${routeId.trim()}`);
        }
      });

      // Telemetry Stream: Drivers streaming live GPS positions (Items 6, 7, 9, 19)
      socket.on('telemetry:stream', async (payload) => {
        // 1. Rate limiting guard (Item 19)
        if (!telemetryLimiter.tryAcquire()) {
          socket.emit('tracking:error', {
            code: 'RATE_LIMITED',
            message: 'Telemetry ingestion rate limit exceeded. Please throttle GPS transmissions.',
          });
          return;
        }

        // 2. Role authorization guard (Item 7: Driver only)
        if (role !== Role.DRIVER) {
          socket.emit('tracking:error', {
            code: 'UNAUTHORIZED_STREAM',
            message: 'Only authorized drivers can stream vehicle telemetry',
          });
          return;
        }

        // 3. Strict schema validation (Item 6)
        const parseResult = GpsLocationIngestSchema.safeParse(payload);
        if (!parseResult.success) {
          socket.emit('tracking:error', {
            code: 'INVALID_PAYLOAD',
            message: parseResult.error.issues[0]?.message || 'Invalid GPS telemetry payload format',
          });
          return;
        }

        const validatedPayload = parseResult.data;

        try {
          await this.trackingService.ingestLocation(tenantId, userId, validatedPayload);
        } catch (err) {
          // 4. Safe error mapping without internal leak (Item 9)
          if (err instanceof AppError) {
            socket.emit('tracking:error', {
              code: err.errorCode,
              message: err.message,
            });
          } else {
            console.error('[TrackingGateway] Unexpected telemetry error:', err);
            socket.emit('tracking:error', {
              code: 'INGESTION_FAILED',
              message: 'Internal error processing telemetry stream',
            });
          }
        }
      });
    });

    return this.io;
  }

  private attachRedisAdapter(): void {
    if (!this.io) return;
    try {
      const pubClient = redis;
      const subClient = redis.duplicate();
      subClient.on('error', (err: Error) => {
        console.warn('[TrackingGateway] Redis adapter subscriber error:', err.message);
      });
      this.io.adapter(createAdapter(pubClient, subClient));
      console.log('[TrackingGateway] Multi-instance Redis adapter attached to Socket.IO');
    } catch (adapterErr) {
      console.warn('[TrackingGateway] Could not attach Redis adapter, running in default mode:', adapterErr);
    }
  }

  public publishPosition(
    tenantId: string,
    delta: VehiclePositionDelta,
    routeBroadcast?: RouteLocationBroadcastDto | null
  ): void {
    if (!this.io) return;
    // Broadcast full delta to central operations room
    this.broadcastToOps(tenantId, delta);
    // Broadcast citizen-safe telemetry (speed and driverId redacted) to route room (Item 1)
    if (routeBroadcast && routeBroadcast.routeId) {
      this.broadcastToRoute(routeBroadcast.routeId, routeBroadcast);
    }
  }

  public broadcastToOps(tenantId: string, delta: VehiclePositionDelta): void {
    if (!this.io) return;
    this.io.to(`tenant:${tenantId}:ops`).emit('vehicle:location_update', delta);
  }

  public broadcastToRoute(routeId: string, payload: RouteLocationBroadcastDto): void {
    if (!this.io) return;
    this.io.to(`route:${routeId}`).emit('route:location_broadcast', payload);
  }

  public getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, object, SocketData> | null {
    return this.io;
  }
}

export const trackingGateway = new TrackingGateway();
