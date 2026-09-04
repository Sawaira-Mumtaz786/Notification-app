import { Router, Response } from 'express';
import { notificationsService } from './notifications.service.ts';
import { validateCreateNotificationDto } from './dto/create-notification.dto.ts';
import { validateUpdateNotificationDto } from './dto/update-notification.dto.ts';
import { authGuard, AuthenticatedRequest } from '../auth/auth.guard.ts';

export const notificationsRouter = Router();

// Protect all notification routes with authGuard
notificationsRouter.use(authGuard);

/**
 * GET /api/notifications
 * Fetch all notifications for logged in user (sorted most recent first)
 */
notificationsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isDismissedQuery = req.query.isDismissed;
    let isDismissed: boolean | undefined = undefined;
    if (isDismissedQuery === 'true') isDismissed = true;
    if (isDismissedQuery === 'false') isDismissed = false;

    const list = await notificationsService.findAll(req.user!.userId, { isDismissed });
    res.status(200).json({
      statusCode: 200,
      count: list.length,
      data: list,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Failed to fetch notifications',
    });
  }
});

/**
 * GET /api/notifications/banners
 * Get top 5 undismissed banners + summary count
 */
notificationsRouter.get('/banners', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await notificationsService.getBanners(req.user!.userId);
    res.status(200).json({
      statusCode: 200,
      data: summary,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Failed to fetch notification banners',
    });
  }
});

/**
 * GET /api/notifications/:id
 * Get single notification by id
 */
notificationsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await notificationsService.findOne(req.params.id, req.user!.userId);
    res.status(200).json({
      statusCode: 200,
      data: doc,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Failed to fetch notification',
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification
 */
notificationsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = validateCreateNotificationDto(req.body);
    if (!validation.valid) {
      res.status(400).json({
        statusCode: 400,
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    const doc = await notificationsService.create(req.user!.userId, req.body);
    res.status(201).json({
      statusCode: 201,
      message: 'Notification created successfully',
      data: doc,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Failed to create notification',
    });
  }
});

/**
 * PUT /api/notifications/:id
 * Edit existing notification
 */
notificationsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = validateUpdateNotificationDto(req.body);
    if (!validation.valid) {
      res.status(400).json({
        statusCode: 400,
        message: 'Validation failed',
        errors: validation.errors,
      });
      return;
    }

    const updated = await notificationsService.update(req.params.id, req.user!.userId, req.body);
    res.status(200).json({
      statusCode: 200,
      message: 'Notification updated successfully',
      data: updated,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Failed to update notification',
    });
  }
});

/**
 * PATCH /api/notifications/:id/dismiss
 * Dismiss banner notification
 */
notificationsRouter.patch('/:id/dismiss', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dismissed = await notificationsService.dismiss(req.params.id, req.user!.userId);
    res.status(200).json({
      statusCode: 200,
      message: 'Notification dismissed',
      data: dismissed,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Failed to dismiss notification',
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification permanently
 */
notificationsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await notificationsService.delete(req.params.id, req.user!.userId);
    res.status(200).json({
      statusCode: 200,
      message: 'Notification deleted successfully',
      data: result,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      statusCode,
      message: err.message || 'Failed to delete notification',
    });
  }
});
