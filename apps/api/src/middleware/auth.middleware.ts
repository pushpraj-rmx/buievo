// Authentication Middleware
// JWT token validation and user authentication

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest } from '@whatssuite/types';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'agent' | 'admin';
  permissions?: string[];
  iat: number;
  exp: number;
}

export interface AuthOptions {
  requireAuth?: boolean;
  requireRole?: 'agent' | 'admin';
  requirePermissions?: string[];
}

/**
 * Extract JWT token from request headers
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Verify JWT token and extract payload
 */
function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const payload = jwt.verify(token, secret) as JwtPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has required role
 */
function hasRequiredRole(userRole: string, requiredRole?: string): boolean {
  if (!requiredRole) {
    return true;
  }
  
  if (requiredRole === 'admin') {
    return userRole === 'admin';
  }
  
  return userRole === 'agent' || userRole === 'admin';
}

/**
 * Check if user has required permissions
 */
function hasRequiredPermissions(
  userPermissions: string[] = [],
  requiredPermissions: string[] = []
): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }
  
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}

/**
 * Authentication middleware
 */
export function authenticate(options: AuthOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip authentication if not required
      if (!options.requireAuth) {
        return next();
      }
      
      // Extract token
      const token = extractToken(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication token required',
          },
        });
      }
      
      // Verify token
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid or expired token',
          },
        });
      }
      
      // Check role requirements
      if (!hasRequiredRole(payload.role, options.requireRole)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient role permissions',
          },
        });
      }
      
      // Check permission requirements
      if (!hasRequiredPermissions(payload.permissions, options.requirePermissions)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'AUTHORIZATION_ERROR',
            message: 'Insufficient permissions',
          },
        });
      }
      
      // Attach user to request
      (req as AuthenticatedRequest).user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
      };
      
      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication processing error',
        },
      });
    }
  };
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuth(): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);
      
      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          (req as AuthenticatedRequest).user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            permissions: payload.permissions,
          };
        }
      }
      
      next();
    } catch (error) {
      console.error('Optional authentication middleware error:', error);
      next();
    }
  };
}

/**
 * Admin-only middleware
 */
export function requireAdmin() {
  return authenticate({ requireAuth: true, requireRole: 'admin' });
}

/**
 * Agent or admin middleware
 */
export function requireAgent() {
  return authenticate({ requireAuth: true, requireRole: 'agent' });
}

/**
 * Permission-based middleware
 */
export function requirePermissions(permissions: string[]) {
  return authenticate({ 
    requireAuth: true, 
    requirePermissions: permissions 
  });
}
