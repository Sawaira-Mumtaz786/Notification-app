import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/modules/auth/auth.controller.ts';
import { notificationsRouter } from './server/modules/notifications/notifications.controller.ts';
import { aiRouter } from './server/modules/ai/ai.controller.ts';
import { UserModel, NotificationModel } from './server/database/db.ts';
import bcrypt from 'bcryptjs';

const PORT = 3000;

async function seedInitialDataIfEmpty() {
  const demoUserExists = await UserModel.findOne({ username: 'demo' });
  if (!demoUserExists) {
    console.log('Seeding initial demo account and notifications...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);

    const demoUser = await UserModel.create({
      fullName: 'DevOps Lead Engineer',
      username: 'demo',
      passwordHash: hash,
    });

    // Seed 3 sample notifications (ERROR, WARNING, INFO)
    await NotificationModel.create({
      userId: demoUser.id,
      header: 'CRITICAL: Redis cluster memory usage exceeded 95%',
      body: 'Node redis-cluster-02 has breached high memory threshold. Eviction policy volatile-lru triggered. Immediate failover or scaling recommended.',
      category: 'ERROR',
      urgencyScore: 9,
      aiRemediation: '1. Check large keys using redis-cli --bigkeys\n2. Trigger manual snapshot and scale memory limit\n3. Review client connection leak in billing worker',
    });

    await NotificationModel.create({
      userId: demoUser.id,
      header: 'WARNING: Auth API latency degraded (> 450ms p99)',
      body: 'The authentication service response times have elevated from 65ms to 480ms over the past 15 minutes. Downstream database pool queue depth is rising.',
      category: 'WARNING',
      urgencyScore: 6,
      aiRemediation: '1. Check database connection pool saturation\n2. Inspect slow queries on users collection\n3. Enable read-replica routing for token verification',
    });

    await NotificationModel.create({
      userId: demoUser.id,
      header: 'INFO: Daily backup archive synced to Google Cloud Storage',
      body: 'Automated encrypted database snapshot was successfully created and verified. Archive checksum verified. This informational banner will auto-close in 90s.',
      category: 'INFO',
      urgencyScore: 2,
    });

    console.log('Seed completed successfully. Demo username: "demo", password: "password123"');
  }
}

async function startServer() {
  const app = express();

  // Core middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Seed demo data
  await seedInitialDataIfEmpty();

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'notifications-system-api',
      timestamp: new Date().toISOString(),
      database: 'mongodb-compatible-json-store',
      aiCapabilities: ['triage', 'draft', 'remediation', 'digest'],
    });
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/ai', aiRouter);

  // Global error handler for uncaught route exceptions
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.statusCode || 500).json({
      statusCode: err.statusCode || 500,
      message: err.message || 'Internal Server Error',
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
