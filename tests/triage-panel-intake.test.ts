// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createTriagePanel } from '../src/ui/components/triage-panel';

describe('triage-panel intake and provenance UI', () => {
  it('renders provenance audit strip and review toggle button', () => {
    const store = new AppStore();
    store.setIntakeSummary({
      recommendedPatternId: 'PT-06',
      confidence: 'high',
      scorePercent: 92,
      rationale: 'Sitemap detected',
      skippedCount: 2,
      totalCount: 3,
      auditLog: [{ target: 'https://example.org/robots.txt', status: 'SUCCESS', message: 'Retrieved' }]
    });

    const panel = createTriagePanel(store);
    expect(panel.querySelector('.provenance-audit-strip')).not.toBeNull();
    expect(panel.querySelector('#btn-toggle-review')).not.toBeNull();
    expect(panel.textContent).toContain('PT-06');
  });

  it('renders review matrix when showIntakeReview is true', () => {
    const store = new AppStore();
    store.answerQuestionWithProvenance('q1', 'profile', 'https://w3id.org/ro/crate/1.1', 'AUTO_JSONLD');
    store.toggleIntakeReview(true);

    const panel = createTriagePanel(store);
    expect(panel.querySelector('.provenance-review-matrix')).not.toBeNull();
    expect(panel.textContent).toContain('AUTO_JSONLD');
  });
});
