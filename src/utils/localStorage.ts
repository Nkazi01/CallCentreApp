import { User } from '../types/user';

const SESSION_KEY = 'iy-finance-session';
const SETTINGS_KEY = 'iy-finance-settings';

export interface Session {
  user: User;
  loginTime: string;
  expiresAt: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  leadNumberPrefix: string;
  currentLeadNumber: number;
}

// Session
export function getSession(): Session | null {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  const session: Session = JSON.parse(data);
  // Check if session expired
  if (new Date(session.expiresAt) < new Date()) {
    clearSession();
    return null;
  }
  return session;
}

export function saveSession(user: User): void {
  const loginTime = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  const session: Session = { user, loginTime, expiresAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Settings
export function getSettings(): Settings {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : {
    theme: 'light',
    notificationsEnabled: true,
    leadNumberPrefix: 'LEAD',
    currentLeadNumber: 0,
  };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

