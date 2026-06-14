// backend/src/validators/menuValidators.ts
import { z } from 'zod';

export const upgradePlanSchema = z.object({
  plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE'], {
    message: 'Plan must be one of: STARTER, PRO, ENTERPRISE',
  }),
  billingCycle: z.enum(['monthly', 'yearly'], {
    message: 'Billing cycle must be monthly or yearly',
  }).optional().default('monthly'),
});

export const createCategoriesBulkSchema = z.object({
  categories: z.array(z.string().min(1, 'Category name cannot be empty').max(100, 'Category name must be 100 characters or less'))
    .min(1, 'At least one category is required')
    .max(50, 'Cannot create more than 50 categories at once'),
});

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().default(''),
  price: z.number().min(0, 'Price cannot be negative').max(999999.99, 'Price is too high'),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  status: z.enum(['available', 'sold_out'], {
    message: 'Status must be available or sold_out',
  }).optional().default('available'),
  popular: z.boolean().optional().default(false),
  locationId: z.string().uuid('Invalid location ID').nullable().optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less').optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  price: z.number().min(0, 'Price cannot be negative').max(999999.99, 'Price is too high').optional(),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  status: z.enum(['available', 'sold_out'], {
    message: 'Status must be available or sold_out',
  }).optional(),
  popular: z.boolean().optional(),
  locationId: z.string().uuid('Invalid location ID').nullable().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().default(''),
  locationId: z.string().uuid('Invalid location ID').nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be 100 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  locationId: z.string().uuid('Invalid location ID').nullable().optional(),
});

export const updateSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less').optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  phone: z.string().max(20, 'Phone must be 20 characters or less').optional(),
  address: z.string().max(500, 'Address must be 500 characters or less').optional(),
});

export const generateCustomQRSchema = z.object({
  fgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid foreground color format').optional(),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid background color format').optional(),
  logoSize: z.number().int().min(20, 'Logo size must be at least 20px').max(200, 'Logo size must be at most 200px').optional(),
  includeLogo: z.boolean().optional(),
});

export const saveQRSettingsSchema = z.object({
  qrCodeData: z.string().optional(),
  qrMenuUrl: z.string().optional(),
  customized: z.boolean().optional(),
  fgColor: z.string().optional(),
  bgColor: z.string().optional(),
  includeLogo: z.boolean().optional(),
  logoSize: z.number().optional(),
  frameStyle: z.string().optional(),
  framePrimaryColor: z.string().optional(),
  frameSecondaryColor: z.string().optional(),
  frameBackgroundColor: z.string().optional(),
  framedQRData: z.string().optional(),
});