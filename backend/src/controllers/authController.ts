// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// In production, use Redis for token blacklist with TTL
const tokenBlacklist = new Map<string, number>();

// Clean up expired tokens from blacklist every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) {
      tokenBlacklist.delete(token);
    }
  }
}, 3600000);

const generateAccessToken = (userId: string, rememberMe: boolean = false): string => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_ACCESS_SECRET || 'access-secret-key-change-in-production',
    { expiresIn: rememberMe ? '30d' : '24h' }
  );
};

const generateRefreshToken = (userId: string, rememberMe: boolean = false): string => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-production',
    { expiresIn: rememberMe ? '30d' : '24h' }
  );
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, restaurant } = req.body;

    if (!name || !email || !password || !restaurant) {
      res.status(400).json({ 
        message: 'All fields are required',
        details: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          restaurant: !restaurant ? 'Restaurant name is required' : null,
        }
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        restaurants: {
          create: {
            name: restaurant
          }
        }
      },
      include: {
        restaurants: true
      }
    });

    const accessToken = generateAccessToken(user.id, false);
    const refreshToken = generateRefreshToken(user.id, false);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/api/auth'
    });

    res.status(201).json({
      message: 'Account created successfully',
      accessToken,
      expiresIn: 86400, // 24 hours in seconds
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
         admin: user.admin,
        restaurant: user.restaurants[0]
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        restaurants: true
      }
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken(user.id, rememberMe);
    const refreshToken = generateRefreshToken(user.id, rememberMe);

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/api/auth'
    });

    res.json({
      message: 'Login successful',
      accessToken,
      expiresIn: rememberMe ? 2592000 : 86400, // 30 days or 24 hours in seconds
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        restaurant: user.restaurants[0] || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      res.status(401).json({ message: 'Refresh token not provided' });
      return;
    }

    if (tokenBlacklist.has(token)) {
      res.status(401).json({ message: 'Refresh token has been revoked' });
      return;
    }

    let decoded: { userId: string; type: string };
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-production'
      ) as { userId: string; type: string };
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    if (decoded.type !== 'refresh') {
      res.status(401).json({ message: 'Invalid token type' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const newAccessToken = generateAccessToken(user.id, false);

    res.json({
      accessToken: newAccessToken,
      expiresIn: 86400
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1];
    const refreshToken = req.cookies.refreshToken;

    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken) as { exp?: number };
        if (decoded?.exp) {
          tokenBlacklist.set(accessToken, decoded.exp * 1000);
        }
      } catch (error) {
        // Token might be malformed, still proceed with logout
      }
    }

    if (refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken) as { exp?: number };
        if (decoded?.exp) {
          tokenBlacklist.set(refreshToken, decoded.exp * 1000);
        }
      } catch (error) {
        // Token might be malformed, still proceed with logout
      }
    }

    res.clearCookie('refreshToken', {
      path: '/api/auth'
    });

    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Access token not provided' });
      return;
    }

    if (tokenBlacklist.has(token)) {
      res.status(401).json({ message: 'Token has been revoked' });
      return;
    }

    let decoded: { userId: string; type: string };
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || 'access-secret-key-change-in-production'
      ) as { userId: string; type: string };
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired access token' });
      return;
    }

    if (decoded.type !== 'access') {
      res.status(401).json({ message: 'Invalid token type' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        restaurants: true
      }
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        restaurant: user.restaurants[0] || null
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};