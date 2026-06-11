// backend/src/routes/adminRoutes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  isAdmin, 
  getPendingSubscriptions, 
  approveSubscription, 
  rejectSubscription,
  getAllUsers,
  updateUser,
  updateRestaurant,
  deleteUser,
  deleteRestaurant
} from '../controllers/adminController';

const router = Router();

router.use(authenticateToken);
router.use(isAdmin);

router.get('/subscriptions/pending', getPendingSubscriptions);
router.post('/subscriptions/:subscriptionId/approve', approveSubscription);
router.post('/subscriptions/:subscriptionId/reject', rejectSubscription);
router.get('/users', getAllUsers);
router.put('/users/:userId', updateUser);
router.put('/restaurants/:restaurantId', updateRestaurant);
router.delete('/users/:userId', deleteUser);
router.delete('/restaurants/:restaurantId', deleteRestaurant);

export default router;