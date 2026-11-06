import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './shared/config/env.js';
import { prisma } from './shared/database/prisma.service.js';
import { trackingGateway } from './features/tracking/tracking.gateway.js';

const app = createApp();
const server = createServer(app);

// Initialize Phase 5 Socket.IO Real-Time GPS Tracking Gateway
trackingGateway.init(server);

server.listen(env.PORT, () => {
  console.log(`[WasteWise API] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`[WasteWise API] Health check ready at http://localhost:${env.PORT}/health`);
  console.log(`[WasteWise API] Socket.IO Live Tracking Gateway initialized at ws://localhost:${env.PORT}/socket.io`);
});

const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n[WasteWise API] Received ${signal}. Closing HTTP server & database connections...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('[WasteWise API] Database disconnected. Process exiting cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[WasteWise API] Error during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

