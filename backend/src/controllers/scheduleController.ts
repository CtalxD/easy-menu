// backend/src/controllers/scheduleController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Only PRO and above get menu scheduling
    if (plan !== 'PRO' && plan !== 'ENTERPRISE') {
      res.status(403).json({ 
        message: 'Menu scheduling is available on Pro plan and above. Please upgrade to access this feature.',
        code: 'UPGRADE_REQUIRED'
      });
      return;
    }

    const schedules = await prisma.menuSchedule.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(schedules);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, description, scheduledAt, action, payload } = req.body;

    if (!name || !scheduledAt || !action || !payload) {
      res.status(400).json({ message: 'Name, scheduledAt, action, and payload are required' });
      return;
    }

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

    if (plan !== 'PRO' && plan !== 'ENTERPRISE') {
      res.status(403).json({ 
        message: 'Menu scheduling is available on Pro plan and above. Please upgrade to access this feature.',
        code: 'UPGRADE_REQUIRED'
      });
      return;
    }

    // Validate scheduledAt is in the future
    if (new Date(scheduledAt) <= new Date()) {
      res.status(400).json({ message: 'Scheduled time must be in the future' });
      return;
    }

    // Validate action type
    const validActions = ['TOGGLE_ITEM_STATUS', 'UPDATE_ITEM_PRICE', 'TOGGLE_ITEM_POPULAR', 'BULK_UPDATE'];
    if (!validActions.includes(action)) {
      res.status(400).json({ message: `Invalid action. Must be one of: ${validActions.join(', ')}` });
      return;
    }

    const schedule = await prisma.menuSchedule.create({
      data: {
        name,
        description: description || '',
        scheduledAt: new Date(scheduledAt),
        action,
        payload: JSON.stringify(payload),
        restaurantId: restaurant.id,
      },
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const scheduleId = req.params.scheduleId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const existing = await prisma.menuSchedule.findFirst({
      where: { id: scheduleId, restaurantId: user.restaurants[0].id },
    });

    if (!existing) {
      res.status(404).json({ message: 'Schedule not found' });
      return;
    }

    await prisma.menuSchedule.delete({ where: { id: scheduleId } });
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};