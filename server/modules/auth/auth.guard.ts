import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.ts';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

/**
 * JWT Authentication Guard Middleware
 * Protects routes by validating Bearer token from Authorization header
 */
export function authGuard(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      statusCode: 401,
      message: 'Authentication required. Missing or malformed Bearer token.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = authService.verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({
      statusCode: 401,
      message: err.message || 'Invalid or expired token',
    });
  }
}
