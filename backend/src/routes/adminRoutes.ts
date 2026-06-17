// backend/src/routes/adminRoutes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getSubscriptionsSchema,
  rejectSubscriptionSchema,
  updateUserSchema,
  updateRestaurantSchema,
  getAllUsersSchema,
} from '../validators/adminValidators';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../validators/menuValidators';
import { 
  isAdmin, 
  getSubscriptions,
  getPendingSubscriptions, 
  getSubscriptionStats,
  approveSubscription, 
  rejectSubscription,
  getAllUsers,
  updateUser,
  updateRestaurant,
  deleteUser,
  deleteRestaurant,
  getDashboardOverview,
  getRestaurantMenu,
  createRestaurantMenuItem,
  updateRestaurantMenuItem,
  deleteRestaurantMenuItem,
  createRestaurantCategory,
  updateRestaurantCategory,
  deleteRestaurantCategory,
} from '../controllers/adminController';

const router = Router();

router.use(authenticateToken);
router.use(isAdmin);

// Dashboard overview
router.get('/overview', getDashboardOverview);

// Subscription routes
router.get('/subscriptions', validate(getSubscriptionsSchema, 'query'), getSubscriptions);
router.get('/subscriptions/pending', getPendingSubscriptions);
router.get('/subscriptions/stats', getSubscriptionStats);
router.post('/subscriptions/:subscriptionId/approve', approveSubscription);
router.post('/subscriptions/:subscriptionId/reject', validate(rejectSubscriptionSchema), rejectSubscription);

// User routes
router.get('/users', validate(getAllUsersSchema, 'query'), getAllUsers);
router.put('/users/:userId', validate(updateUserSchema), updateUser);
router.put('/restaurants/:restaurantId', validate(updateRestaurantSchema), updateRestaurant);
router.delete('/users/:userId', deleteUser);
router.delete('/restaurants/:restaurantId', deleteRestaurant);

// Menu management routes
router.get('/restaurants/:restaurantId/menu', getRestaurantMenu);
router.post('/restaurants/:restaurantId/menu-items', validate(createMenuItemSchema), createRestaurantMenuItem);
router.put('/menu-items/:itemId', validate(updateMenuItemSchema), updateRestaurantMenuItem);
router.delete('/menu-items/:itemId', deleteRestaurantMenuItem);
router.post('/restaurants/:restaurantId/categories', validate(createCategorySchema), createRestaurantCategory);
router.put('/categories/:categoryId', validate(updateCategorySchema), updateRestaurantCategory);
router.delete('/categories/:categoryId', deleteRestaurantCategory);

export default router;