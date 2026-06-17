// backend/src/validators/scheduleValidators.ts
import { z } from 'zod';

export const createScheduleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().default(''),
  scheduledAt: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, 'Scheduled time must be a valid future date'),
  action: z.enum(['TOGGLE_ITEM_STATUS', 'UPDATE_ITEM_PRICE', 'TOGGLE_ITEM_POPULAR', 'BULK_UPDATE'], {
    message: 'Invalid action type',
  }),
  payload: z.any().optional(),
  itemId: z.string().uuid('Invalid item ID').optional(),
  newPrice: z.number().min(0, 'Price cannot be negative').max(999999.99, 'Price is too high').optional(),
});