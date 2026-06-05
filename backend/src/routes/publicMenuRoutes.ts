//backend/src/routes/publicMenuRoutes.ts

import { Router } from 'express';
import { getPublicMenu } from '../controllers/publicMenuController';

const router = Router();

// Public route - no authentication required
router.get('/:restaurantId', getPublicMenu);

export default router;