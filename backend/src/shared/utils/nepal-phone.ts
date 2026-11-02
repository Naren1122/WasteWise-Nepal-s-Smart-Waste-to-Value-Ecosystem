import { z } from 'zod';

// Matches Nepal Mobile (98, 97, 96) or Landline (01, 021, etc.)
export const NEPAL_PHONE_REGEX = /^(?:\+977)?(?:0\d{1,2}\d{6,7}|(?:98|97|96)\d{8})$/;

export const stripPhone = (v: string): string => v.replace(/[\s-]/g, '');

/**
 * Standardizes any Nepali phone/landline to international E.164 (+977...)
 * Strips domestic trunk prefix (0) for landlines: e.g. 014412345 -> +97714412345
 */
export const normalizePhone = (v: string): string => {
  const cleaned = stripPhone(v)
    .replace(/^\+977/, '')
    .replace(/^0/, '');
  return `+977${cleaned}`;
};

export const phoneSchema = z
  .string()
  .transform(stripPhone)
  .pipe(z.string().regex(NEPAL_PHONE_REGEX, 'Must be a valid Nepali phone or landline number'))
  .transform(normalizePhone);

export const optionalPhoneSchema = phoneSchema.optional().nullable();

