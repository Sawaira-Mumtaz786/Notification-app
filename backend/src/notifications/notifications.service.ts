import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) {}

  async create(createNotificationDto: CreateNotificationDto, userId: string): Promise<Notification> {
    const created = new this.notificationModel({ ...createNotificationDto, userId });
    return created.save();
  }

  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getUndismissed(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId, isClosed: false }).sort({ createdAt: -1 }).limit(5).exec();
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOne({ _id: id, userId });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto, userId: string): Promise<Notification> {
    const updated = await this.notificationModel.findOneAndUpdate({ _id: id, userId }, updateNotificationDto, { new: true });
    if (!updated) throw new NotFoundException('Notification not found');
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) throw new NotFoundException('Notification not found');
  }

  async dismiss(id: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne({ _id: id, userId }, { isClosed: true });
  }
}
