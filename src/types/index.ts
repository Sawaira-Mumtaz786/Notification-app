export type NotificationCategory = 'INFO' | 'WARNING' | 'ERROR';

export interface User {
  id: string;
  fullName: string;
  username: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  header: string;
  body: string;
  category: NotificationCategory;
  isDismissed: boolean;
  dismissedAt?: string | null;
  aiRemediation?: string | null;
  urgencyScore?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerSummary {
  banners: NotificationItem[];
  hasMore: boolean;
  totalUndismissedCount: number;
}

export interface TriageResult {
  category: NotificationCategory;
  urgencyScore: number;
  refinedHeader: string;
  refinedBody: string;
  reasoning: string;
}

export interface RemediationResult {
  summary: string;
  probableRootCauses: string[];
  actionSteps: string[];
  recoveryPlaybook: string;
}

export interface SystemDigestResult {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  executiveSummary: string;
  criticalAlertsCount: number;
  warningCount: number;
  infoCount: number;
  keyInsights: string[];
  recommendedActions: string[];
}
