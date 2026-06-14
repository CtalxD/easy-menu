// backend/src/validators/adminValidators.ts
import { z } from 'zod';

export const getSubscriptionsSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'ALL']).optional(),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE', 'ALL']).optional(),
  search: z.string().max(255).optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('20'),
});

export const rejectSubscriptionSchema = z.object({
  reason: z.string().max(1000, 'Reason must be 1000 characters or less').optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email must be 255 characters or less').optional(),
  admin: z.boolean().optional(),
  verified: z.boolean().optional(),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less').optional(),
  phone: z.string().max(20, 'Phone must be 20 characters or less').nullable().optional(),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE'], {
    message: 'Invalid plan type',
  }).optional(),
  address: z.string().max(500, 'Address must be 500 characters or less').nullable().optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').nullable().optional(),
});

export const getAllUsersSchema = z.object({
  search: z.string().max(255).optional().default(''),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE', '']).optional().default(''),
  status: z.enum(['verified', 'unverified', '']).optional().default(''),
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('50'),
});