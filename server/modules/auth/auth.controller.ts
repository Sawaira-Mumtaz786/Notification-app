import { Router, Response } from 'express';
import { authService } from './auth.service.ts';
import { validateRegisterDto } from './dto/register.dto.ts';
import { validateLoginDto } from './dto/login.dto.ts';
import { authGuard, AuthenticatedRequest } from './auth.guard.ts';

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
authRouter.post('/register', async (req, res: Response) => {
  try {
    const validation = validateRegisterDto(req.body);
    if (!validation.valid) {
      res.status(400).json({
        statusCode: 400,
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    const result = await authService.register(req.body);
    res.status(201).json({
      statusCode: 201,
      message: 'User registered successfully',
      data: result,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Registration failed',
    });
  }
});

/**
 * POST /api/auth/login
 * Login with username and password
 */
authRouter.post('/login', async (req, res: Response) => {
  try {
    const validation = validateLoginDto(req.body);
    if (!validation.valid) {
      res.status(400).json({
        statusCode: 400,
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    const result = await authService.login(req.body);
    res.status(200).json({
      statusCode: 200,
      message: 'Login successful',
      data: result,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Authentication failed',
    });
  }
});

/**
 * GET /api/auth/profile
 * Get authenticated user profile
 */
authRouter.get('/profile', authGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await authService.getProfile(req.user!.userId);
    res.status(200).json({
      statusCode: 200,
      data: profile,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Failed to fetch user profile',
    });
  }
});

/**
 * POST /api/auth/logout
 * Sign out endpoint
 */
authRouter.post('/logout', (req, res: Response) => {
  res.status(200).json({
    statusCode: 200,
    message: 'Logged out successfully',
  });
});
