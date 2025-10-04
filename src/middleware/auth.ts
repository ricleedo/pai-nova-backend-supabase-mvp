import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase';
import logger from '../config/logger';
import { UserRole } from '../types';

interface JwtPayload {
  userId: string;
  role: UserRole;
  email?: string;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ success: false, error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.userId)
      .maybeSingle();

    if (error || !user) {
      res.status(403).json({ success: false, error: 'Invalid token' });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('id', decoded.userId)
        .maybeSingle();

      if (user) {
        (req as any).user = user;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
