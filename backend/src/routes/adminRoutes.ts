// backend/src/routes/adminRoutes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  isAdmin, 
  getPendingSubscriptions, 
  approveSubscription, 
  rejectSubscription,
  getAllUsers 
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(isAdmin);

// Get all pending subscriptions
router.get('/subscriptions/pending', getPendingSubscriptions);

// Approve a subscription
router.post('/subscriptions/:subscriptionId/approve', approveSubscription);

// Reject a subscription
router.post('/subscriptions/:subscriptionId/reject', rejectSubscription);

// Get all users
router.get('/users', getAllUsers);

export default router;  