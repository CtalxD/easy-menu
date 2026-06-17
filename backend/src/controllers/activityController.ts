// backend/src/controllers/activityController.ts

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      action,
      entity,
      userId,
      search,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {};

    if (action && action !== 'ALL') {
      whereClause.action = action as string;
    }

    if (entity && entity !== 'ALL') {
      whereClause.entity = entity as string;
    }

    if (userId) {
      whereClause.userId = userId as string;
    }

    if (search) {
      whereClause.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        {
          user: {
            name: { contains: search as string, mode: 'insensitive' },
          },
        },
        {
          user: {
            email: { contains: search as string, mode: 'insensitive' },
          },
        },
      ];
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate as string);
      }
    }

    const [logs, totalCount] = await Promise.all([
      prisma.activityLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              admin: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count({ where: whereClause }),
    ]);

    // Get unique actions and entities for filters
    const [uniqueActions, uniqueEntities] = await Promise.all([
      prisma.activityLog.findMany({
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' },
      }),
      prisma.activityLog.findMany({
        select: { entity: true },
        distinct: ['entity'],
        orderBy: { entity: 'asc' },
      }),
    ]);

    res.json({
      logs,
      filters: {
        actions: uniqueActions.map(a => a.action),
        entities: uniqueEntities.map(e => e.entity),
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getActivityLogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Ensure id is a string, not string[]
    const logId = Array.isArray(id) ? id[0] : id;

    const log = await prisma.activityLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            admin: true,
          },
        },
      },
    });

    if (!log) {
      res.status(404).json({ message: 'Activity log not found' });
      return;
    }

    res.json(log);
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getActivityStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);

    const [
      totalLogs,
      todayLogs,
      weekLogs,
      monthLogs,
      actionBreakdown,
      entityBreakdown,
      recentLogs,
    ] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.activityLog.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.activityLog.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.activityLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.activityLog.groupBy({
        by: ['entity'],
        _count: { entity: true },
        orderBy: { _count: { entity: 'desc' } },
      }),
      prisma.activityLog.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      overview: {
        totalLogs,
        todayLogs,
        weekLogs,
        monthLogs,
      },
      actionBreakdown: actionBreakdown.map(a => ({
        action: a.action,
        count: a._count.action,
      })),
      entityBreakdown: entityBreakdown.map(e => ({
        entity: e.entity,
        count: e._count.entity,
      })),
      recentActivity: recentLogs,
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};