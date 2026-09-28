import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { encodeStateToFragment, decodeStateFromFragment } from '../src/core/state/fragment';

describe('State Store & Fragment Persistence', () => {
  it('should record user interaction events in history and support undo', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    store.answerQuestion('q-profile', 'profile', 'https://w3id.org/ro/crate/1.1');

    expect(store.getState().history).toHaveLength(2);
    expect(store.getState().links).toHaveLength(1);

    store.undo();
    expect(store.getState().links).toHaveLength(0);
  });

  it('should round-trip compress and decompress state to URI fragment', async () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/test');
    store.answerQuestion('q-profile', 'profile', 'https://example.org/prof');

    const fragment = await encodeStateToFragment(store.getState());
    expect(fragment.startsWith('#gz=') || fragment.startsWith('#raw=')).toBe(true);

    const recovered = await decodeStateFromFragment(fragment);
    expect(recovered).toBeDefined();
    expect(recovered?.seedUri).toBe('https://example.org/test');
    expect(recovered?.links[0].target).toBe('https://example.org/prof');
  });

  it('records provenance when an answer is saved', () => {
    const store = new AppStore();
    store.answerQuestionWithProvenance(
      'q-sitemap',
      'item',
      'https://example.org/sitemap.xml',
      'AUTO_ROBOTS',
      'Extracted from /robots.txt'
    );

    const state = store.getState();
    expect(state.links).toHaveLength(1);
    expect(state.provenanceHistory).toBeDefined();
    expect(state.provenanceHistory[0]).toMatchObject({
      rel: 'item',
      targetUri: 'https://example.org/sitemap.xml',
      source: 'AUTO_ROBOTS',
      evidence: 'Extracted from /robots.txt'
    });
  });

  it('records provenance when active pattern is changed', () => {
    const store = new AppStore();
    store.setIntakeSummary({
      recommendedPatternId: 'PT-01',
      confidence: 'medium',
      scorePercent: 70,
      rationale: 'Baseline',
      skippedCount: 0,
      totalCount: 1,
      auditLog: []
    });

    store.setActivePatternId('PT-05');
    const state = store.getState();
    expect(state.activePatternId).toBe('PT-05');
    expect(state.intakeSummary?.recommendedPatternId).toBe('PT-05');
    expect(state.provenanceHistory.some(p => p.rel === 'pattern-focus' && p.targetUri === 'PT-05')).toBe(true);
  });
});


