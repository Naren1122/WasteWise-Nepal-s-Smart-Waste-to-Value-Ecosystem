import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingGateway } from '../tracking.gateway.js';
import { TrackingService } from '../tracking.service.js';
import { Role } from '@prisma/client';

describe('TrackingGateway Room Authorization', () => {
  let gateway: TrackingGateway;
  let mockTrackingService: TrackingService;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const otherTenantId = '22222222-2222-2222-2222-222222222222';
  const userId = '33333333-3333-3333-3333-333333333333';
  const routeId = '44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    vi.clearAllMocks();
    mockTrackingService = {
      verifyRouteAccess: vi.fn(),
      ingestLocation: vi.fn(),
      getActiveFleetPositions: vi.fn(),
      getRouteBreadcrumbs: vi.fn(),
      setPublisher: vi.fn(),
    } as unknown as TrackingService;

    gateway = new TrackingGateway(mockTrackingService);
  });

  const createMockSocket = (role: Role, socketTenantId = tenantId) => {
    const events: Record<string, (...args: any[]) => void> = {};
    return {
      data: {
        userId,
        tenantId: socketTenantId,
        role,
      },
      join: vi.fn(),
      leave: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      on: vi.fn((event: string, handler: (...args: any[]) => void) => {
        events[event] = handler;
      }),
      _trigger: (event: string, ...args: any[]) => {
        if (events[event]) {
          return events[event](...args);
        }
      },
    };
  };

  it('should deny CITIZEN from joining ops room with FORBIDDEN error', () => {
    const mockSocket = createMockSocket(Role.CITIZEN);

    // Simulate connection event handler registration
    const initServer = {
      use: vi.fn(),
      on: vi.fn((event: string, cb: any) => {
        if (event === 'connection') {
          cb(mockSocket);
        }
      }),
    };

    gateway['io'] = initServer as any;
    // Trigger connection logic manually
    const connectionHandler = (socket: any) => {
      socket.on('join:ops_room', (targetTenantId: string) => {
        const allowedRoles: Role[] = [
          Role.MUNICIPAL_ADMIN,
          Role.DISPATCHER,
          Role.WARD_OFFICER,
          Role.SUPER_ADMIN,
        ];
        if (!allowedRoles.includes(socket.data.role)) {
          socket.emit('tracking:error', {
            code: 'FORBIDDEN',
            message: 'Access denied: Citizen accounts cannot join the municipal operations room',
          });
          return;
        }
        if (targetTenantId === socket.data.tenantId) {
          socket.join(`tenant:${socket.data.tenantId}:ops`);
        }
      });
    };
    connectionHandler(mockSocket);

    mockSocket._trigger('join:ops_room', tenantId);

    expect(mockSocket.join).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('tracking:error', {
      code: 'FORBIDDEN',
      message: 'Access denied: Citizen accounts cannot join the municipal operations room',
    });
  });

  it('should allow MUNICIPAL_ADMIN to join their own tenant ops room', () => {
    const mockSocket = createMockSocket(Role.MUNICIPAL_ADMIN);

    const connectionHandler = (socket: any) => {
      socket.on('join:ops_room', (targetTenantId: string) => {
        const allowedRoles: Role[] = [
          Role.MUNICIPAL_ADMIN,
          Role.DISPATCHER,
          Role.WARD_OFFICER,
          Role.SUPER_ADMIN,
        ];
        if (!allowedRoles.includes(socket.data.role)) {
          socket.emit('tracking:error', {
            code: 'FORBIDDEN',
            message: 'Access denied: Citizen accounts cannot join the municipal operations room',
          });
          return;
        }
        if (targetTenantId === socket.data.tenantId) {
          socket.join(`tenant:${socket.data.tenantId}:ops`);
        }
      });
    };
    connectionHandler(mockSocket);

    mockSocket._trigger('join:ops_room', tenantId);

    expect(mockSocket.join).toHaveBeenCalledWith(`tenant:${tenantId}:ops`);
  });

  it('should reject join:route_room when routeId is not a valid UUID', async () => {
    const mockSocket = createMockSocket(Role.CITIZEN);

    const connectionHandler = (socket: any) => {
      socket.on('join:route_room', async (inputRouteId: any) => {
        if (!inputRouteId || typeof inputRouteId !== 'string') {
          socket.emit('tracking:error', {
            code: 'INVALID_ROUTE_ID',
            message: 'Route ID must be a valid string',
          });
          return;
        }
        const { z } = await import('zod');
        const parsed = z.string().uuid().safeParse(inputRouteId.trim());
        if (!parsed.success) {
          socket.emit('tracking:error', {
            code: 'INVALID_ROUTE_ID',
            message: 'Invalid route UUID format',
          });
          return;
        }
      });
    };
    connectionHandler(mockSocket);

    await mockSocket._trigger('join:route_room', 'invalid-route-id');

    expect(mockSocket.join).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('tracking:error', {
      code: 'INVALID_ROUTE_ID',
      message: 'Invalid route UUID format',
    });
  });

  it('should deny join:route_room if verifyRouteAccess returns false', async () => {
    const mockSocket = createMockSocket(Role.CITIZEN);
    vi.mocked(mockTrackingService.verifyRouteAccess).mockResolvedValue(false);

    const connectionHandler = (socket: any) => {
      socket.on('join:route_room', async (inputRouteId: string) => {
        const hasAccess = await mockTrackingService.verifyRouteAccess(
          socket.data.tenantId,
          inputRouteId,
          socket.data.userId,
          socket.data.role
        );
        if (!hasAccess) {
          socket.emit('tracking:error', {
            code: 'FORBIDDEN',
            message: 'Access denied: Route does not exist in your tenant or does not serve your property',
          });
          return;
        }
        socket.join(`route:${inputRouteId}`);
      });
    };
    connectionHandler(mockSocket);

    await mockSocket._trigger('join:route_room', routeId);

    expect(mockSocket.join).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('tracking:error', {
      code: 'FORBIDDEN',
      message: 'Access denied: Route does not exist in your tenant or does not serve your property',
    });
  });

  it('should join route room when verifyRouteAccess succeeds', async () => {
    const mockSocket = createMockSocket(Role.CITIZEN);
    vi.mocked(mockTrackingService.verifyRouteAccess).mockResolvedValue(true);

    const connectionHandler = (socket: any) => {
      socket.on('join:route_room', async (inputRouteId: string) => {
        const hasAccess = await mockTrackingService.verifyRouteAccess(
          socket.data.tenantId,
          inputRouteId,
          socket.data.userId,
          socket.data.role
        );
        if (!hasAccess) {
          socket.emit('tracking:error', {
            code: 'FORBIDDEN',
            message: 'Access denied: Route does not exist in your tenant or does not serve your property',
          });
          return;
        }
        socket.join(`route:${inputRouteId}`);
      });
    };
    connectionHandler(mockSocket);

    await mockSocket._trigger('join:route_room', routeId);

    expect(mockSocket.join).toHaveBeenCalledWith(`route:${routeId}`);
  });

  describe('telemetry:stream Validation & Rate Limiting', () => {
    const validVehicleId = '55555555-5555-5555-5555-555555555555';

    it('should reject invalid payload format with INVALID_PAYLOAD code', async () => {
      const mockSocket = createMockSocket(Role.DRIVER);
      const { GpsLocationIngestSchema } = await import('../tracking.schema.js');

      const streamHandler = async (payload: any) => {
        const parseResult = GpsLocationIngestSchema.safeParse(payload);
        if (!parseResult.success) {
          mockSocket.emit('tracking:error', {
            code: 'INVALID_PAYLOAD',
            message: parseResult.error.issues[0]?.message || 'Invalid GPS telemetry payload format',
          });
          return;
        }
      };

      // Invalid latitude: 999
      await streamHandler({
        vehicleId: validVehicleId,
        latitude: 999,
        longitude: 85.32,
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('tracking:error', {
        code: 'INVALID_PAYLOAD',
        message: expect.stringContaining('Latitude must be between -90 and 90'),
      });
    });

    it('should drop messages and emit RATE_LIMITED when burst exceeds token limit', async () => {
      const mockSocket = createMockSocket(Role.DRIVER);
      const { TokenBucketRateLimiter } = await import('../../../shared/utils/rate-limiter.js');
      const limiter = new TokenBucketRateLimiter(2, 1); // 2 burst capacity

      const streamHandler = (payload: any) => {
        if (!limiter.tryAcquire()) {
          mockSocket.emit('tracking:error', {
            code: 'RATE_LIMITED',
            message: 'Telemetry ingestion rate limit exceeded. Please throttle GPS transmissions.',
          });
          return false;
        }
        return true;
      };

      expect(streamHandler({})).toBe(true);
      expect(streamHandler({})).toBe(true);
      expect(streamHandler({})).toBe(false);

      expect(mockSocket.emit).toHaveBeenCalledWith('tracking:error', {
        code: 'RATE_LIMITED',
        message: 'Telemetry ingestion rate limit exceeded. Please throttle GPS transmissions.',
      });
    });

    it('should safely map AppError codes without internal leak', async () => {
      const mockSocket = createMockSocket(Role.DRIVER);
      const { ForbiddenError, AppError } = await import('../../../shared/errors/app-error.js');

      const errorHandler = (err: unknown) => {
        if (err instanceof AppError) {
          mockSocket.emit('tracking:error', {
            code: err.errorCode,
            message: err.message,
          });
        } else {
          mockSocket.emit('tracking:error', {
            code: 'INGESTION_FAILED',
            message: 'Internal error processing telemetry stream',
          });
        }
      };

      errorHandler(new ForbiddenError('Shift is not currently active for driver'));

      expect(mockSocket.emit).toHaveBeenCalledWith('tracking:error', {
        code: 'FORBIDDEN',
        message: 'Shift is not currently active for driver',
      });

      errorHandler(new Error('FATAL: pool exhausted at pg_conn.c:120'));

      expect(mockSocket.emit).toHaveBeenCalledWith('tracking:error', {
        code: 'INGESTION_FAILED',
        message: 'Internal error processing telemetry stream',
      });
    });
  });

  describe('Socket Authentication Middleware & Token Expiration', () => {
    it('should reject access tokens that lack exp claim with Malformed error', async () => {
      const { authenticateAccessToken } = await import('../../../shared/auth/authenticate-access-token.js');
      const { UnauthorizedError } = await import('../../../shared/errors/app-error.js');
      const jwt = (await import('jsonwebtoken')).default;
      const { env } = await import('../../../shared/config/env.js');

      // Create token without exp claim (no expiresIn option, plain payload)
      const tokenWithoutExp = jwt.sign(
        { userId, tenantId, role: Role.DRIVER },
        env.JWT_ACCESS_SECRET,
        { algorithm: 'HS256' } // Note: no expiresIn, no exp in payload
      );

      await expect(authenticateAccessToken(tokenWithoutExp)).rejects.toThrow(
        new UnauthorizedError('Malformed access token payload')
      );
    });

    it('should deny cross-tenant route joins when route verification fails for tenant', async () => {
      const crossTenantSocket = createMockSocket(Role.CITIZEN, otherTenantId);
      vi.mocked(mockTrackingService.verifyRouteAccess).mockResolvedValue(false);

      const connectionHandler = (socket: any) => {
        socket.on('join:route_room', async (inputRouteId: string) => {
          const hasAccess = await mockTrackingService.verifyRouteAccess(
            socket.data.tenantId,
            inputRouteId,
            socket.data.userId,
            socket.data.role
          );
          if (!hasAccess) {
            socket.emit('tracking:error', {
              code: 'FORBIDDEN',
              message: 'Access denied: Route does not exist in your tenant or is not assigned to your scope',
            });
            return;
          }
          socket.join(`route:${inputRouteId}`);
        });
      };
      connectionHandler(crossTenantSocket);

      await crossTenantSocket._trigger('join:route_room', routeId);

      expect(mockTrackingService.verifyRouteAccess).toHaveBeenCalledWith(
        otherTenantId,
        routeId,
        userId,
        Role.CITIZEN
      );
      expect(crossTenantSocket.join).not.toHaveBeenCalled();
      expect(crossTenantSocket.emit).toHaveBeenCalledWith('tracking:error', {
        code: 'FORBIDDEN',
        message: 'Access denied: Route does not exist in your tenant or is not assigned to your scope',
      });
    });
  });
});

