import { z } from 'zod';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from './complaints.types';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const AttachmentInputSchema = z.object({
  fileUrl: z.string().refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
    { message: 'Attachment fileUrl must be a valid HTTP(S) URL or image Data URI' }
  ),
  fileKey: z.string().min(1, 'Attachment fileKey is required').max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'Attachment must be JPEG, PNG, or WebP' }),
  }),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE_BYTES, 'Attachment size must not exceed 5MB'),
});

export const LodgeComplaintSchema = z.object({
  wardId: z.string().uuid('Invalid ward UUID'),
  category: z.nativeEnum(ComplaintCategory, {
    errorMap: () => ({ message: 'Invalid complaint category' }),
  }),
  priority: z.nativeEnum(ComplaintPriority).optional(),
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(160, 'Title cannot exceed 160 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  addressText: z.string().trim().max(255).optional(),
  attachments: z.array(AttachmentInputSchema).max(3, 'Max 3 photos allowed').optional(),
});

export const TriageComplaintSchema = z
  .object({
    status: z.nativeEnum(ComplaintStatus, {
      errorMap: () => ({ message: 'Invalid complaint status' }),
    }),
    priority: z.nativeEnum(ComplaintPriority).optional(),
    assignedToId: z.string().uuid('Invalid assigned staff UUID').optional(),
    notes: z.string().trim().max(1000).optional(),
    rejectionReason: z.string().trim().max(1000).optional(),
  })
  .transform((data) => ({
    ...data,
    rejectionReason: data.rejectionReason ?? (data.status === 'REJECTED' ? data.notes : undefined),
  }))
  .refine(
    (data) => {
      if (data.status === 'REJECTED') {
        const reason = data.rejectionReason ?? data.notes;
        return !!reason && reason.length >= 5;
      }
      return true;
    },
    {
      message: 'Rejection reason of at least 5 characters is required when rejecting',
      path: ['rejectionReason'],
    }
  );

export const ResolveComplaintSchema = z.object({
  notes: z.string().trim().max(1000).optional(),
  proofPhoto: AttachmentInputSchema.optional(),
});

export const SubmitFeedbackSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comments: z.string().trim().max(1000).optional(),
});

export const ReopenComplaintSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Reopen reason must be at least 10 characters')
    .max(1000, 'Reopen reason cannot exceed 1000 characters'),
});

export const ComplaintQuerySchema = z.object({
  wardId: z.string().uuid().optional(),
  status: z.nativeEnum(ComplaintStatus).optional(),
  category: z.nativeEnum(ComplaintCategory).optional(),
  priority: z.nativeEnum(ComplaintPriority).optional(),
  isSlaBreached: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  citizenId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

