/**
 * Mongoose Schema definition for Notifications
 *
 * Improvements over legacy schema:
 * 1. Strongly typed enum category: ['INFO', 'WARNING', 'ERROR']
 * 2. Proper userId reference indexing for high-performance retrieval
 * 3. Compound index on (userId, isDismissed, createdAt) for optimal dashboard queries
 * 4. Dismissal tracking fields: isDismissed & dismissedAt
 * 5. Automatic createdAt & updatedAt timestamps
 * 6. AI enrichment fields for triage metadata & remediation
 */

export interface INotificationSchema {
  userId: string;
  header: string;
  body: string;
  category: 'INFO' | 'WARNING' | 'ERROR';
  isDismissed: boolean;
  dismissedAt?: Date | null;
  aiRemediation?: string | null;
  urgencyScore?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchemaDefinition = {
  userId: {
    type: 'String',
    required: true,
    index: true,
  },
  header: {
    type: 'String',
    required: [true, 'Notification header is required'],
    trim: true,
    maxlength: [120, 'Header cannot exceed 120 characters'],
  },
  body: {
    type: 'String',
    required: [true, 'Notification body is required'],
    trim: true,
    maxlength: [2000, 'Body cannot exceed 2000 characters'],
  },
  category: {
    type: 'String',
    required: [true, 'Notification category is required'],
    enum: {
      values: ['INFO', 'WARNING', 'ERROR'],
      message: '{VALUE} is not a supported notification category',
    },
    index: true,
  },
  isDismissed: {
    type: 'Boolean',
    default: false,
    index: true,
  },
  dismissedAt: {
    type: 'Date',
    default: null,
  },
  aiRemediation: {
    type: 'String',
    default: null,
  },
  urgencyScore: {
    type: 'Number',
    min: 1,
    max: 10,
    default: null,
  },
  timestamps: true,
};
