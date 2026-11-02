import { z } from 'zod';
import { Role } from '@prisma/client';

const NEPAL_MOBILE = /^(?:\+977)?(?:98|97)\d{8}$/;
const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'app', 'auth', 'mail', 'cdn', 'static', 'dashboard', 'support', 'status',
]);

const stripPhone = (v: string) => v.replace(/[\s-]/g, '');
// canonical form is always +977XXXXXXXXXX
const normalizePhone = (v: string) => {
  const s = stripPhone(v);
  return s.startsWith('+977') ? s : `+977${s}`;
};

const emailField = z.string().trim().toLowerCase().email('Invalid email address').max(150);

const phoneField = z
  .string()
  .transform(stripPhone)
  .pipe(z.string().regex(NEPAL_MOBILE, 'Must be a valid Nepali mobile number (e.g. 9841234567)'))
  .transform(normalizePhone);

// bcrypt ignores everything past 72 bytes, so cap it
const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

const fullNameField = z.string().trim().min(2, 'Full name must be at least 2 characters').max(100);

export const RegisterSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
  wardId: z.string().uuid('Invalid ward UUID format').optional(),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const CreateStaffSchema = z.object({
  fullName: fullNameField,
  email: emailField,
  phone: phoneField,
  password: passwordField, // staff had a weaker rule than citizens before
  wardId: z.string().uuid('Invalid ward UUID format').optional(),
  role: z.enum([Role.WARD_OFFICER, Role.DISPATCHER, Role.DRIVER, Role.FIELD_WORKER]),
});
export type CreateStaffDto = z.infer<typeof CreateStaffSchema>;

export const LoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Email or phone number is required')
    .max(150)
    .transform((v) => {
      if (v.includes('@')) return v.toLowerCase();
      return NEPAL_MOBILE.test(stripPhone(v)) ? normalizePhone(v) : v;
    }),
  password: z.string().min(1, 'Password is required').max(128),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').max(200),
});
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

export const TenantOnboardSchema = z.object({
  municipalityName: z.string().trim().min(3, 'Municipality name must be at least 3 characters').max(100),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens (not at the start or end)')
    .refine((s) => !RESERVED_SUBDOMAINS.has(s), 'This subdomain is reserved'),
  province: z.string().trim().min(2).max(50),
  district: z.string().trim().min(2).max(50),
  adminFullName: fullNameField,
  adminEmail: emailField,
  adminPhone: phoneField,
  adminPassword: passwordField, // was only min(8), and this creates the most powerful account
});
export type TenantOnboardDto = z.infer<typeof TenantOnboardSchema>;