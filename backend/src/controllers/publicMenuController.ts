// backend/src/controllers/publicMenuController.ts

import { Request, Response } from 'express';
import { PrismaClient, DeviceType } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORY_ORDER = [
  "Appetizers",
  "Starters",
  "Soups",
  "Salads",
  "Main Course",
  "Mains",
  "Lunch",
  "Dinner",
  "Brunch",
  "Sides",
  "Hot Drinks",
  "Cold Drinks",
  "Soft Drinks",
  "Hard Drinks",
  "Beer",
  "Wine",
  "Cocktails",
  "Mocktails",
  "Desserts",
  "Ice Cream",
];

function getDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) return 'MOBILE';
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'TABLET';
  if (/macintosh|windows|linux/.test(ua)) return 'DESKTOP';
  return 'UNKNOWN';
}

export const getPublicMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = req.params.restaurantId as string;
    const locationId = req.query.location as string || null;

    if (!restaurantId) {
      res.status(400).json({ message: 'Restaurant ID is required' });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        plan: true,
      },
    });

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Track view with device type and location (fire-and-forget, non-blocking)
    const deviceType = getDeviceType(req.headers['user-agent'] || '');
    prisma.menuView.create({
      data: {
        restaurantId: restaurant.id,
        deviceType: deviceType,
        locationId: locationId,
      }
    }).catch(err => console.error('View tracking error:', err));

    // Fetch locations for this restaurant (for the location selector)
    const locations = await prisma.location.findMany({
      where: { restaurantId: restaurantId },
      select: { id: true, name: true, address: true },
      orderBy: { name: 'asc' },
    });

    // Build category filter based on location
    const categoryFilter: any = { restaurantId: restaurantId };
    if (locationId) {
      categoryFilter.OR = [
        { locationId: locationId },
        { locationId: null },
      ];
    }

    const categories = await prisma.category.findMany({
      where: categoryFilter,
      include: {
        menuItems: {
          where: {
            status: 'available',
            ...(locationId ? {
              OR: [
                { locationId: locationId },
                { locationId: null },
              ],
            } : {}),
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const uncategorizedFilter: any = {
      restaurantId: restaurantId,
      categoryId: null,
      status: 'available',
    };
    if (locationId) {
      uncategorizedFilter.OR = [
        { locationId: locationId },
        { locationId: null },
      ];
    }

    const uncategorizedItems = await prisma.menuItem.findMany({
      where: uncategorizedFilter,
      orderBy: { createdAt: 'asc' },
    });

    const categoriesWithItems = categories.filter(cat => cat.menuItems.length > 0);

    const sortedCategories = categoriesWithItems.sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a.name);
      const indexB = CATEGORY_ORDER.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    const formattedCategories = sortedCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      items: cat.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        popular: item.popular,
      })),
    }));

    const formattedUncategorized = uncategorizedItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      popular: item.popular,
    }));

    res.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        email: restaurant.email,
        logo: restaurant.logo,
        plan: restaurant.plan,
      },
      locations,
      menu: {
        categories: formattedCategories,
        uncategorized: formattedUncategorized,
      },
    });
  } catch (error) {
    console.error('Get public menu error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};