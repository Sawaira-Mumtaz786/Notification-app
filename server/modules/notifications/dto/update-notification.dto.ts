import { NotificationCategory } from '../../../database/db.ts';

export interface UpdateNotificationDto {
  header?: string;
  body?: string;
  category?: NotificationCategory;
  isDismissed?: boolean;
  aiRemediation?: string | null;
  urgencyScore?: number | null;
}

const ALLOWED_CATEGORIES: NotificationCategory[] = ['INFO', 'WARNING', 'ERROR'];

export function validateUpdateNotificationDto(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const { header, body, category } = data;

  if (header !== undefined) {
    if (typeof header !== 'string' || header.trim().length === 0) {
      errors.push('Notification header cannot be empty');
    } else if (header.trim().length > 120) {
      errors.push('Notification header cannot exceed 120 characters');
    }
  }

  if (body !== undefined) {
    if (typeof body !== 'string' || body.trim().length === 0) {
      errors.push('Notification body cannot be empty');
    } else if (body.trim().length > 2000) {
      errors.push('Notification body cannot exceed 2000 characters');
    }
  }

  if (category !== undefined) {
    if (typeof category !== 'string' || !ALLOWED_CATEGORIES.includes(category.toUpperCase() as NotificationCategory)) {
      errors.push(`Invalid category: '${category}'. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
