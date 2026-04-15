import api from './api';
import { Notification, CreateNotificationPayload } from '../types';

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const response = await api.get('/notifications');
    return response.data;
  },
  async getUndismissed(): Promise<Notification[]> {
    const response = await api.get('/notifications/undismissed');
    return response.data;
  },
  async create(data: CreateNotificationPayload): Promise<Notification> {
    const response = await api.post('/notifications', data);
    return response.data;
  },
  async update(id: string, data: Partial<CreateNotificationPayload>): Promise<Notification> {
    const response = await api.patch(`/notifications/${id}`, data);
    return response.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
  async dismiss(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/dismiss`);
  },
};