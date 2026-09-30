// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { initLayout } from '../src/ui/layout';

describe('UI Layout & View Mode Switching', () => {
  it('should initialize split-pane layout and apply view mode classes', () => {
    const container = document.createElement('div');
    const store = new AppStore();
    initLayout(container, store);

    expect(container.querySelector('.split-container')).toBeDefined();
    store.setViewMode('extended-triage');
    expect(container.querySelector('.split-container')?.classList.contains('mode-extended-triage')).toBe(true);
  });
});
