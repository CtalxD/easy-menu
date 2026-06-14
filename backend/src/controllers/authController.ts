// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Get JWT secrets with development fallbacks
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Warn in development if secrets are not set
if (!JWT_ACCESS_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('Warning: JWT_ACCESS_SECRET not set. Using fallback for development only.');
}

if (!JWT_REFRESH_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('Warning: JWT_REFRESH_SECRET not set. Using fallback for development only.');
}

// Only exit in production if secrets are missing
if (process.env.NODE_ENV === 'production') {
  if (!JWT_ACCESS_SECRET || JWT_ACCESS_SECRET === 'your-access-secret') {
    console.error('FATAL: JWT_ACCESS_SECRET is not properly configured in production');
    process.exit(1);
  }

  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET === 'your-refresh-secret') {
    console.error('FATAL: JWT_REFRESH_SECRET is not properly configured in production');
    process.exit(1);
  }
}

// Use fallbacks only for development
const getAccessSecret = () => {
  if (JWT_ACCESS_SECRET) return JWT_ACCESS_SECRET;
  if (process.env.NODE_ENV !== 'production') return 'access-secret-key-change-in-production';
  throw new Error('JWT_ACCESS_SECRET is required in production');
};

const getRefreshSecret = () => {
  if (JWT_REFRESH_SECRET) return JWT_REFRESH_SECRET;
  if (process.env.NODE_ENV !== 'production') return 'refresh-secret-key-change-in-production';
  throw new Error('JWT_REFRESH_SECRET is required in production');
};

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
    getAccessSecret(),
    { expiresIn: rememberMe ? '30d' : '24h' }
  );
};

const generateRefreshToken = (userId: string, rememberMe: boolean = false): string => {
  return jwt.sign(
    { userId, type: 'refresh' },
    getRefreshSecret(),
    { expiresIn: rememberMe ? '30d' : '24h' }
  );
};

// Helper function to set refresh token cookie
const setRefreshTokenCookie = (res: Response, token: string, rememberMe: boolean = false) => {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/api/auth'
  });
};

// Helper function to format user response
const formatUserResponse = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  admin: user.admin,
  verified: user.verified,
  restaurant: user.restaurants?.[0] || null,
});

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Data is already validated by Zod middleware
    const { name, email, password, restaurant } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Check if this user was created via Google (no password)
      if (!existingUser.password) {
        res.status(400).json({ 
          message: 'This email is registered with Google. Please sign in with Google or use a different email.',
          code: 'GOOGLE_ACCOUNT_EXISTS'
        });
        return;
      }
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

    setRefreshTokenCookie(res, refreshToken, false);

    res.status(201).json({
      message: 'Account created successfully',
      accessToken,
      expiresIn: 86400, // 24 hours in seconds
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Data is already validated by Zod middleware
    const { email, password, rememberMe } = req.body;

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

    // Check if this is a Google-only account
    if (!user.password) {
      res.status(401).json({ 
        message: 'This account was created with Google. Please sign in with Google.',
        code: 'GOOGLE_ACCOUNT_ONLY'
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken(user.id, rememberMe);
    const refreshToken = generateRefreshToken(user.id, rememberMe);

    setRefreshTokenCookie(res, refreshToken, rememberMe);

    res.json({
      message: 'Login successful',
      accessToken,
      expiresIn: rememberMe ? 2592000 : 86400, // 30 days or 24 hours in seconds
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    // Data is already validated by Zod middleware
    const { name, email, restaurant, rememberMe, isSignUp } = req.body;

    console.log('Google Sign-In Request:', {
      email,
      name,
      isSignUp,
    });

    // Check if user exists by email
    let user = await prisma.user.findUnique({
      where: { email },
      include: { restaurants: true },
    });

    if (user) {
      // If this is a signup flow and user already exists, return 409 Conflict
      if (isSignUp) {
        console.log('User already exists and this is signup flow');
        res.status(409).json({
          message: 'An account with this email already exists. Please sign in instead.',
          code: 'USER_ALREADY_EXISTS',
          userExists: true,
        });
        return;
      }

      // User exists and this is a login flow - log them in
      // Update name if it changed in Google
      if (user.name !== name && name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name },
          include: { restaurants: true },
        });
      }

      const accessToken = generateAccessToken(user.id, rememberMe);
      const refreshToken = generateRefreshToken(user.id, rememberMe);

      setRefreshTokenCookie(res, refreshToken, rememberMe);

      console.log('User logged in via Google:', user.email);

      res.json({
        message: 'Signed in with Google successfully',
        accessToken,
        expiresIn: rememberMe ? 2592000 : 86400,
        user: formatUserResponse(user),
        isNewUser: false,
      });
      return;
    }

    // User doesn't exist - create new account
    console.log('Creating new user via Google...');
    const newUser = await prisma.user.create({
      data: {
        name: name || email.split('@')[0],
        email,
        password: null, // No password for Google accounts
        verified: true, // Google accounts are pre-verified
        restaurants: {
          create: {
            name: restaurant || `${name || email.split('@')[0]}'s Restaurant`,
          },
        },
      },
      include: {
        restaurants: true,
      },
    });

    const accessToken = generateAccessToken(newUser.id, rememberMe);
    const refreshToken = generateRefreshToken(newUser.id, rememberMe);

    setRefreshTokenCookie(res, refreshToken, rememberMe);

    console.log('New user created via Google:', newUser.email);

    res.status(201).json({
      message: 'Account created with Google successfully',
      accessToken,
      expiresIn: rememberMe ? 2592000 : 86400,
      user: formatUserResponse(newUser),
      isNewUser: true,
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const linkGoogleAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { email } = req.body;

    // Check if the Google email is already linked to another account
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      res.status(400).json({ 
        message: 'This Google account is already linked to another EasyMenu account.',
        code: 'GOOGLE_ACCOUNT_CONFLICT'
      });
      return;
    }

    // Link Google account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurants: true },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      message: 'Google account linked successfully',
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Link Google account error:', error);
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

    let decoded: { userId: string; type: string; exp?: number };
    try {
      decoded = jwt.verify(token, getRefreshSecret()) as { userId: string; type: string; exp?: number };
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    if (decoded.type !== 'refresh') {
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

    // Calculate remaining time to determine if we should use remember me
    const now = Math.floor(Date.now() / 1000);
    const remainingTime = decoded.exp ? decoded.exp - now : 86400;
    const rememberMe = remainingTime > 86400; // If more than 24h left, it was a "remember me" token

    const newAccessToken = generateAccessToken(user.id, rememberMe);
    const newRefreshToken = generateRefreshToken(user.id, rememberMe);

    // Blacklist old refresh token
    if (decoded.exp) {
      tokenBlacklist.set(token, decoded.exp * 1000);
    }

    setRefreshTokenCookie(res, newRefreshToken, rememberMe);

    res.json({
      accessToken: newAccessToken,
      expiresIn: rememberMe ? 2592000 : 86400,
      user: formatUserResponse(user)
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
    const refreshTokenCookie = req.cookies.refreshToken;

    // Blacklist access token
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken) as { exp?: number };
        if (decoded?.exp) {
          tokenBlacklist.set(accessToken, decoded.exp * 1000);
        }
      } catch (error) {
        console.error('Error decoding access token:', error);
      }
    }

    // Blacklist refresh token
    if (refreshTokenCookie) {
      try {
        const decoded = jwt.decode(refreshTokenCookie) as { exp?: number };
        if (decoded?.exp) {
          tokenBlacklist.set(refreshTokenCookie, decoded.exp * 1000);
        }
      } catch (error) {
        console.error('Error decoding refresh token:', error);
      }
    }

    // Clear the refresh token cookie
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
      decoded = jwt.verify(token, getAccessSecret()) as { userId: string; type: string };
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
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurants: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user has a password (not Google-only)
    if (!user.password) {
      res.status(400).json({ 
        message: 'This account uses Google Sign-In and does not have a password.',
        code: 'GOOGLE_ACCOUNT_ONLY'
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // Data is already validated by Zod middleware
    const { name, email } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        restaurants: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(updatedUser)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};