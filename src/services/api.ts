import {
  User,
  NotificationItem,
  BannerSummary,
  TriageResult,
  RemediationResult,
  SystemDigestResult,
  NotificationCategory,
} from '../types/index.ts';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const storage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },
  clear(): void {
    this.removeToken();
    this.removeUser();
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(data.message || `Request failed with status ${response.status}`);
    error.statusCode = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    async register(fullName: string, username: string, password: string): Promise<{ user: User; token: string }> {
      const res: any = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, username, password }),
      });
      return res.data;
    },

    async login(username: string, password: string): Promise<{ user: User; token: string }> {
      const res: any = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      return res.data;
    },

    async getProfile(): Promise<User> {
      const res: any = await request('/api/auth/profile');
      return res.data;
    },

    async logout(): Promise<void> {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } finally {
        storage.clear();
      }
    },
  },

  notifications: {
    async getAll(isDismissed?: boolean): Promise<NotificationItem[]> {
      const query = typeof isDismissed === 'boolean' ? `?isDismissed=${isDismissed}` : '';
      const res: any = await request(`/api/notifications${query}`);
      return res.data;
    },

    async getBanners(): Promise<BannerSummary> {
      const res: any = await request('/api/notifications/banners');
      return res.data;
    },

    async getById(id: string): Promise<NotificationItem> {
      const res: any = await request(`/api/notifications/${id}`);
      return res.data;
    },

    async create(notification: {
      header: string;
      body: string;
      category: NotificationCategory;
      aiRemediation?: string | null;
      urgencyScore?: number | null;
    }): Promise<NotificationItem> {
      const res: any = await request('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notification),
      });
      return res.data;
    },

    async update(
      id: string,
      updates: {
        header?: string;
        body?: string;
        category?: NotificationCategory;
        isDismissed?: boolean;
        aiRemediation?: string | null;
        urgencyScore?: number | null;
      }
    ): Promise<NotificationItem> {
      const res: any = await request(`/api/notifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.data;
    },

    async dismiss(id: string): Promise<NotificationItem> {
      const res: any = await request(`/api/notifications/${id}/dismiss`, {
        method: 'PATCH',
      });
      return res.data;
    },

    async delete(id: string): Promise<{ success: boolean; id: string }> {
      const res: any = await request(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      return res.data;
    },
  },

  ai: {
    async triage(header: string, body: string): Promise<TriageResult> {
      const res: any = await request('/api/ai/triage', {
        method: 'POST',
        body: JSON.stringify({ header, body }),
      });
      return res.data;
    },

    async draft(prompt: string): Promise<{
      header: string;
      body: string;
      category: NotificationCategory;
      urgencyScore: number;
    }> {
      const res: any = await request('/api/ai/draft', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      return res.data;
    },

    async getRemediation(header: string, body: string, category: NotificationCategory): Promise<RemediationResult> {
      const res: any = await request('/api/ai/remediation', {
        method: 'POST',
        body: JSON.stringify({ header, body, category }),
      });
      return res.data;
    },

    async getDigest(): Promise<SystemDigestResult> {
      const res: any = await request('/api/ai/digest');
      return res.data;
    },
  },
};
