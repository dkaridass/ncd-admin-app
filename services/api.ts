
import { Member, Event, FinanceRecord, AttendanceRecord, Department, Announcement, Resource, Task, PrayerRequest, DepartmentReport, DepartmentChatMessage } from '../types';

// Simulate network latency for a "Real Backend" feel
// Simulate network latency for a "Real Backend" feel
// Disabled for faster local development
const delay = (ms: number) => Promise.resolve();

const STORAGE_KEY_PREFIX = 'ncd_cloud_v1_';

const db = {
  get: <T>(key: string, fallback: T): T => {
    const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!data) return fallback;
    try {
      // Handle date restoration for events
      const parsed = JSON.parse(data);
      if (key === 'events') {
        return parsed.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })) as unknown as T;
      }
      return parsed;
    } catch { return fallback; }
  },
  set: (key: string, data: any) => {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  },
  clearAll: () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_KEY_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};

export const api = {
  members: {
    getAll: async () => { await delay(400); return db.get<Member[]>('members', []); },
    save: async (data: Member[]) => { await delay(600); db.set('members', data); }
  },
  finances: {
    getAll: async () => { await delay(400); return db.get<FinanceRecord[]>('finances', []); },
    save: async (data: FinanceRecord[]) => { await delay(600); db.set('finances', data); }
  },
  attendance: {
    getAll: async () => { await delay(300); return db.get<AttendanceRecord[]>('attendance', []); },
    save: async (data: AttendanceRecord[]) => { await delay(500); db.set('attendance', data); }
  },
  announcements: {
    getAll: async () => { await delay(300); return db.get<Announcement[]>('announcements', []); },
    save: async (data: Announcement[]) => { await delay(500); db.set('announcements', data); }
  },
  tasks: {
    getAll: async () => { await delay(300); return db.get<Task[]>('tasks', []); },
    save: async (data: Task[]) => { await delay(500); db.set('tasks', data); }
  },
  prayerRequests: {
    getAll: async () => { await delay(300); return db.get<PrayerRequest[]>('prayerRequests', []); },
    save: async (data: PrayerRequest[]) => { await delay(500); db.set('prayerRequests', data); }
  },
  resources: {
    getAll: async () => { await delay(300); return db.get<Resource[]>('resources', []); },
    save: async (data: Resource[]) => { await delay(500); db.set('resources', data); }
  },
  events: {
    getAll: async () => { await delay(400); return db.get<Event[]>('events', []); },
    save: async (data: Event[]) => { await delay(600); db.set('events', data); }
  },
  departments: {
    getAll: async () => { await delay(400); return db.get<Department[]>('departments', []); },
    save: async (data: Department[]) => { await delay(500); db.set('departments', data); }
  },
  reports: {
    getAll: async () => { await delay(300); return db.get<DepartmentReport[]>('reports', []); },
    save: async (data: DepartmentReport[]) => { await delay(500); db.set('reports', data); }
  },
  chat: {
    getAll: async () => { await delay(200); return db.get<DepartmentChatMessage[]>('chat', []); },
    save: async (data: DepartmentChatMessage[]) => { await delay(300); db.set('chat', data); }
  },
  system: {
    checkHealth: async () => {
      await delay(200);
      return { status: 'online', latency: '28ms', region: 'Africa/Lubumbashi', lastSync: new Date().toISOString() };
    },
    exportDatabase: () => {
      const allData: Record<string, any> = {};
      Object.keys(localStorage)
        .filter(k => k.startsWith(STORAGE_KEY_PREFIX))
        .forEach(k => {
          allData[k.replace(STORAGE_KEY_PREFIX, '')] = JSON.parse(localStorage.getItem(k) || '{}');
        });
      return JSON.stringify(allData, null, 2);
    },
    importDatabase: (json: string) => {
      try {
        const data = JSON.parse(json);
        db.clearAll();
        Object.entries(data).forEach(([key, value]) => {
          db.set(key, value);
        });
        return true;
      } catch (e) {
        console.error("Import failed", e);
        return false;
      }
    },
    resetToDefaults: () => {
      db.clearAll();
      window.location.reload();
    }
  }
};
