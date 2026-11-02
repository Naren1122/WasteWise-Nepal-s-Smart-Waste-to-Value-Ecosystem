import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

class PrismaService {
  private static instance: PrismaClient | null = null;

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
    return PrismaService.instance;
  }
}

export const prisma = PrismaService.getInstance();

