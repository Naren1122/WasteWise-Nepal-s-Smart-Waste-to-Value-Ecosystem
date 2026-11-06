import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env.js';
import { TrackingService } from './tracking.service.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  LiveVehicleState,
  GpsTelemetryDto,
} from './tracking.types.js';
import { Role } from '@prisma/client';

export type TrackingSocket = Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>;

interface JwtSocketPayload {
  userId: string;
  tenantId: string;
  role: Role;
}

export class TrackingGateway {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, object, SocketData> | null = null;

  constructor(private readonly trackingService: TrackingService = new TrackingService()) {}

  public init(httpServer: HttpServer): SocketIOServer<ClientToServerEvents, ServerToClientEvents, object, SocketData> {
    this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, object, SocketData>(httpServer, {
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
      },
      path: '/socket.io',
    });

    // 1. Authentication Middleware
    this.io.use((socket: TrackingSocket, next) => {
      const rawToken = socket.handshake.auth.token || socket.handshake.headers.authorization;
      if (!rawToken || typeof rawToken !== 'string') {
        return next(new Error('Authentication error: Token required'));
      }

      const token = rawToken.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken;
      if (!token) {
        return next(new Error('Authentication error: Malformed token'));
      }

      try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtSocketPayload;
        socket.data.userId = decoded.userId;
        socket.data.tenantId = decoded.tenantId;
        socket.data.role = decoded.role;
        next();
      } catch {
        next(new Error('Authentication error: Invalid or expired token'));
      }
    });

    // 2. Connection and Room Management
    this.io.on('connection', (socket: TrackingSocket) => {
      const { tenantId, userId, role } = socket.data;

      // Operations Room: Municipal Admins & Dispatchers monitor fleet
      socket.on('join:ops_room', (targetTenantId) => {
        if (targetTenantId === tenantId) {
          socket.join(`tenant:${tenantId}:ops`);
        }
      });

      socket.on('leave:ops_room', (targetTenantId) => {
        socket.leave(`tenant:${targetTenantId}:ops`);
      });

      // Route Room: Citizens & Field Workers monitor specific route
      socket.on('join:route_room', (routeId) => {
        socket.join(`route:${routeId}`);
      });

      socket.on('leave:route_room', (routeId) => {
        socket.leave(`route:${routeId}`);
      });

      // Telemetry Stream: Drivers streaming live GPS positions
      socket.on('telemetry:stream', async (payload) => {
        try {
          if (role !== Role.DRIVER && role !== Role.MUNICIPAL_ADMIN && role !== Role.SUPER_ADMIN) {
            socket.emit('tracking:error', {
              code: 'UNAUTHORIZED_STREAM',
              message: 'Only authorized drivers can stream vehicle telemetry',
            });
            return;
          }

          const { telemetry } = await this.trackingService.ingestLocation(tenantId, userId, payload);

          // Broadcast to central ops room
          const vehicleState: LiveVehicleState = {
            status: 'ON_ROUTE',
            vehicleId: telemetry.vehicleId,
            registrationNo: '', // populated in full feed
            driverName: '',
            routeId: telemetry.routeId ?? '',
            wasteType: '',
            latitude: telemetry.latitude,
            longitude: telemetry.longitude,
            speedKmh: telemetry.speedKmh ?? 0,
            headingDeg: telemetry.headingDeg ?? 0,
            lastHeartbeat: telemetry.recordedAt,
          };

          this.broadcastToOps(tenantId, vehicleState);

          if (telemetry.routeId) {
            this.broadcastToRoute(telemetry.routeId, telemetry);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Telemetry ingestion error';
          socket.emit('tracking:error', { code: 'INGESTION_FAILED', message });
        }
      });
    });

    return this.io;
  }

  public broadcastToOps(tenantId: string, state: LiveVehicleState): void {
    if (!this.io) return;
    this.io.to(`tenant:${tenantId}:ops`).emit('vehicle:location_update', state);
  }

  public broadcastToRoute(routeId: string, telemetry: GpsTelemetryDto): void {
    if (!this.io) return;
    this.io.to(`route:${routeId}`).emit('route:location_broadcast', telemetry);
  }

  public getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, object, SocketData> | null {
    return this.io;
  }
}

export const trackingGateway = new TrackingGateway();
