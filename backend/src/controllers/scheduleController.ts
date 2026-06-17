// backend/src/controllers/scheduleController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Execute pending schedules that have reached their scheduled time.
 * This function is called by the interval set up at the bottom of this file.
 */
export const executePendingSchedules = async (): Promise<void> => {
  try {
    const now = new Date();

    // Find all pending schedules that are due
    const pendingSchedules = await prisma.menuSchedule.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: now },
      },
    });

    for (const schedule of pendingSchedules) {
      try {
        const payload = JSON.parse(schedule.payload);

        switch (schedule.action) {
          case 'TOGGLE_ITEM_STATUS': {
            const item = await prisma.menuItem.findUnique({
              where: { id: payload.itemId },
            });
            if (item) {
              const newStatus = item.status === 'available' ? 'sold_out' : 'available';
              await prisma.menuItem.update({
                where: { id: payload.itemId },
                data: { status: newStatus },
              });
              console.log(`Schedule ${schedule.id}: Toggled status of item ${payload.itemId} to ${newStatus}`);
            }
            break;
          }

          case 'UPDATE_ITEM_PRICE': {
            await prisma.menuItem.update({
              where: { id: payload.itemId },
              data: { price: payload.newPrice },
            });
            console.log(`Schedule ${schedule.id}: Updated price of item ${payload.itemId} to ${payload.newPrice}`);
            break;
          }

          case 'TOGGLE_ITEM_POPULAR': {
            const item = await prisma.menuItem.findUnique({
              where: { id: payload.itemId },
            });
            if (item) {
              await prisma.menuItem.update({
                where: { id: payload.itemId },
                data: { popular: !item.popular },
              });
              console.log(`Schedule ${schedule.id}: Toggled popular of item ${payload.itemId} to ${!item.popular}`);
            }
            break;
          }

          case 'BULK_UPDATE': {
            if (payload.items && Array.isArray(payload.items)) {
              for (const bulkItem of payload.items) {
                if (bulkItem.itemId && bulkItem.action) {
                  if (bulkItem.action === 'TOGGLE_STATUS') {
                    const item = await prisma.menuItem.findUnique({
                      where: { id: bulkItem.itemId },
                    });
                    if (item) {
                      const newStatus = item.status === 'available' ? 'sold_out' : 'available';
                      await prisma.menuItem.update({
                        where: { id: bulkItem.itemId },
                        data: { status: newStatus },
                      });
                    }
                  } else if (bulkItem.action === 'UPDATE_PRICE' && bulkItem.newPrice !== undefined) {
                    await prisma.menuItem.update({
                      where: { id: bulkItem.itemId },
                      data: { price: bulkItem.newPrice },
                    });
                  } else if (bulkItem.action === 'TOGGLE_POPULAR') {
                    const item = await prisma.menuItem.findUnique({
                      where: { id: bulkItem.itemId },
                    });
                    if (item) {
                      await prisma.menuItem.update({
                        where: { id: bulkItem.itemId },
                        data: { popular: !item.popular },
                      });
                    }
                  }
                }
              }
            }
            console.log(`Schedule ${schedule.id}: Executed bulk update`);
            break;
          }
        }

        // Mark schedule as applied
        await prisma.menuSchedule.update({
          where: { id: schedule.id },
          data: {
            status: 'applied',
            appliedAt: new Date(),
          },
        });

        console.log(`Schedule ${schedule.id} executed successfully`);
      } catch (scheduleError) {
        console.error(`Error executing schedule ${schedule.id}:`, scheduleError);
      }
    }
  } catch (error) {
    console.error('Execute pending schedules error:', error);
  }
};

// ==================== SCHEDULE EXECUTOR ====================
// Check and execute pending schedules every minute
const SCHEDULE_CHECK_INTERVAL = 60 * 1000; // 1 minute

setInterval(async () => {
  try {
    await executePendingSchedules();
  } catch (error) {
    console.error('Schedule executor error:', error);
  }
}, SCHEDULE_CHECK_INTERVAL);

// Also run immediately when this module is loaded
executePendingSchedules().catch((error) => {
  console.error('Initial schedule execution error:', error);
});

console.log(`Schedule executor started - checking every ${SCHEDULE_CHECK_INTERVAL / 1000} seconds`);

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
    // Data is already validated by Zod middleware
    const { name, description, scheduledAt, action, payload, itemId, newPrice } = req.body;

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

    // Validate action type
    const validActions = ['TOGGLE_ITEM_STATUS', 'UPDATE_ITEM_PRICE', 'TOGGLE_ITEM_POPULAR', 'BULK_UPDATE'];
    if (!validActions.includes(action)) {
      res.status(400).json({ message: `Invalid action. Must be one of: ${validActions.join(', ')}` });
      return;
    }

    // Build payload from individual fields if not provided directly
    let finalPayload = payload;
    if (!finalPayload && itemId) {
      // Verify item belongs to restaurant
      const item = await prisma.menuItem.findFirst({
        where: { id: itemId, restaurantId: restaurant.id },
      });
      if (!item) {
        res.status(404).json({ message: 'Menu item not found' });
        return;
      }

      if (action === 'UPDATE_ITEM_PRICE') {
        if (newPrice === undefined || newPrice === null) {
          res.status(400).json({ message: 'newPrice is required for UPDATE_ITEM_PRICE' });
          return;
        }
        finalPayload = { itemId, newPrice: parseFloat(newPrice) };
      } else if (action === 'TOGGLE_ITEM_STATUS') {
        finalPayload = { itemId };
      } else if (action === 'TOGGLE_ITEM_POPULAR') {
        finalPayload = { itemId };
      }
    }

    // Validate final payload
    if (!finalPayload) {
      res.status(400).json({ message: 'Payload or itemId is required' });
      return;
    }

    const parsedPayload = typeof finalPayload === 'string' ? JSON.parse(finalPayload) : finalPayload;

    if (action === 'TOGGLE_ITEM_STATUS') {
      if (!parsedPayload.itemId) {
        res.status(400).json({ message: 'Payload must include itemId for TOGGLE_ITEM_STATUS' });
        return;
      }
    } else if (action === 'UPDATE_ITEM_PRICE') {
      if (!parsedPayload.itemId || parsedPayload.newPrice === undefined) {
        res.status(400).json({ message: 'Payload must include itemId and newPrice for UPDATE_ITEM_PRICE' });
        return;
      }
    } else if (action === 'TOGGLE_ITEM_POPULAR') {
      if (!parsedPayload.itemId) {
        res.status(400).json({ message: 'Payload must include itemId for TOGGLE_ITEM_POPULAR' });
        return;
      }
    }

    const schedule = await prisma.menuSchedule.create({
      data: {
        name,
        description,
        scheduledAt: new Date(scheduledAt),
        action,
        payload: typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload),
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