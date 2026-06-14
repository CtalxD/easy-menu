// backend/src/routes/menuRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkItemLimit, checkCategoryLimit } from '../middleware/membership';
import { validate } from '../middleware/validate';
import {
  upgradePlanSchema,
  createCategoriesBulkSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  createCategorySchema,
  updateCategorySchema,
  updateSettingsSchema,
  generateCustomQRSchema,
  saveQRSettingsSchema,
} from '../validators/menuValidators';
import { createLocationSchema, updateLocationSchema } from '../validators/locationValidators';
import { createScheduleSchema } from '../validators/scheduleValidators';
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemStatus,
  togglePopular,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  generateQRCode,
  generateCustomQRCode,
  getPlanInfo,
  createCategoriesBulk,
  getDefaultCategories,
  saveQRSettings, 
  getQRSettings,
  upgradePlan,
  updateSettings,
} from '../controllers/menuController';
import { getAnalytics, exportAnalyticsCSV } from '../controllers/analyticsController';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../controllers/locationController';
import { getSchedules, createSchedule, deleteSchedule } from '../controllers/scheduleController';
import { getSubscriptionStatus } from '../controllers/adminController';

const router = Router();

router.use(authenticateToken);

// Plan routes
router.get('/plan/info', getPlanInfo);
router.post('/plan/upgrade', validate(upgradePlanSchema), upgradePlan);

// Subscription status
router.get('/subscription/status', getSubscriptionStatus);

// Settings route
router.put('/settings', validate(updateSettingsSchema), updateSettings);

// Analytics routes
router.get('/analytics', getAnalytics);
router.get('/analytics/export', exportAnalyticsCSV);

// QR routes
router.get('/qr/generate', generateQRCode);
router.post('/qr/generate-custom', validate(generateCustomQRSchema), generateCustomQRCode);

// Location routes (PRO and above)
router.get('/locations', getLocations);
router.post('/locations', validate(createLocationSchema), createLocation);
router.put('/locations/:locationId', validate(updateLocationSchema), updateLocation);
router.delete('/locations/:locationId', deleteLocation);

// Schedule routes (PRO and above)
router.get('/schedules', getSchedules);
router.post('/schedules', validate(createScheduleSchema), createSchedule);
router.delete('/schedules/:scheduleId', deleteSchedule);

// Category routes
router.get('/categories/default', getDefaultCategories);
router.post('/categories/bulk', checkCategoryLimit, validate(createCategoriesBulkSchema), createCategoriesBulk);
router.get('/categories', getCategories);
router.post('/categories', checkCategoryLimit, validate(createCategorySchema), createCategory);
router.put('/categories/:categoryId', validate(updateCategorySchema), updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Menu item routes
router.get('/', getMenuItems);
router.post('/', checkItemLimit, validate(createMenuItemSchema), createMenuItem);
router.get('/:id', getMenuItem);
router.put('/:id', validate(updateMenuItemSchema), updateMenuItem);
router.delete('/:id', deleteMenuItem);
router.patch('/:id/toggle-status', toggleMenuItemStatus);
router.patch('/:id/toggle-popular', togglePopular);

router.post('/qr/save-settings', validate(saveQRSettingsSchema), saveQRSettings);
router.get('/qr/get-settings', getQRSettings);

export default router;