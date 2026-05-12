import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. User not authenticated.' });
  }

  // Check if user has ADMIN role (roles is an array in the database)
  const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
  if (!userRoles.includes('ADMIN')) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }

  next();
};
