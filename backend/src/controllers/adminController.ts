// backend/src/controllers/adminController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// Get all pending subscriptions
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

// Approve a subscription
export const approveSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscriptionId = req.params.subscriptionId as string;

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
      data: { paymentStatus: 'COMPLETED' },
    });

    await prisma.restaurant.update({
      where: { id: subscription.restaurantId },
      data: { plan: subscription.plan },
    });

    res.json({ 
      message: 'Subscription approved and plan upgraded successfully',
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
      data: { paymentStatus: 'FAILED' },
    });

    res.json({ 
      message: 'Subscription rejected',
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
    const searchQuery = req.query.search as string || '';

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

    const users = await prisma.user.findMany({
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
    });

    res.json(users);
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

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        res.status(400).json({ message: 'Email already in use by another user' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(admin !== undefined && { admin }),
        ...(verified !== undefined && { verified }),
      },
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

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!existingRestaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(plan && { plan: plan as any }),
        ...(address !== undefined && { address }),
        ...(description !== undefined && { description }),
      },
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

    res.json({
      message: 'Restaurant updated successfully',
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Don't allow deleting yourself
    if (userId === (req as any).userId) {
      res.status(400).json({ message: 'You cannot delete your own account' });
      return;
    }

    // Delete all restaurants owned by user first
    await prisma.restaurant.deleteMany({
      where: { ownerId: userId },
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

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

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};