import crypto from 'crypto';
import type { User } from '@prisma/client';
import type { UserProfileDto } from './auth.types.js';

// Pre-computed valid bcrypt cost 12 hash to equalize response times against user enumeration timing attacks
export const DUMMY_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L5b9m7f2u';

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const toUserProfileDto = (user: User): UserProfileDto => ({
  id: user.id,
  tenantId: user.tenantId,
  wardId: user.wardId,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  photoUrl: user.photoUrl,
  age: user.age,
  createdAt: user.createdAt,
});

