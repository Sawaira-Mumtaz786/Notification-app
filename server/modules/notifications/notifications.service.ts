import { NotificationModel, INotificationDocument, NotificationCategory } from '../../database/db.ts';
import { CreateNotificationDto } from './dto/create-notification.dto.ts';
import { UpdateNotificationDto } from './dto/update-notification.dto.ts';

export interface BannerSummary {
  banners: INotificationDocument[];
  hasMore: boolean;
  totalUndismissedCount: number;
}

export class NotificationsService {
  /**
   * Get all notifications for the authenticated user, sorted most recent first.
   * Also triggers auto-dismiss for any INFO notifications older than 90s.
   */
  async findAll(userId: string, filter?: { isDismissed?: boolean }): Promise<INotificationDocument[]> {
    // Check auto-dismiss for expired INFO notifications
    await this.processExpiredInfo();
    return NotificationModel.find({ userId, isDismissed: filter?.isDismissed });
  }

  /**
   * Get top banners for the dashboard:
   * Up to 5 most recent undismissed notifications.
   * If there are more than 5 undismissed, hasMore is true.
   */
  async getBanners(userId: string): Promise<BannerSummary> {
    await this.processExpiredInfo();
    const undismissed = await NotificationModel.find({ userId, isDismissed: false });
    const banners = undismissed.slice(0, 5);
    const hasMore = undismissed.length > 5;

    return {
      banners,
      hasMore,
      totalUndismissedCount: undismissed.length,
    };
  }

  /**
   * Find single notification by id ensuring user ownership
   */
  async findOne(id: string, userId: string): Promise<INotificationDocument> {
    const doc = await NotificationModel.findById(id);
    if (!doc) {
      const error: any = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }
    if (doc.userId !== userId) {
      const error: any = new Error('Access denied to this notification');
      error.statusCode = 403;
      throw error;
    }
    return doc;
  }

  /**
   * Create a new notification
   */
  async create(userId: string, dto: CreateNotificationDto): Promise<INotificationDocument> {
    const category = dto.category.toUpperCase() as NotificationCategory;
    const doc = await NotificationModel.create({
      userId,
      header: dto.header,
      body: dto.body,
      category,
      aiRemediation: dto.aiRemediation || null,
      urgencyScore: dto.urgencyScore || null,
    });
    return doc;
  }

  /**
   * Update an existing notification
   */
  async update(id: string, userId: string, dto: UpdateNotificationDto): Promise<INotificationDocument> {
    // Verify ownership first
    await this.findOne(id, userId);

    const updateData: Partial<INotificationDocument> = {};
    if (dto.header !== undefined) updateData.header = dto.header.trim();
    if (dto.body !== undefined) updateData.body = dto.body.trim();
    if (dto.category !== undefined) {
      updateData.category = dto.category.toUpperCase() as NotificationCategory;
    }
    if (typeof dto.isDismissed === 'boolean') {
      updateData.isDismissed = dto.isDismissed;
      updateData.dismissedAt = dto.isDismissed ? new Date().toISOString() : null;
    }
    if (dto.aiRemediation !== undefined) updateData.aiRemediation = dto.aiRemediation;
    if (dto.urgencyScore !== undefined) updateData.urgencyScore = dto.urgencyScore;

    const updated = await NotificationModel.findByIdAndUpdate(id, updateData);
    if (!updated) {
      const error: any = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  /**
   * Dismiss a notification (hide from banner display)
   */
  async dismiss(id: string, userId: string): Promise<INotificationDocument> {
    await this.findOne(id, userId);
    const dismissed = await NotificationModel.dismiss(id, userId);
    if (!dismissed) {
      const error: any = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }
    return dismissed;
  }

  /**
   * Delete a notification permanently
   */
  async delete(id: string, userId: string): Promise<{ success: boolean; id: string }> {
    // Verify ownership first
    await this.findOne(id, userId);
    await NotificationModel.findByIdAndDelete(id);
    return { success: true, id };
  }

  /**
   * Automatically dismiss INFO notifications older than 90 seconds (90,000 ms)
   */
  async processExpiredInfo(): Promise<number> {
    return NotificationModel.autoDismissExpiredInfo();
  }
}

export const notificationsService = new NotificationsService();
