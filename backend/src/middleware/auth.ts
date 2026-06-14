//backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

// Only validate in production or when explicitly set
// This allows the server to start with fallbacks in development
if (!JWT_ACCESS_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    // Use a default for development if not set, but warn
    const secret = JWT_ACCESS_SECRET || 'access-secret-key-change-in-production';
    
    if (!JWT_ACCESS_SECRET && process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Warning: JWT_ACCESS_SECRET not set. Using fallback for development only.');
    }
    
    const decoded = jwt.verify(token, secret) as { userId: string; type: string };

    if (decoded.type !== 'access') {
      res.status(401).json({ message: 'Invalid token type' });
      return;
    }

    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }
    
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Optional: Middleware to check if user is verified
export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  const userId = (req as any).userId;
  
  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  
  // You can add verification check here if needed
  next();
};