import { Router, Response } from 'express';
import { aiService } from './ai.service.ts';
import { authGuard, AuthenticatedRequest } from '../auth/auth.guard.ts';
import { notificationsService } from '../notifications/notifications.service.ts';

export const aiRouter = Router();

// Protect AI endpoints with authGuard
aiRouter.use(authGuard);

/**
 * POST /api/ai/triage
 * Classify severity, refine text, and predict category
 */
aiRouter.post('/triage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { header = '', body = '' } = req.body || {};
    if (!body && !header) {
      res.status(400).json({
        statusCode: 400,
        message: 'At least header or body is required for AI triage',
      });
      return;
    }

    const result = await aiService.triage(header, body);
    res.status(200).json({
      statusCode: 200,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      statusCode: 500,
      message: err.message || 'AI Triage processing failed',
    });
  }
});

/**
 * POST /api/ai/draft
 * Draft complete notification from prompt
 */
aiRouter.post('/draft', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        statusCode: 400,
        message: 'A prompt string is required to draft a notification',
      });
      return;
    }

    const draft = await aiService.draftNotification(prompt);
    res.status(200).json({
      statusCode: 200,
      data: draft,
    });
  } catch (err: any) {
    res.status(500).json({
      statusCode: 500,
      message: err.message || 'AI draft generation failed',
    });
  }
});

/**
 * POST /api/ai/remediation
 * Generate root cause and recovery playbook for an alert
 */
aiRouter.post('/remediation', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { header = '', body = '', category = 'WARNING' } = req.body || {};
    const playbook = await aiService.generateRemediation(header, body, category);
    res.status(200).json({
      statusCode: 200,
      data: playbook,
    });
  } catch (err: any) {
    res.status(500).json({
      statusCode: 500,
      message: err.message || 'Failed to generate remediation playbook',
    });
  }
});

/**
 * GET /api/ai/digest
 * Executive digest across user's active notifications
 */
aiRouter.get('/digest', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await notificationsService.findAll(req.user!.userId);
    const digest = await aiService.generateDigest(notifications);
    res.status(200).json({
      statusCode: 200,
      data: digest,
    });
  } catch (err: any) {
    res.status(500).json({
      statusCode: 500,
      message: err.message || 'Failed to generate system digest',
    });
  }
});
