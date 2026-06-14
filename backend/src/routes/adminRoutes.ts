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

export default router;