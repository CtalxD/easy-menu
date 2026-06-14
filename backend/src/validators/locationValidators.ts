// backend/src/validators/locationValidators.ts
import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(200, 'Location name must be 200 characters or less'),
  address: z.string().max(500, 'Address must be 500 characters or less').optional().default(''),
  phone: z.string().max(20, 'Phone must be 20 characters or less').optional().default(''),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(200, 'Location name must be 200 characters or less').optional(),
  address: z.string().max(500, 'Address must be 500 characters or less').optional(),
  phone: z.string().max(20, 'Phone must be 20 characters or less').optional(),
});