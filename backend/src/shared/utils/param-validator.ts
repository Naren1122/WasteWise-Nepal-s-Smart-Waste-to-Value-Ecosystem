import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.string().uuid('Invalid UUID identifier parameter'),
});

export const WardIdParamSchema = z.object({
  wardId: z.string().uuid('Invalid ward UUID parameter'),
});

export const WardAndZoneParamSchema = z.object({
  wardId: z.string().uuid('Invalid ward UUID parameter'),
  id: z.string().uuid('Invalid zone UUID parameter'),
});

