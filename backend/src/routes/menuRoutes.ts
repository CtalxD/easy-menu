//backend/src/routes/menuRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkItemLimit, checkCategoryLimit } from '../middleware/membership';
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

const router = Router();

router.use(authenticateToken);

// Plan routes
router.get('/plan/info', getPlanInfo);
router.post('/plan/upgrade', upgradePlan);

// Settings route
router.put('/settings', updateSettings);

// Analytics routes
router.get('/analytics', getAnalytics);
router.get('/analytics/export', exportAnalyticsCSV);

// QR routes
router.get('/qr/generate', generateQRCode);
router.post('/qr/generate-custom', generateCustomQRCode);

// Location routes (PRO and above)
router.get('/locations', getLocations);
router.post('/locations', createLocation);
router.put('/locations/:locationId', updateLocation);
router.delete('/locations/:locationId', deleteLocation);

// Schedule routes (PRO and above)
router.get('/schedules', getSchedules);
router.post('/schedules', createSchedule);
router.delete('/schedules/:scheduleId', deleteSchedule);

// Category routes
router.get('/categories/default', getDefaultCategories);
router.post('/categories/bulk', checkCategoryLimit, createCategoriesBulk);
router.get('/categories', getCategories);
router.post('/categories', checkCategoryLimit, createCategory);
router.put('/categories/:categoryId', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// Menu item routes
router.get('/', getMenuItems);
router.post('/', checkItemLimit, createMenuItem);
router.get('/:id', getMenuItem);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);
router.patch('/:id/toggle-status', toggleMenuItemStatus);
router.patch('/:id/toggle-popular', togglePopular);

router.post('/qr/save-settings', saveQRSettings);
router.get('/qr/get-settings', getQRSettings);

export default router;