// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createTriagePanel } from '../src/ui/components/triage-panel';

describe('Triage Panel Pattern Matrix & Smart Guidance', () => {
  it('should render the Pattern Matrix Strip with badges for PT-01 to PT-08', () => {
    const store = new AppStore();
    const panel = createTriagePanel(store);

    const matrix = panel.querySelector('.pattern-matrix-strip');
    expect(matrix).not.toBeNull();
    const badges = matrix?.querySelectorAll('.pattern-badge');
    expect(badges?.length).toBe(8);
  });

  it('should render the Hostwide Sitemap card when PT-06 pattern is selected', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset/01');
    const panel = createTriagePanel(store);

    const pt06Badge = panel.querySelector('.pattern-badge[data-pattern="PT-06"]') as HTMLButtonElement;
    expect(pt06Badge).not.toBeNull();
    pt06Badge.click();

    const sitemapCard = panel.querySelector('.sitemap-preview-card');
    expect(sitemapCard).not.toBeNull();
    expect(sitemapCard?.textContent).toContain('sitemap.xml');
  });
});
