import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection URL' }),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(16, { message: 'JWT_ACCESS_SECRET must be at least 16 characters' }),
  JWT_REFRESH_SECRET: z.string().min(16, { message: 'JWT_REFRESH_SECRET must be at least 16 characters' }),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  GPS_RATE_LIMIT_BURST: z.coerce.number().int().positive().default(5),
  GPS_RATE_LIMIT_PER_SEC: z.coerce.number().positive().default(1),
  GPS_THROTTLE_MIN_METERS: z.coerce.number().positive().default(10),
  GPS_THROTTLE_MAX_MS: z.coerce.number().int().positive().default(30000),
  GPS_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  GPS_FUTURE_TOLERANCE_SECONDS: z.coerce.number().int().positive().default(300),
  // Phase 6: Digital Nepal Payments (eSewa & Khalti)
  APP_FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  ESEWA_PRODUCT_CODE: z.string().default('EPAYTEST'),
  ESEWA_SECRET_KEY: z.string().default('8gBm/:&EnhH.1/q'),
  ESEWA_GATEWAY_URL: z.string().url().default('https://rc-epay.esewa.com.np/api/epay/main/v2/form'),
  ESEWA_STATUS_URL: z.string().url().default('https://rc.esewa.com.np/api/epay/transaction/status/'),
  KHALTI_SECRET_KEY: z.string().default('test_secret_key_7c992762283e4fc2909438d172e259e8'),
  KHALTI_GATEWAY_URL: z.string().url().default('https://a.khalti.com/api/v2/epayment/'),
  // Cloudinary Image Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Environment validation failed');
}

export const env = parsedEnv.data;
export type Env = z.infer<typeof envSchema>;

