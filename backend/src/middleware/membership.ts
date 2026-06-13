// backend/src/middleware/membership.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const PLAN_LIMITS: Record<string, { items: number; categories: number }> = {
  FREE: { items: 10, categories: 5 },
  STARTER: { items: 50, categories: 20 },
  PRO: { items: 999999, categories: 999999 },
  ENTERPRISE: { items: 999999, categories: 999999 },
};

export const checkItemLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.method !== 'POST') {
      next();
      return;
    }

    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const restaurant = user.restaurants[0];
    const plan = restaurant.plan || 'FREE';
    const limit = PLAN_LIMITS[plan]?.items ?? 10;
    const itemCount = await prisma.menuItem.count({ where: { restaurantId: restaurant.id } });

    if (itemCount >= limit) {
      res.status(403).json({
        message: `You've reached the ${plan.toLowerCase()} plan limit of ${limit} items. Upgrade to add more.`,
        code: 'ITEM_LIMIT_REACHED',
        currentPlan: plan,
        itemLimit: limit,
        currentItems: itemCount,
        remaining: 0,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Item limit check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const checkCategoryLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.method !== 'POST') {
      next();
      return;
    }

    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const restaurant = user.restaurants[0];
    const plan = restaurant.plan || 'FREE';
    const limit = PLAN_LIMITS[plan]?.categories ?? 5;
    const categoryCount = await prisma.category.count({ where: { restaurantId: restaurant.id } });

    if (categoryCount >= limit) {
      res.status(403).json({
        message: `You've reached the ${plan.toLowerCase()} plan limit of ${limit} categories. Upgrade to add more.`,
        code: 'CATEGORY_LIMIT_REACHED',
        currentPlan: plan,
        categoryLimit: limit,
        currentCategories: categoryCount,
        remaining: 0,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Category limit check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};