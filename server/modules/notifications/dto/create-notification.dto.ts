import { NotificationCategory } from '../../../database/db.ts';

export interface CreateNotificationDto {
  header: string;
  body: string;
  category: NotificationCategory;
  aiRemediation?: string | null;
  urgencyScore?: number | null;
}

const ALLOWED_CATEGORIES: NotificationCategory[] = ['INFO', 'WARNING', 'ERROR'];

export function validateCreateNotificationDto(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const { header, body, category } = data;

  if (!header || typeof header !== 'string' || header.trim().length === 0) {
    errors.push('Notification header is required');
  } else if (header.trim().length > 120) {
    errors.push('Notification header cannot exceed 120 characters');
  }

  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    errors.push('Notification body is required');
  } else if (body.trim().length > 2000) {
    errors.push('Notification body cannot exceed 2000 characters');
  }

  if (!category || typeof category !== 'string') {
    errors.push('Notification category is required (INFO, WARNING, ERROR)');
  } else if (!ALLOWED_CATEGORIES.includes(category.toUpperCase() as NotificationCategory)) {
    errors.push(`Invalid category: '${category}'. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
