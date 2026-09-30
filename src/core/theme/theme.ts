export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'webmap-er-theme';
type ThemeListener = (theme: Theme) => void;
const listeners: ThemeListener[] = [];

const memoryStorage = new Map<string, string>();

export function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage;
    }
  } catch {}
  return {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => { memoryStorage.set(key, value); },
    removeItem: (key: string) => { memoryStorage.delete(key); },
    clear: () => { memoryStorage.clear(); }
  };
}

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';

  const storage = getStorage();
  const stored = storage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    applyTheme(stored);
    return stored;
  }

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial: Theme = prefersDark ? 'dark' : 'light';
  applyTheme(initial);
  return initial;
}

export function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
  const storage = getStorage();
  storage.setItem(THEME_STORAGE_KEY, theme);

  listeners.forEach(cb => {
    try {
      cb(theme);
    } catch (e) {
      console.error('Error in theme listener:', e);
    }
  });
}

export function setTheme(theme: Theme): void {
  applyTheme(theme);
}

export function toggleTheme(): Theme {
  const current = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark')
    ? 'dark'
    : 'light';
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function subscribeTheme(cb: ThemeListener): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
