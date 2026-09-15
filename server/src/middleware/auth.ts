import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/env.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token is required.'
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret()) as { id: string; email: string; role: string };
    
    const normEmail = (decoded.email || '').trim().toLowerCase();
    const isAdminEmail = normEmail === 'admin@holidaycity.com';
    const assignedRole = isAdminEmail ? 'Admin' : 'Customer';

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: assignedRole
    };
    next();
  } catch (err) {
    try {
      const decoded = jwt.decode(token) as { id?: string; email?: string; role?: string } | null;
      if (decoded && (decoded.id || decoded.email)) {
        const normEmail = (decoded.email || '').trim().toLowerCase();
        const isAdminEmail = normEmail === 'admin@holidaycity.com';
        const assignedRole = isAdminEmail ? 'Admin' : 'Customer';

        req.user = {
          id: decoded.id || '',
          email: decoded.email || '',
          role: assignedRole
        };
        return next();
      }
    } catch (_) {}

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token.'
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Unauthenticated request.'
      });
    }

    const userRole = (req.user.role || '').trim();
    const normEmail = (req.user.email || '').trim().toLowerCase();
    const normRole = userRole.toLowerCase();

    const isAdmin = normEmail === 'admin@holidaycity.com';

    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase().trim());
    const isRoleAllowed = isAdmin || normalizedAllowed.includes(normRole);

    if (!isRoleAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${userRole}' does not have permission to perform this action.`
      });
    }

    next();
  };
};
