// backend/src/routes/menuRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkItemLimit, checkCategoryLimit } from '../middleware/membership';
import { validate } from '../middleware/validate';
import multer from 'multer';
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
import { uploadMenuItemImage } from '../controllers/uploadController';

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ==================== PLAN ROUTES ====================
router.get('/plan/info', getPlanInfo);
router.post('/plan/upgrade', validate(upgradePlanSchema), upgradePlan);

// ==================== SUBSCRIPTION ROUTES ====================
router.get('/subscription/status', getSubscriptionStatus);

// ==================== SETTINGS ROUTES ====================
router.put('/settings', validate(updateSettingsSchema), updateSettings);

// ==================== ANALYTICS ROUTES ====================
router.get('/analytics', getAnalytics);
router.get('/analytics/export', exportAnalyticsCSV);

// ==================== QR ROUTES ====================
router.get('/qr/generate', generateQRCode);
router.post('/qr/generate-custom', validate(generateCustomQRSchema), generateCustomQRCode);
router.post('/qr/save-settings', validate(saveQRSettingsSchema), saveQRSettings);
router.get('/qr/get-settings', getQRSettings);

// ==================== IMAGE UPLOAD ROUTE ====================
// CRITICAL: This MUST be defined BEFORE any /:id parameterized routes
router.post('/upload-image', upload.single('image'), uploadMenuItemImage);

// ==================== LOCATION ROUTES ====================
router.get('/locations', getLocations);
router.post('/locations', validate(createLocationSchema), createLocation);
router.put('/locations/:locationId', validate(updateLocationSchema), updateLocation);
router.delete('/locations/:locationId', deleteLocation);

// ==================== SCHEDULE ROUTES ====================
router.get('/schedules', getSchedules);
router.post('/schedules', validate(createScheduleSchema), createSchedule);
router.delete('/schedules/:scheduleId', deleteSchedule);

// ==================== CATEGORY ROUTES ====================
router.get('/categories/default', getDefaultCategories);
router.post('/categories/bulk', checkCategoryLimit, validate(createCategoriesBulkSchema), createCategoriesBulk);
router.get('/categories', getCategories);
router.post('/categories', checkCategoryLimit, validate(createCategorySchema), createCategory);
router.put('/categories/:categoryId', validate(updateCategorySchema), updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// ==================== MENU ITEM ROUTES (/:id routes must be LAST) ====================
router.get('/', getMenuItems);
router.post('/', checkItemLimit, validate(createMenuItemSchema), createMenuItem);
router.get('/:id', getMenuItem);
router.put('/:id', validate(updateMenuItemSchema), updateMenuItem);
router.delete('/:id', deleteMenuItem);
router.patch('/:id/toggle-status', toggleMenuItemStatus);
router.patch('/:id/toggle-popular', togglePopular);

export default router;