import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export type NotificationCategory = 'INFO' | 'WARNING' | 'ERROR';

export interface IUserDocument {
  id: string;
  fullName: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface INotificationDocument {
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

interface IDatabaseData {
  users: IUserDocument[];
  notifications: INotificationDocument[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'notifications_store.json');

// Memory cache backed by disk
let memoryStore: IDatabaseData = {
  users: [],
  notifications: [],
};

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryStore = JSON.parse(raw);
    } else {
      saveDataFile();
    }
  } catch (err) {
    console.error('Failed to read database file, initializing empty store:', err);
    memoryStore = { users: [], notifications: [] };
  }
}

function saveDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
}

// Initialize on module load
ensureDataFile();

export const UserModel = {
  async findOne(query: { username?: string; id?: string }): Promise<IUserDocument | null> {
    const user = memoryStore.users.find(u => {
      if (query.username && u.username.toLowerCase() === query.username.toLowerCase()) return true;
      if (query.id && u.id === query.id) return true;
      return false;
    });
    return user ? { ...user } : null;
  },

  async findById(id: string): Promise<IUserDocument | null> {
    const user = memoryStore.users.find(u => u.id === id);
    return user ? { ...user } : null;
  },

  async create(data: { fullName: string; username: string; passwordHash: string }): Promise<IUserDocument> {
    const newUser: IUserDocument = {
      id: crypto.randomUUID(),
      fullName: data.fullName.trim(),
      username: data.username.trim().toLowerCase(),
      passwordHash: data.passwordHash,
      createdAt: new Date().toISOString(),
    };
    memoryStore.users.push(newUser);
    saveDataFile();
    return { ...newUser };
  },

  async countDocuments(): Promise<number> {
    return memoryStore.users.length;
  }
};

export const NotificationModel = {
  async find(filter: { userId?: string; isDismissed?: boolean }): Promise<INotificationDocument[]> {
    let results = memoryStore.notifications.filter(n => {
      if (filter.userId && n.userId !== filter.userId) return false;
      if (typeof filter.isDismissed === 'boolean' && n.isDismissed !== filter.isDismissed) return false;
      return true;
    });
    // Sort most-recent first
    return results
      .map(n => ({ ...n }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async findById(id: string): Promise<INotificationDocument | null> {
    const found = memoryStore.notifications.find(n => n.id === id);
    return found ? { ...found } : null;
  },

  async create(data: {
    userId: string;
    header: string;
    body: string;
    category: NotificationCategory;
    aiRemediation?: string | null;
    urgencyScore?: number | null;
  }): Promise<INotificationDocument> {
    const now = new Date().toISOString();
    const newDoc: INotificationDocument = {
      id: crypto.randomUUID(),
      userId: data.userId,
      header: data.header.trim(),
      body: data.body.trim(),
      category: data.category,
      isDismissed: false,
      dismissedAt: null,
      aiRemediation: data.aiRemediation || null,
      urgencyScore: data.urgencyScore || null,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.notifications.push(newDoc);
    saveDataFile();
    return { ...newDoc };
  },

  async findByIdAndUpdate(
    id: string,
    updates: Partial<Omit<INotificationDocument, 'id' | 'userId' | 'createdAt'>>
  ): Promise<INotificationDocument | null> {
    const index = memoryStore.notifications.findIndex(n => n.id === id);
    if (index === -1) return null;

    const existing = memoryStore.notifications[index];
    const updatedDoc: INotificationDocument = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.notifications[index] = updatedDoc;
    saveDataFile();
    return { ...updatedDoc };
  },

  async findByIdAndDelete(id: string): Promise<INotificationDocument | null> {
    const index = memoryStore.notifications.findIndex(n => n.id === id);
    if (index === -1) return null;
    const deleted = memoryStore.notifications.splice(index, 1)[0];
    saveDataFile();
    return { ...deleted };
  },

  async dismiss(id: string, userId: string): Promise<INotificationDocument | null> {
    const index = memoryStore.notifications.findIndex(n => n.id === id && n.userId === userId);
    if (index === -1) return null;
    memoryStore.notifications[index].isDismissed = true;
    memoryStore.notifications[index].dismissedAt = new Date().toISOString();
    memoryStore.notifications[index].updatedAt = new Date().toISOString();
    saveDataFile();
    return { ...memoryStore.notifications[index] };
  },

  async autoDismissExpiredInfo(): Promise<number> {
    // Dismiss INFO notifications older than 90 seconds
    const now = Date.now();
    let count = 0;
    for (const n of memoryStore.notifications) {
      if (n.category === 'INFO' && !n.isDismissed) {
        const createdTime = new Date(n.createdAt).getTime();
        if (now - createdTime >= 90 * 1000) {
          n.isDismissed = true;
          n.dismissedAt = new Date().toISOString();
          n.updatedAt = new Date().toISOString();
          count++;
        }
      }
    }
    if (count > 0) {
      saveDataFile();
    }
    return count;
  }
};
