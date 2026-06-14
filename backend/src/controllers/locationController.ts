// backend/src/controllers/locationController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getLocations = async (req: Request, res: Response): Promise<void> => {
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
    const locations = await prisma.location.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'asc' },
    });

    const maxLocations = restaurant.plan === 'PRO' || restaurant.plan === 'ENTERPRISE' ? 5 : 1;

    res.json({ locations, maxLocations });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { name, address, phone } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const restaurant = user.restaurants[0];
    
    const locationCount = await prisma.location.count({
      where: { restaurantId: restaurant.id },
    });

    const maxLocations = restaurant.plan === 'PRO' || restaurant.plan === 'ENTERPRISE' ? 5 : 1;

    if (locationCount >= maxLocations) {
      res.status(403).json({
        message: `Location limit reached. Your plan allows ${maxLocations} location(s). Upgrade to add more.`,
        code: 'LOCATION_LIMIT_REACHED',
      });
      return;
    }

    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        address,
        phone,
        restaurantId: restaurant.id,
      },
    });

    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const locationId = req.params.locationId as string;
    // Data is already validated by Zod middleware
    const { name, address, phone } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const existing = await prisma.location.findFirst({
      where: { id: locationId, restaurantId: user.restaurants[0].id },
    });

    if (!existing) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;

    const location = await prisma.location.update({
      where: { id: locationId },
      data: updateData,
    });

    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const locationId = req.params.locationId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const existing = await prisma.location.findFirst({
      where: { id: locationId, restaurantId: user.restaurants[0].id },
    });

    if (!existing) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }

    // Unlink menu items and categories from this location
    await prisma.menuItem.updateMany({
      where: { locationId: locationId },
      data: { locationId: null },
    });

    await prisma.category.updateMany({
      where: { locationId: locationId },
      data: { locationId: null },
    });

    await prisma.location.delete({ where: { id: locationId } });
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};