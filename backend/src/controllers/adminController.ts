// backend/src/controllers/adminController.ts

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { activityLogger } from '../services/activityLogger';

// Middleware to check if user is admin
export const isAdmin = async (req: Request, res: Response, next: Function): Promise<void> => {
  try {
    const userId = (req as any).userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.admin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all subscriptions with optional filters
export const getSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, plan, search, page, limit } = req.query;
    
    const whereClause: any = {};
    
    if (status && status !== 'ALL') {
      whereClause.paymentStatus = status;
    }
    
    if (plan && plan !== 'ALL') {
      whereClause.plan = plan;
    }
    
    if (search) {
      whereClause.restaurant = {
        owner: {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
          ],
        },
      };
    }
    
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [subscriptions, totalCount] = await Promise.all([
      prisma.subscription.findMany({
        where: whereClause,
        include: {
          restaurant: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.subscription.count({ where: whereClause }),
    ]);

    res.json({
      subscriptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all pending subscriptions (legacy endpoint)
export const getPendingSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingSubscriptions = await prisma.subscription.findMany({
      where: { paymentStatus: 'PENDING' },
      include: {
        restaurant: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
    });

    res.json(pendingSubscriptions);
  } catch (error) {
    console.error('Get pending subscriptions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get subscription statistics
export const getSubscriptionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalCount,
      pendingCount,
      completedCount,
      failedCount,
      refundedCount,
      completedSubscriptions,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.subscription.count({ where: { paymentStatus: 'COMPLETED' } }),
      prisma.subscription.count({ where: { paymentStatus: 'FAILED' } }),
      prisma.subscription.count({ where: { paymentStatus: 'REFUNDED' } }),
      prisma.subscription.findMany({
        where: { paymentStatus: 'COMPLETED' },
        select: { price: true, plan: true },
      }),
    ]);

    const totalRevenue = completedSubscriptions.reduce((sum, sub) => sum + sub.price, 0);
    
    const planBreakdown = completedSubscriptions.reduce((acc: any, sub) => {
      acc[sub.plan] = (acc[sub.plan] || 0) + sub.price;
      return acc;
    }, {});

    res.json({
      totalCount,
      pendingCount,
      completedCount,
      failedCount,
      refundedCount,
      totalRevenue,
      planBreakdown,
    });
  } catch (error) {
    console.error('Get subscription stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve a subscription
export const approveSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriptionId = req.params.subscriptionId as string;
    const adminUserId = (req as any).userId;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        restaurant: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!subscription) {
      res.status(404).json({ message: 'Subscription not found' });
      return;
    }

    if (subscription.paymentStatus !== 'PENDING') {
      res.status(400).json({ message: 'Subscription is not in pending status' });
      return;
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { 
        paymentStatus: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    await prisma.restaurant.update({
      where: { id: subscription.restaurantId },
      data: { plan: subscription.plan },
    });

    // LOG THE ACTIVITY
    await activityLogger.logSubscriptionApproved(
      adminUserId,
      subscriptionId,
      subscription.plan,
      subscription.restaurant.owner.id,
      req
    );

    res.json({ 
      message: 'Subscription approved and plan upgraded successfully',
      subscription: {
        id: subscriptionId,
        status: 'COMPLETED',
      },
    });
  } catch (error) {
    console.error('Approve subscription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reject a subscription
export const rejectSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriptionId = req.params.subscriptionId as string;
    const { reason } = req.body;
    const adminUserId = (req as any).userId;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      res.status(404).json({ message: 'Subscription not found' });
      return;
    }

    if (subscription.paymentStatus !== 'PENDING') {
      res.status(400).json({ message: 'Subscription is not in pending status' });
      return;
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { 
        paymentStatus: 'FAILED',
        updatedAt: new Date(),
      },
    });

    // LOG THE ACTIVITY
    await activityLogger.logSubscriptionRejected(
      adminUserId,
      subscriptionId,
      subscription.plan,
      reason || 'No reason provided',
      req
    );

    res.json({ 
      message: 'Subscription rejected successfully',
      subscription: {
        id: subscriptionId,
        status: 'FAILED',
        reason: reason || 'Rejected by admin',
      },
    });
  } catch (error) {
    console.error('Reject subscription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get subscription status for a user
export const getSubscriptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        restaurants: {
          include: {
            subscriptions: {
              orderBy: { purchasedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const latestSubscription = user.restaurants[0].subscriptions[0];

    res.json({
      currentPlan: user.restaurants[0].plan,
      latestSubscription: latestSubscription || null,
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all users with restaurant details
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchQuery = (req.query.search as string) || '';
    const planFilter = (req.query.plan as string) || '';
    const statusFilter = (req.query.status as string) || '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        {
          restaurants: {
            some: {
              name: { contains: searchQuery, mode: 'insensitive' }
            }
          }
        },
        {
          restaurants: {
            some: {
              phone: { contains: searchQuery, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    if (statusFilter === 'verified') {
      whereClause.verified = true;
    } else if (statusFilter === 'unverified') {
      whereClause.verified = false;
    }

    if (planFilter) {
      whereClause.restaurants = {
        some: {
          plan: planFilter
        }
      };
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          admin: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
          restaurants: {
            select: {
              id: true,
              name: true,
              plan: true,
              phone: true,
              address: true,
              description: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { restaurants: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user details
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { name, email, admin, verified } = req.body;
    const adminUserId = (req as any).userId;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        res.status(400).json({ message: 'Email already in use by another user' });
        return;
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (admin !== undefined) updateData.admin = admin;
    if (verified !== undefined) updateData.verified = verified;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        admin: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        restaurants: {
          select: {
            id: true,
            name: true,
            plan: true,
            phone: true,
            address: true,
            description: true,
            createdAt: true,
          },
        },
        _count: {
          select: { restaurants: true }
        }
      },
    });

    // LOG THE ACTIVITY
    const changes: string[] = [];
    if (name && name !== existingUser.name) changes.push(`name: ${existingUser.name} → ${name}`);
    if (email && email !== existingUser.email) changes.push(`email: ${existingUser.email} → ${email}`);
    if (admin !== undefined && admin !== existingUser.admin) changes.push(`admin: ${existingUser.admin} → ${admin}`);
    if (verified !== undefined && verified !== existingUser.verified) changes.push(`verified: ${existingUser.verified} → ${verified}`);
    
    await activityLogger.logAdminAction(
      adminUserId,
      'UPDATE_USER',
      'USER',
      userId,
      `Admin updated user ${existingUser.name} (${changes.join(', ')})`,
      req
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update restaurant details
export const updateRestaurant = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = req.params.restaurantId as string;
    const { name, phone, plan, address, description } = req.body;
    const adminUserId = (req as any).userId;

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!existingRestaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (plan) updateData.plan = plan as any;
    if (address !== undefined) updateData.address = address;
    if (description !== undefined) updateData.description = description;

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        plan: true,
        phone: true,
        address: true,
        description: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // LOG THE ACTIVITY
    const changes: string[] = [];
    if (name && name !== existingRestaurant.name) changes.push(`name: ${existingRestaurant.name} → ${name}`);
    if (plan && plan !== existingRestaurant.plan) changes.push(`plan: ${existingRestaurant.plan} → ${plan}`);
    if (address !== undefined && address !== existingRestaurant.address) changes.push('address updated');
    if (description !== undefined && description !== existingRestaurant.description) changes.push('description updated');
    
    await activityLogger.logAdminAction(
      adminUserId,
      'UPDATE_RESTAURANT',
      'RESTAURANT',
      restaurantId,
      `Admin updated restaurant ${existingRestaurant.name} (${changes.join(', ')})`,
      req
    );

    res.json({
      message: 'Restaurant updated successfully',
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete user with proper cascade handling
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const adminUserId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        restaurants: {
          select: { id: true }
        } 
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Don't allow deleting yourself
    if (userId === adminUserId) {
      res.status(400).json({ message: 'You cannot delete your own account' });
      return;
    }

    // Delete all related data for each restaurant owned by this user
    for (const restaurant of user.restaurants) {
      // Delete in order of dependencies
      await prisma.menuSchedule.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.menuView.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.subscription.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.menuItem.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.category.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.location.deleteMany({ where: { restaurantId: restaurant.id } });
    }

    // Delete verification tokens and password reset tokens
    await prisma.verificationToken.deleteMany({ where: { userId } });
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    
    // Delete activity logs for this user
    await prisma.activityLog.deleteMany({ where: { userId } });

    // Delete all restaurants owned by user
    await prisma.restaurant.deleteMany({
      where: { ownerId: userId },
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    // LOG THE ACTIVITY
    await activityLogger.logAdminAction(
      adminUserId,
      'DELETE_USER',
      'USER',
      userId,
      `Admin deleted user: ${user.name} (${user.email})`,
      req
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete restaurant
export const deleteRestaurant = async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = req.params.restaurantId as string;
    const adminUserId = (req as any).userId;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Delete related records first
    await prisma.menuSchedule.deleteMany({ where: { restaurantId } });
    await prisma.menuView.deleteMany({ where: { restaurantId } });
    await prisma.subscription.deleteMany({ where: { restaurantId } });
    await prisma.menuItem.deleteMany({ where: { restaurantId } });
    await prisma.category.deleteMany({ where: { restaurantId } });
    await prisma.location.deleteMany({ where: { restaurantId } });

    // Delete the restaurant
    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });

    // LOG THE ACTIVITY
    await activityLogger.logAdminAction(
      adminUserId,
      'DELETE_RESTAURANT',
      'RESTAURANT',
      restaurantId,
      `Admin deleted restaurant: ${restaurant.name}`,
      req
    );

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get admin dashboard overview stats
export const getDashboardOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      totalRestaurants,
      pendingSubscriptions,
      completedSubscriptions,
      totalRevenue,
      users,
      recentSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.restaurant.count(),
      prisma.subscription.count({ where: { paymentStatus: 'PENDING' } }),
      prisma.subscription.count({ where: { paymentStatus: 'COMPLETED' } }),
      prisma.subscription.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { price: true },
      }),
      prisma.user.findMany({
        select: {
          restaurants: {
            select: { plan: true },
          },
        },
      }),
      prisma.subscription.findMany({
        where: {
          OR: [
            { paymentStatus: 'PENDING' },
            { purchasedAt: { gte: weekStart } },
          ],
        },
        include: {
          restaurant: {
            include: {
              owner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { purchasedAt: 'desc' },
        take: 10,
      }),
    ]);

    // Plan distribution
    const planDistribution = {
      FREE: 0,
      STARTER: 0,
      PRO: 0,
      ENTERPRISE: 0,
    };

    users.forEach((user) => {
      user.restaurants.forEach((rest) => {
        if (planDistribution.hasOwnProperty(rest.plan)) {
          planDistribution[rest.plan as keyof typeof planDistribution]++;
        }
      });
    });

    // Recent activity
    const recentActivity = recentSubscriptions.map((sub) => ({
      type: 'subscription',
      message: sub.paymentStatus === 'PENDING'
        ? `${sub.restaurant.owner.name} requested ${sub.plan} plan`
        : `${sub.restaurant.owner.name} ${sub.paymentStatus.toLowerCase()} ${sub.plan} plan`,
      timestamp: sub.purchasedAt,
    }));

    res.json({
      totalUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      totalRestaurants,
      pendingSubscriptions,
      completedSubscriptions,
      totalRevenue: totalRevenue._sum.price || 0,
      planDistribution,
      recentActivity,
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};