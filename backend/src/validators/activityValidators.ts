// backend/src/validators/activityValidators.ts

import { z } from 'zod';

export const getActivityLogsSchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('50'),
  action: z.enum([
    'ALL', 'LOGIN', 'LOGOUT', 'SIGNUP', 'GOOGLE_SIGNIN',
    'CREATE', 'UPDATE', 'DELETE',
    'APPROVE', 'REJECT',
    'PASSWORD_CHANGE', 'PASSWORD_RESET', 'OTP_REQUEST', 'OTP_VERIFY',
    'PLAN_UPGRADE', 'PLAN_CHANGE',
    'QR_GENERATE', 'QR_CUSTOMIZE',
    'IMAGE_UPLOAD',
    'SCHEDULE_CREATE', 'SCHEDULE_DELETE', 'SCHEDULE_EXECUTE',
    'LOCATION_CREATE', 'LOCATION_UPDATE', 'LOCATION_DELETE',
    'SETTINGS_UPDATE',
    'ADMIN_ACTION',
  ]).optional().default('ALL'),
  entity: z.enum([
    'ALL', 'USER', 'RESTAURANT', 'SUBSCRIPTION',
    'MENU_ITEM', 'CATEGORY',
    'LOCATION', 'SCHEDULE',
    'QR_CODE', 'IMAGE',
    'SETTINGS', 'SYSTEM',
  ]).optional().default('ALL'),
  userId: z.string().uuid('Invalid user ID').optional(),
  search: z.string().max(255).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});