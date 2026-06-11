//backend/src/routes/adminRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
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
router.get('/subscriptions', getSubscriptions);
router.get('/subscriptions/pending', getPendingSubscriptions);
router.get('/subscriptions/stats', getSubscriptionStats);
router.post('/subscriptions/:subscriptionId/approve', approveSubscription);
router.post('/subscriptions/:subscriptionId/reject', rejectSubscription);

// User routes
router.get('/users', getAllUsers);
router.put('/users/:userId', updateUser);
router.put('/restaurants/:restaurantId', updateRestaurant);
router.delete('/users/:userId', deleteUser);
router.delete('/restaurants/:restaurantId', deleteRestaurant);

export default router;