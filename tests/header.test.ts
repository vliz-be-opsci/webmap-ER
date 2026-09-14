// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createHeader } from '../src/ui/components/header';
import { setTheme } from '../src/core/theme/theme';

describe('Header Component Redesign', () => {
  beforeEach(() => {
    setTheme('dark');
  });

  it('should render brand cross emblem, SVG view switchers, and theme toggle without emojis', () => {
    const store = new AppStore();
    const header = createHeader(store, () => {}, () => {});
    
    expect(header.querySelector('.brand-emblem')).toBeDefined();
    expect(header.querySelector('#btn-theme-toggle')).toBeDefined();
    expect(header.querySelector('#btn-view-balanced svg')).toBeDefined();
    
    // Check no emojis in header text
    expect(header.innerHTML).not.toContain('📋');
    expect(header.innerHTML).not.toContain('⚖️');
    expect(header.innerHTML).not.toContain('🕸️');
    expect(header.innerHTML).not.toContain('🔗');
    expect(header.innerHTML).not.toContain('❓');
  });

  it('should toggle theme when theme button is clicked', () => {
    const store = new AppStore();
    const header = createHeader(store, () => {}, () => {});
    const btn = header.querySelector('#btn-theme-toggle') as HTMLButtonElement;
    expect(btn).toBeDefined();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    btn.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
