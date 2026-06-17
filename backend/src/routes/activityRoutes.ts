// backend/src/routes/activityRoutes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { isAdmin } from '../controllers/adminController';
import { validate } from '../middleware/validate';
import { getActivityLogsSchema } from '../validators/activityValidators';
import { getActivityLogs, getActivityLogById, getActivityStats } from '../controllers/activityController';

const router = Router();

// All activity routes require authentication and admin access
router.use(authenticateToken);
router.use(isAdmin);

router.get('/logs', validate(getActivityLogsSchema, 'query'), getActivityLogs);
router.get('/logs/stats', getActivityStats);
router.get('/logs/:id', getActivityLogById);

export default router;