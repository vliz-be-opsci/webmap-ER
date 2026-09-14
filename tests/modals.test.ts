// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createExportModal } from '../src/ui/components/export-modal';
import { createTutorialModal } from '../src/ui/components/tutorial-modal';

describe('Modal Dialogs & Remediation Code Blocks', () => {
  it('should render export modal with accessible tabs and no emojis', () => {
    const store = new AppStore();
    const modal = createExportModal(store, () => {});
    
    expect(modal.querySelector('[role="tablist"]')).not.toBeNull();
    expect(modal.querySelectorAll('[role="tab"]').length).toBe(4);
    expect(modal.innerHTML).not.toContain('📋');
    expect(modal.innerHTML).not.toContain('✕'); // uses SVG close icon
  });

  it('should render tutorial modal with clinical workflow diagram and no emojis', () => {
    const modal = createTutorialModal(() => {});
    expect(modal.innerHTML).not.toContain('✚'); // uses SVG emblem
    expect(modal.innerHTML).not.toContain('✕'); // uses SVG close icon
    expect(modal.querySelector('.tutorial-steps')).not.toBeNull();
  });
});
