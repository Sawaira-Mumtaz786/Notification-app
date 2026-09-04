import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationsService } from '../server/modules/notifications/notifications.service.ts';
import { validateCreateNotificationDto } from '../server/modules/notifications/dto/create-notification.dto.ts';

describe('NotificationsService & DTOs', () => {
  const service = new NotificationsService();
  const mockUserId = `user_${Date.now()}`;
  let createdNotificationId = '';

  describe('Create Notification DTO Validation', () => {
    it('should reject invalid category', () => {
      const result = validateCreateNotificationDto({
        header: 'Test Alert',
        body: 'Body text',
        category: 'INVALID_CAT',
      });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('Invalid category')));
    });

    it('should reject missing header or body', () => {
      const result = validateCreateNotificationDto({
        header: '',
        body: '',
        category: 'INFO',
      });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 2);
    });

    it('should accept valid INFO, WARNING, and ERROR payloads', () => {
      for (const cat of ['INFO', 'WARNING', 'ERROR']) {
        const result = validateCreateNotificationDto({
          header: `Valid ${cat} Alert`,
          body: 'System performance within normal baseline',
          category: cat,
        });
        assert.strictEqual(result.valid, true);
      }
    });
  });

  describe('CRUD Operations & Business Rules', () => {
    it('should create an ERROR notification', async () => {
      const doc = await service.create(mockUserId, {
        header: 'Database connection failed',
        body: 'PostgreSQL instance unreachable on port 5432 after network split',
        category: 'ERROR',
        urgencyScore: 9,
      });

      assert.ok(doc.id);
      assert.strictEqual(doc.userId, mockUserId);
      assert.strictEqual(doc.category, 'ERROR');
      assert.strictEqual(doc.isDismissed, false);
      createdNotificationId = doc.id;
    });

    it('should list notifications sorted most-recent first', async () => {
      // Create a second notification
      await service.create(mockUserId, {
        header: 'Cache warmed up',
        body: 'Memcached keys reloaded',
        category: 'INFO',
      });

      const list = await service.findAll(mockUserId);
      assert.ok(list.length >= 2);
      // Ensure sorted descending by date
      const t0 = new Date(list[0].createdAt).getTime();
      const t1 = new Date(list[1].createdAt).getTime();
      assert.ok(t0 >= t1, 'Must be sorted most recent first');
    });

    it('should update an existing notification', async () => {
      const updated = await service.update(createdNotificationId, mockUserId, {
        header: 'Database connection recovered',
        category: 'INFO',
      });

      assert.strictEqual(updated.header, 'Database connection recovered');
      assert.strictEqual(updated.category, 'INFO');
    });

    it('should dismiss a notification from active banners', async () => {
      const dismissed = await service.dismiss(createdNotificationId, mockUserId);
      assert.strictEqual(dismissed.isDismissed, true);
      assert.ok(dismissed.dismissedAt);
    });

    it('should delete a notification', async () => {
      const res = await service.delete(createdNotificationId, mockUserId);
      assert.strictEqual(res.success, true);

      // Subsequent query must fail with 404
      await assert.rejects(
        async () => {
          await service.findOne(createdNotificationId, mockUserId);
        },
        { statusCode: 404 }
      );
    });

    it('should prevent cross-user access (unauthorized user cannot update or delete)', async () => {
      const doc = await service.create(mockUserId, {
        header: 'User specific alert',
        body: 'Confidential notification',
        category: 'WARNING',
      });

      const attackerId = 'different_hacker_user_id';
      await assert.rejects(
        async () => {
          await service.findOne(doc.id, attackerId);
        },
        { statusCode: 403 }
      );

      await assert.rejects(
        async () => {
          await service.delete(doc.id, attackerId);
        },
        { statusCode: 403 }
      );
    });
  });
});
