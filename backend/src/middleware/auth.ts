// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'access-secret-key-change-in-production'
    ) as { userId: string; type: string };

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