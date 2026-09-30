// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createHeader } from '../src/ui/components/header';

describe('Navbar Responsiveness & Layout Safety', () => {
  it('should render header with responsive text spans and no-wrap structure', () => {
    const store = new AppStore();
    const header = createHeader(store, () => {}, () => {});

    // Check export button has responsive text
    const exportBtn = header.querySelector('#btn-export');
    expect(exportBtn).not.toBeNull();
    expect(exportBtn?.querySelector('.btn-text-full')).not.toBeNull();
    expect(exportBtn?.querySelector('.btn-text-short')).not.toBeNull();

    // Check share button has responsive text
    const shareBtn = header.querySelector('#btn-share');
    expect(shareBtn).not.toBeNull();
    expect(shareBtn?.querySelector('.btn-text-full')).not.toBeNull();
    expect(shareBtn?.querySelector('.btn-text-short')).not.toBeNull();

    // Check view toggles have collapsible segment labels
    const segments = header.querySelectorAll('.btn-segment');
    expect(segments.length).toBe(3);
    segments.forEach(seg => {
      expect(seg.querySelector('.segment-label')).not.toBeNull();
    });

    // Check preset selector has max-width styling class
    const presetSelect = header.querySelector('#preset-select');
    expect(presetSelect).not.toBeNull();
    expect(presetSelect?.classList.contains('preset-dropdown')).toBe(true);
  });
});
