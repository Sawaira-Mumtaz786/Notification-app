export interface User {
  id: string;
  username: string;
  fullName: string;
}

export interface Notification {
  _id: string;
  header: string;
  body: string;
  category: 'INFO' | 'WARNING' | 'ERROR';
  userId: string;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateNotificationPayload = Pick<Notification, 'header' | 'body' | 'category'>;