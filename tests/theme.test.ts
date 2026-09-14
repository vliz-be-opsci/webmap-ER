// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { getInitialTheme, setTheme, toggleTheme, subscribeTheme, getStorage, THEME_STORAGE_KEY } from '../src/core/theme/theme';

describe('Theme Manager', () => {
  beforeEach(() => {
    getStorage().clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should initialize theme and set data-theme on documentElement', () => {
    const theme = getInitialTheme();
    expect(['light', 'dark']).toContain(theme);
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
  });

  it('should allow setting theme and persist to localStorage', () => {
    setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(getStorage().getItem(THEME_STORAGE_KEY)).toBe('dark');

    setTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(getStorage().getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('should toggle theme cleanly between light and dark', () => {
    setTheme('dark');
    const next = toggleTheme();
    expect(next).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    const nextAgain = toggleTheme();
    expect(nextAgain).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should notify subscribers when theme changes', () => {
    let notifiedTheme = '';
    const unsubscribe = subscribeTheme(t => { notifiedTheme = t; });
    
    setTheme('light');
    expect(notifiedTheme).toBe('light');

    unsubscribe();
    setTheme('dark');
    expect(notifiedTheme).toBe('light');
  });
});
