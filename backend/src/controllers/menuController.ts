// backend/src/controllers/menuController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Plan, PaymentStatus, BillingCycle } from '@prisma/client';
import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const CATEGORY_ORDER = [
  "Appetizers", "Starters", "Soups", "Salads",
  "Main Course", "Mains", "Lunch", "Dinner", "Brunch", "Sides",
  "Hot Drinks", "Cold Drinks", "Soft Drinks", "Hard Drinks",
  "Beer", "Wine", "Cocktails", "Mocktails",
  "Desserts", "Ice Cream",
];

const PLAN_LIMITS: Record<string, { items: number; categories: number }> = {
  FREE: { items: 10, categories: 5 },
  STARTER: { items: 50, categories: 20 },
  PRO: { items: 999999, categories: 999999 },
  ENTERPRISE: { items: 999999, categories: 999999 },
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  STARTER: { monthly: 10, yearly: 100 },
  PRO: { monthly: 20, yearly: 200 },
  ENTERPRISE: { monthly: 30, yearly: 300 },
};

const DEFAULT_CATEGORIES_LIST = [
  "Appetizers", "Soups", "Salads", "Main Course", "Lunch", "Dinner",
  "Brunch", "Sides", "Desserts", "Ice Cream", "Hot Drinks", "Cold Drinks",
  "Soft Drinks", "Hard Drinks", "Beer", "Wine", "Cocktails", "Mocktails"
];

/**
 * Embed a logo and "EasyMenu" branding text into the center of a QR code
 * Used ONLY for FREE plan users
 */
async function embedLogoInQR(
  qrBase64: string,
  logoPath: string,
  logoSize: number = 48
): Promise<string> {
  try {
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    const qrMetadata = await sharp(qrBuffer).metadata();
    const qrSize = qrMetadata.width || 400;

    const bgSize = logoSize + 12;
    const logoBg = Buffer.from(
      `<svg width="${bgSize}" height="${bgSize}" viewBox="0 0 ${bgSize} ${bgSize}">
        <rect x="2" y="2" width="${bgSize - 4}" height="${bgSize - 4}" rx="4" fill="white" stroke="#E8E0D5" stroke-width="1"/>
      </svg>`
    );

    let logoBuffer: Buffer;
    if (fs.existsSync(logoPath)) {
      logoBuffer = await sharp(logoPath)
        .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
    } else {
      const fallbackSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${logoSize}" height="${logoSize}" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#C45E3A"/>
          <rect x="7" y="7" width="4" height="4" rx="1" fill="white"/>
          <rect x="14" y="7" width="4" height="4" rx="1" fill="white"/>
          <rect x="7" y="14" width="4" height="4" rx="1" fill="white"/>
          <path d="M14 14h4v4h-4z" fill="white" opacity="0.5"/>
        </svg>
      `);
      logoBuffer = await sharp(fallbackSvg)
        .resize(logoSize, logoSize)
        .png()
        .toBuffer();
    }

    const logoWithBg = await sharp(logoBg)
      .composite([{ input: logoBuffer, gravity: 'center' }])
      .png()
      .toBuffer();

    const left = Math.floor((qrSize - bgSize) / 2);
    const top = Math.floor((qrSize - bgSize) / 2);

    let finalQr = await sharp(qrBuffer)
      .composite([{ input: logoWithBg, top, left }])
      .png()
      .toBuffer();

    // Add "EasyMenu" branding text below the logo for FREE plan only
    const brandingSvg = Buffer.from(`
      <svg width="${qrSize}" height="${qrSize + 30}">
        <image href="data:image/png;base64,${finalQr.toString('base64')}" width="${qrSize}" height="${qrSize}"/>
        <rect x="${Math.floor(qrSize / 2 - 55)}" y="${top + bgSize + 6}" width="110" height="22" rx="4" fill="white" fill-opacity="0.9"/>
        <text x="${Math.floor(qrSize / 2)}" y="${top + bgSize + 22}" text-anchor="middle" font-family="'Outfit', sans-serif" font-size="11" font-weight="700" fill="#C45E3A">EasyMenu</text>
      </svg>
    `);
    finalQr = await sharp(brandingSvg).png().toBuffer();

    return 'data:image/png;base64,' + finalQr.toString('base64');
  } catch (error) {
    console.error('Error embedding logo in QR:', error);
    return 'data:image/png;base64,' + qrBase64;
  }
}

/**
 * Embed only a logo into the center of a QR code (NO branding watermark)
 * Used for PRO and ENTERPRISE plans custom QR generation
 */
async function embedLogoOnlyInQR(
  qrBase64: string,
  logoPath: string,
  logoSize: number = 36
): Promise<string> {
  try {
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    const qrMetadata = await sharp(qrBuffer).metadata();
    const qrSize = qrMetadata.width || 400;

    const bgSize = logoSize + 10;
    const logoBg = Buffer.from(
      `<svg width="${bgSize}" height="${bgSize}" viewBox="0 0 ${bgSize} ${bgSize}">
        <rect x="2" y="2" width="${bgSize - 4}" height="${bgSize - 4}" rx="4" fill="white" stroke="#E8E0D5" stroke-width="1"/>
      </svg>`
    );

    let logoBuffer: Buffer;
    if (fs.existsSync(logoPath)) {
      logoBuffer = await sharp(logoPath)
        .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
    } else {
      const fallbackSvg = Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${logoSize}" height="${logoSize}" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2.5" fill="#C45E3A"/>
          <rect x="7" y="7" width="4" height="4" rx="1" fill="white"/>
          <rect x="14" y="7" width="4" height="4" rx="1" fill="white"/>
          <rect x="7" y="14" width="4" height="4" rx="1" fill="white"/>
          <path d="M14 14h4v4h-4z" fill="white" opacity="0.5"/>
        </svg>
      `);
      logoBuffer = await sharp(fallbackSvg)
        .resize(logoSize, logoSize)
        .png()
        .toBuffer();
    }

    const logoWithBg = await sharp(logoBg)
      .composite([{ input: logoBuffer, gravity: 'center' }])
      .png()
      .toBuffer();

    const left = Math.floor((qrSize - bgSize) / 2);
    const top = Math.floor((qrSize - bgSize) / 2);

    const finalQr = await sharp(qrBuffer)
      .composite([{ input: logoWithBg, top, left }])
      .png()
      .toBuffer();

    return 'data:image/png;base64,' + finalQr.toString('base64');
  } catch (error) {
    console.error('Error embedding logo in QR:', error);
    return 'data:image/png;base64,' + qrBase64;
  }
}

export const getDefaultCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ categories: DEFAULT_CATEGORIES_LIST });
  } catch (error) {
    console.error('Get default categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPlanInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        restaurants: {
          include: {
            subscriptions: {
              where: { paymentStatus: 'COMPLETED' },
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

    const restaurant = user.restaurants[0];
    const plan = restaurant.plan || 'FREE';
    const itemCount = await prisma.menuItem.count({ where: { restaurantId: restaurant.id } });
    const categoryCount = await prisma.category.count({ where: { restaurantId: restaurant.id } });
    const limits = PLAN_LIMITS[plan] || { items: 10, categories: 5 };

    const activeSubscription = restaurant.subscriptions[0] || null;
    let daysRemaining = 0;
    let subscriptionStatus = 'inactive';

    if (activeSubscription) {
      const now = new Date();
      const endDate = new Date(activeSubscription.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      subscriptionStatus = daysRemaining > 0 ? 'active' : 'expired';
    }

    res.json({
      plan,
      itemCount,
      itemLimit: limits.items,
      itemRemaining: Math.max(0, limits.items - itemCount),
      categoryCount,
      categoryLimit: limits.categories,
      categoryRemaining: Math.max(0, limits.categories - categoryCount),
      isFree: plan === 'FREE',
      hasWatermark: plan === 'FREE',
      isNearItemLimit: itemCount >= limits.items - 2 && itemCount < limits.items,
      isNearCategoryLimit: categoryCount >= limits.categories - 1 && categoryCount < limits.categories,
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        plan: activeSubscription.plan,
        price: activeSubscription.price,
        billingCycle: activeSubscription.billingCycle,
        paymentStatus: activeSubscription.paymentStatus,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        purchasedAt: activeSubscription.purchasedAt,
        daysRemaining,
        status: subscriptionStatus,
      } : null,
    });
  } catch (error) {
    console.error('Get plan info error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const upgradePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { plan, billingCycle } = req.body;

    const cycle = billingCycle === 'yearly' ? 'YEARLY' : 'MONTHLY';
    const price = PLAN_PRICES[plan]?.[billingCycle === 'yearly' ? 'yearly' : 'monthly'] || 0;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const restaurant = user.restaurants[0];
    const currentPlan = restaurant.plan;

    // Check if user already has a PENDING subscription for the same plan
    const existingPendingSubscription = await prisma.subscription.findFirst({
      where: {
        restaurantId: restaurant.id,
        plan: plan as Plan,
        paymentStatus: 'PENDING',
      },
    });

    if (existingPendingSubscription) {
      res.status(400).json({
        message: `You already have a pending upgrade request for the ${plan} plan. Please wait for admin approval before submitting another request.`,
        code: 'PENDING_REQUEST_EXISTS',
        existingSubscription: {
          id: existingPendingSubscription.id,
          plan: existingPendingSubscription.plan,
          price: existingPendingSubscription.price,
          billingCycle: existingPendingSubscription.billingCycle,
          paymentStatus: existingPendingSubscription.paymentStatus,
          purchasedAt: existingPendingSubscription.purchasedAt,
        },
      });
      return;
    }

    // Check if user is already on the requested plan
    if (currentPlan === plan) {
      res.status(400).json({
        message: `You are already on the ${plan} plan.`,
        code: 'ALREADY_ON_PLAN',
      });
      return;
    }

    // Check if trying to downgrade while subscription is active
    const planOrder = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
    const currentIndex = planOrder.indexOf(currentPlan);
    const requestedIndex = planOrder.indexOf(plan);

    if (requestedIndex < currentIndex) {
      // Trying to downgrade
      const activeSubscription = await prisma.subscription.findFirst({
        where: {
          restaurantId: restaurant.id,
          paymentStatus: 'COMPLETED',
          endDate: { gt: new Date() },
        },
        orderBy: { endDate: 'desc' },
      });

      if (activeSubscription && plan === 'FREE') {
        res.status(400).json({
          message: `Your ${currentPlan} plan is still active until ${activeSubscription.endDate.toISOString().split('T')[0]}. You can only switch to FREE plan after your current subscription expires.`,
          code: 'SUBSCRIPTION_ACTIVE',
          subscriptionEndDate: activeSubscription.endDate,
        });
        return;
      }

      if (activeSubscription && plan !== 'FREE') {
        res.status(400).json({
          message: `You cannot downgrade from ${currentPlan} to ${plan} while your subscription is active.`,
          code: 'CANNOT_DOWNGRADE',
        });
        return;
      }
    }

    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create subscription with PENDING status - requires admin approval
    const subscription = await prisma.subscription.create({
      data: {
        plan: plan as Plan,
        price,
        billingCycle: cycle as BillingCycle,
        paymentStatus: 'PENDING' as PaymentStatus,
        startDate,
        endDate,
        restaurantId: restaurant.id,
      },
    });

    // DO NOT update restaurant plan yet - wait for admin approval

    const limits = PLAN_LIMITS[restaurant.plan] || { items: 10, categories: 5 };
    const itemCount = await prisma.menuItem.count({ where: { restaurantId: restaurant.id } });
    const categoryCount = await prisma.category.count({ where: { restaurantId: restaurant.id } });

    res.json({
      message: `Your upgrade request to ${plan} plan has been submitted and is pending approval. You will be notified once approved.`,
      previousPlan: currentPlan,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        price: subscription.price,
        billingCycle: subscription.billingCycle,
        paymentStatus: subscription.paymentStatus,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        purchasedAt: subscription.purchasedAt,
        status: 'pending',
      },
      planInfo: {
        plan: restaurant.plan,
        itemCount,
        itemLimit: limits.items,
        itemRemaining: Math.max(0, limits.items - itemCount),
        categoryCount,
        categoryLimit: limits.categories,
        categoryRemaining: Math.max(0, limits.categories - categoryCount),
        isFree: restaurant.plan === 'FREE',
        hasWatermark: restaurant.plan === 'FREE',
      },
    });
  } catch (error) {
    console.error('Upgrade plan error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCategoriesBulk = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { categories: categoryNames } = req.body;

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
    const categoryLimit = PLAN_LIMITS[plan]?.categories ?? 5;
    const currentCount = await prisma.category.count({ where: { restaurantId: restaurant.id } });
    const remaining = categoryLimit - currentCount;

    if (remaining <= 0) {
      res.status(403).json({
        message: `Category limit reached. You have ${currentCount}/${categoryLimit} categories. Upgrade to add more.`,
        code: 'CATEGORY_LIMIT_REACHED',
      });
      return;
    }

    const toAdd = categoryNames.slice(0, remaining);
    const notAdded = categoryNames.slice(remaining);
    const created: string[] = [];
    const skipped: string[] = [];

    for (const name of toAdd) {
      const existing = await prisma.category.findFirst({
        where: { name: name.trim(), restaurantId: restaurant.id },
      });

      if (existing) {
        skipped.push(name);
      } else {
        await prisma.category.create({
          data: { name: name.trim(), description: '', restaurantId: restaurant.id },
        });
        created.push(name);
      }
    }

    res.json({
      message: notAdded.length > 0
        ? `Added ${created.length} categories. Could not add ${notAdded.length} more (plan limit: ${categoryLimit}). Upgrade to unlock all categories.`
        : `Added ${created.length} categories successfully.`,
      created,
      skipped,
      notAdded,
      plan,
      categoryLimit,
      currentTotal: currentCount + created.length,
    });
  } catch (error) {
    console.error('Bulk create categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMenuItems = async (req: Request, res: Response): Promise<void> => {
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

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: user.restaurants[0].id },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(menuItems);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const menuItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: user.restaurants[0].id },
      include: { category: true },
    });

    if (!menuItem) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    res.json(menuItem);
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { name, description, price, categoryId, status, popular, locationId, image } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: typeof price === 'string' ? parseFloat(price) : price,
        categoryId: categoryId || null,
        status,
        popular,
        restaurantId: user.restaurants[0].id,
        locationId: locationId || null,
        image: image || null,
      },
      include: { category: true },
    });

    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { name, description, price, categoryId, status, popular, locationId, image } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const existingItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: user.restaurants[0].id },
    });

    if (!existingItem) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = typeof price === 'string' ? parseFloat(price) : price;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (status !== undefined) updateData.status = status;
    if (popular !== undefined) updateData.popular = popular;
    if (locationId !== undefined) updateData.locationId = locationId || null;
    if (image !== undefined) updateData.image = image;

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    res.json(menuItem);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const existingItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: user.restaurants[0].id },
    });

    if (!existingItem) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    await prisma.menuItem.delete({ where: { id } });
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleMenuItemStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const existingItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: user.restaurants[0].id },
    });

    if (!existingItem) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    const newStatus = existingItem.status === 'available' ? 'sold_out' : 'available';
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: { status: newStatus },
      include: { category: true },
    });

    res.json(menuItem);
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const togglePopular = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const existingItem = await prisma.menuItem.findFirst({
      where: { id, restaurantId: user.restaurants[0].id },
    });

    if (!existingItem) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: { popular: !existingItem.popular },
      include: { category: true },
    });

    res.json(menuItem);
  } catch (error) {
    console.error('Toggle popular error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const generateQRCode = async (req: Request, res: Response): Promise<void> => {
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
    const restaurantId = restaurant.id;
    const plan = restaurant.plan || 'FREE';
    const menuUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/menu/${restaurantId}`;

    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#1A1510', light: '#FFFFFF' },
    });

    const qrBase64 = qrCodeDataUrl.split(',')[1];
    const logoPath = path.join(__dirname, '..', '..', 'public', 'easymenu-logo.png');

    if (plan === 'FREE') {
      const watermarkedQR = await embedLogoInQR(qrBase64, logoPath, 48);
      res.json({
        qrCode: watermarkedQR,
        menuUrl,
        restaurantId,
        plan: 'FREE',
        hasWatermark: true,
      });
    } else {
      res.json({
        qrCode: qrCodeDataUrl,
        menuUrl,
        restaurantId,
        plan,
        hasWatermark: false,
      });
    }
  } catch (error) {
    console.error('Generate QR code error:', error);
    try {
      const userId = (req as any).userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { restaurants: true },
      });

      if (user?.restaurants[0]) {
        const restaurantId = user.restaurants[0].id;
        const menuUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/menu/${restaurantId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
          width: 400,
          margin: 2,
          color: { dark: '#1A1510', light: '#FFFFFF' },
        });

        res.json({
          qrCode: qrCodeDataUrl,
          menuUrl,
          restaurantId,
          plan: user.restaurants[0].plan || 'FREE',
          hasWatermark: false,
        });
      } else {
        res.status(500).json({ message: 'Failed to generate QR code' });
      }
    } catch (fallbackError) {
      console.error('Fallback QR generation error:', fallbackError);
      res.status(500).json({ message: 'Failed to generate QR code' });
    }
  }
};

export const generateCustomQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { fgColor, bgColor, logoSize, includeLogo } = req.body;

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
    const restaurantId = restaurant.id;

    if (plan !== 'PRO' && plan !== 'ENTERPRISE') {
      res.status(403).json({ 
        message: 'Custom QR code design is available on Pro plan and above. Please upgrade to access this feature.',
        code: 'UPGRADE_REQUIRED'
      });
      return;
    }

    const menuUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/menu/${restaurantId}`;

    const darkColor = fgColor || '#1A1510';
    const lightColor = bgColor || '#FFFFFF';
    const useLogo = includeLogo !== undefined ? includeLogo : true;
    const size = logoSize || 36;

    const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 400,
      margin: 2,
      color: { dark: darkColor, light: lightColor },
    });

    const qrBase64 = qrCodeDataUrl.split(',')[1];

    if (useLogo) {
      const logoPath = path.join(__dirname, '..', '..', 'public', 'easymenu-logo.png');
      const customQR = await embedLogoOnlyInQR(qrBase64, logoPath, size);
      res.json({
        qrCode: customQR,
        menuUrl,
        restaurantId,
        plan,
        hasWatermark: false,
        customized: true,
        colors: { fg: darkColor, bg: lightColor },
      });
    } else {
      res.json({
        qrCode: qrCodeDataUrl,
        menuUrl,
        restaurantId,
        plan,
        hasWatermark: false,
        customized: true,
        colors: { fg: darkColor, bg: lightColor },
      });
    }
  } catch (error) {
    console.error('Generate custom QR code error:', error);
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
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

    const categories = await prisma.category.findMany({
      where: { restaurantId: user.restaurants[0].id },
    });

    const sorted = categories.sort((a, b) => {
      const iA = CATEGORY_ORDER.indexOf(a.name);
      const iB = CATEGORY_ORDER.indexOf(b.name);
      if (iA !== -1 && iB !== -1) return iA - iB;
      if (iA !== -1) return -1;
      if (iB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json(sorted);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { name, description, locationId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const restaurantId = user.restaurants[0].id;
    const existing = await prisma.category.findFirst({
      where: { name: name.trim(), restaurantId },
    });

    if (existing) {
      res.json(existing);
      return;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description,
        restaurantId,
        locationId: locationId || null,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.categoryId as string;
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { name, description, locationId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const existing = await prisma.category.findFirst({
      where: { id, restaurantId: user.restaurants[0].id },
    });

    if (!existing) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (locationId !== undefined) updateData.locationId = locationId || null;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.categoryId as string;
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const existing = await prisma.category.findFirst({
      where: { id, restaurantId: user.restaurants[0].id },
    });

    if (!existing) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    await prisma.menuItem.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { name, description, phone, address } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();

    const restaurant = await prisma.restaurant.update({
      where: { id: user.restaurants[0].id },
      data: updateData,
    });

    res.json({
      message: 'Settings updated successfully',
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        phone: restaurant.phone,
        email: restaurant.email,
        logo: restaurant.logo,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const saveQRSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { qrCodeData, qrMenuUrl, customized, fgColor, bgColor, includeLogo, logoSize, frameStyle, framePrimaryColor, frameSecondaryColor, frameBackgroundColor, framedQRData } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user || !user.restaurants[0]) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Store QR settings in restaurant record
    await prisma.restaurant.update({
      where: { id: user.restaurants[0].id },
      data: {
        qrSettings: JSON.stringify({
          qrCodeData,
          qrMenuUrl,
          customized,
          fgColor,
          bgColor,
          includeLogo,
          logoSize,
          frameStyle,
          framePrimaryColor,
          frameSecondaryColor,
          frameBackgroundColor,
          framedQRData,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    res.json({ message: 'QR settings saved' });
  } catch (error) {
    console.error('Save QR settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getQRSettings = async (req: Request, res: Response): Promise<void> => {
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
    const settings = restaurant.qrSettings ? JSON.parse(restaurant.qrSettings as string) : null;

    res.json({ settings });
  } catch (error) {
    console.error('Get QR settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};