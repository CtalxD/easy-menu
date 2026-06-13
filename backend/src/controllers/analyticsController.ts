// backend/src/controllers/analyticsController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { DeviceType } from '@prisma/client';

function getDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) return 'MOBILE';
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'TABLET';
  if (/macintosh|windows|linux/.test(ua)) return 'DESKTOP';
  return 'UNKNOWN';
}

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
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
    const locationId = req.query.locationId as string | undefined;

    // Only STARTER and above get analytics
    if (plan === 'FREE') {
      res.status(403).json({ 
        message: 'Analytics is available on Starter plan and above. Please upgrade to access this feature.',
        code: 'UPGRADE_REQUIRED'
      });
      return;
    }

    const viewFilter: any = { restaurantId: restaurant.id };
    if (locationId) viewFilter.locationId = locationId;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);

    // Total views (all time)
    const totalViews = await prisma.menuView.count({ where: viewFilter });

    // Today's views
    const todayViews = await prisma.menuView.count({
      where: { ...viewFilter, viewedAt: { gte: todayStart } },
    });

    // This week's views
    const weekViews = await prisma.menuView.count({
      where: { ...viewFilter, viewedAt: { gte: weekStart } },
    });

    // This month's views
    const monthViews = await prisma.menuView.count({
      where: { ...viewFilter, viewedAt: { gte: monthStart } },
    });

    // Device breakdown (STARTER and above)
    const deviceBreakdown = {
      MOBILE: await prisma.menuView.count({ where: { ...viewFilter, deviceType: 'MOBILE' } }),
      TABLET: await prisma.menuView.count({ where: { ...viewFilter, deviceType: 'TABLET' } }),
      DESKTOP: await prisma.menuView.count({ where: { ...viewFilter, deviceType: 'DESKTOP' } }),
      UNKNOWN: await prisma.menuView.count({ where: { ...viewFilter, deviceType: 'UNKNOWN' } }),
    };

    // Last 7 days breakdown (daily)
    const dailyViewsRaw = await prisma.menuView.findMany({
      where: { ...viewFilter, viewedAt: { gte: weekStart } },
      select: { viewedAt: true },
      orderBy: { viewedAt: 'asc' },
    });

    const dailyBreakdown: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyBreakdown[key] = 0;
    }

    dailyViewsRaw.forEach((v: { viewedAt: Date }) => {
      const key = v.viewedAt.toISOString().split('T')[0];
      if (dailyBreakdown[key] !== undefined) {
        dailyBreakdown[key]++;
      }
    });

    // Peak hour analysis (PRO and above)
    let hourlyBreakdown: Record<string, number> | null = null;
    if (plan === 'PRO' || plan === 'ENTERPRISE') {
      const hourlyRaw = await prisma.menuView.findMany({
        where: { ...viewFilter, viewedAt: { gte: weekStart } },
        select: { viewedAt: true },
      });

      hourlyBreakdown = {};
      for (let h = 0; h < 24; h++) {
        hourlyBreakdown[String(h)] = 0;
      }

      hourlyRaw.forEach((v: { viewedAt: Date }) => {
        const hour = v.viewedAt.getHours();
        hourlyBreakdown![String(hour)]++;
      });
    }

    // Last 30 days breakdown (PRO and above)
    let monthlyBreakdown: Record<string, number> | null = null;
    if (plan === 'PRO' || plan === 'ENTERPRISE') {
      const monthlyViewsRaw = await prisma.menuView.findMany({
        where: { ...viewFilter, viewedAt: { gte: monthStart } },
        select: { viewedAt: true },
        orderBy: { viewedAt: 'asc' },
      });

      monthlyBreakdown = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        monthlyBreakdown[key] = 0;
      }

      monthlyViewsRaw.forEach((v: { viewedAt: Date }) => {
        const key = v.viewedAt.toISOString().split('T')[0];
        if (monthlyBreakdown![key] !== undefined) {
          monthlyBreakdown![key]++;
        }
      });
    }

    // Category popularity (PRO and above)
    let categoryPopularity: { name: string; itemCount: number }[] | null = null;
    if (plan === 'PRO' || plan === 'ENTERPRISE') {
      const categories = await prisma.category.findMany({
        where: { restaurantId: restaurant.id },
        include: { _count: { select: { menuItems: true } } },
        orderBy: { menuItems: { _count: 'desc' } },
        take: 10,
      });
      categoryPopularity = categories.map((c) => ({
        name: c.name,
        itemCount: c._count.menuItems,
      }));
    }

    // Popular items
    const popularItems = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id, popular: true },
      select: { id: true, name: true, price: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Available items count
    const availableItems = await prisma.menuItem.count({
      where: { restaurantId: restaurant.id, status: 'available' },
    });

    // Total items count
    const totalItems = await prisma.menuItem.count({
      where: { restaurantId: restaurant.id },
    });

    res.json({
      plan,
      overview: {
        totalViews,
        todayViews,
        weekViews,
        monthViews,
        availableItems,
        totalItems,
      },
      dailyBreakdown,
      deviceBreakdown,
      hourlyBreakdown,
      monthlyBreakdown,
      categoryPopularity,
      popularItems,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const exportAnalyticsCSV = async (req: Request, res: Response): Promise<void> => {
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

    // Only PRO and above get CSV export
    if (plan !== 'PRO' && plan !== 'ENTERPRISE') {
      res.status(403).json({ 
        message: 'CSV export is available on Pro plan and above. Please upgrade to access this feature.',
        code: 'UPGRADE_REQUIRED'
      });
      return;
    }

    const locationId = req.query.locationId as string | undefined;
    const viewFilter: any = { restaurantId: restaurant.id };
    if (locationId) viewFilter.locationId = locationId;

    const now = new Date();
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);

    const views = await prisma.menuView.findMany({
      where: { ...viewFilter, viewedAt: { gte: monthStart } },
      orderBy: { viewedAt: 'desc' },
      select: {
        id: true,
        deviceType: true,
        viewedAt: true,
        locationId: true,
      },
    });

    const csvHeader = 'Date,Time,Device Type,Location ID\n';
    const csvRows = views.map((v) => {
      const date = v.viewedAt.toISOString().split('T')[0];
      const time = v.viewedAt.toISOString().split('T')[1].split('.')[0];
      return `${date},${time},${v.deviceType},${v.locationId || 'N/A'}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-export-${now.toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};