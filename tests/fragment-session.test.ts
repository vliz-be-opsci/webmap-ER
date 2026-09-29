import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import {
  encodeSessionToFragment,
  decodeFragmentToState,
  encodeStateToFragment,
  decodeStateFromFragment,
  stateToSnapshot,
  snapshotToState,
  SessionSnapshot
} from '../src/core/state/fragment';

describe('Deterministic Condensed Session Fragment Sharing', () => {
  it('condenses AppState into a minimal SessionSnapshot', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    store.setActivePatternId('PT-01');
    store.answerQuestionWithProvenance('q1', 'profile', 'https://w3id.org/ro/crate/1.1', 'HUMAN', 'Selected standard');
    store.delegateToItTicket('q2', 'describedby', 'IT team required');

    const state = store.getState();
    const snapshot = stateToSnapshot(state);

    expect(snapshot.v).toBe(1);
    expect(snapshot.u).toBe('https://example.org/dataset');
    expect(snapshot.p).toBe('PT-01');
    expect(snapshot.l).toHaveLength(1);
    expect(snapshot.l[0].r).toBe('profile');
    expect(snapshot.l[0].t).toBe('https://w3id.org/ro/crate/1.1');

    // Provenance includes both normal answer and IT delegation
    expect(snapshot.pr).toHaveLength(2);
    const delegated = snapshot.pr.find(p => p.s === 'DELEGATED_IT_TICKET');
    expect(delegated).toBeDefined();
    expect(delegated?.r).toBe('describedby');
    expect(delegated?.t).toBe('(Delegated to IT Ticket)');

    // Should NOT contain runtime bloat like history, auditLog, timestamps, etc.
    expect((snapshot as any).history).toBeUndefined();
    expect((snapshot as any).intakeSummary).toBeUndefined();
    expect((snapshot as any).provenanceHistory).toBeUndefined();
  });

  it('guarantees deterministic fragment encoding for identical sessions', async () => {
    // Session A: Added profile first, then item
    const storeA = new AppStore();
    storeA.setSeedUri('https://example.org/data');
    storeA.setActivePatternId('PT-06');
    storeA.answerQuestionWithProvenance('q1', 'profile', 'https://w3id.org/ro/crate/1.1', 'HUMAN');
    storeA.answerQuestionWithProvenance('q2', 'item', 'https://example.org/item1', 'AUTO_SITEMAP');

    // Session B: Added item first, then profile (reverse order), different question IDs
    const storeB = new AppStore();
    storeB.setSeedUri('https://example.org/data');
    storeB.setActivePatternId('PT-06');
    storeB.answerQuestionWithProvenance('other-id-2', 'item', 'https://example.org/item1', 'AUTO_SITEMAP');
    storeB.answerQuestionWithProvenance('other-id-1', 'profile', 'https://w3id.org/ro/crate/1.1', 'HUMAN');

    const fragmentA = await encodeSessionToFragment(storeA.getState());
    const fragmentB = await encodeSessionToFragment(storeB.getState());

    // Both fragments must be identical byte-for-byte!
    expect(fragmentA).toBe(fragmentB);
  });

  it('losslessly round-trips state through URL fragment identifier', async () => {
    const store = new AppStore();
    store.setSeedUri('https://data.example.com/record/42');
    store.setActivePatternId('PT-02');
    store.answerQuestionWithProvenance('q1', 'cite-as', 'https://doi.org/10.5061/dryad.123', 'AUTO_JSONLD');
    store.delegateToItTicket('q2', 'author', 'Awaiting catalog update');
    store.setShowMissingLinks(false);
    store.setViewMode('extended-graph');

    const fragment = await encodeSessionToFragment(store.getState());
    expect(fragment.startsWith('#s1=') || fragment.startsWith('#raw=')).toBe(true);

    const restoredState = await decodeFragmentToState(fragment);
    expect(restoredState).not.toBeNull();
    expect(restoredState?.seedUri).toBe('https://data.example.com/record/42');
    expect(restoredState?.activePatternId).toBe('PT-02');
    expect(restoredState?.links).toHaveLength(1);
    expect(restoredState?.links?.[0].rel).toBe('cite-as');
    expect(restoredState?.links?.[0].target).toBe('https://doi.org/10.5061/dryad.123');

    // Verify IT ticket delegation is restored
    const delegated = restoredState?.provenanceHistory?.find(p => p.source === 'DELEGATED_IT_TICKET');
    expect(delegated).toBeDefined();
    expect(delegated?.rel).toBe('author');
    expect(delegated?.targetUri).toBe('(Delegated to IT Ticket)');

    // Verify UI settings restored
    expect(restoredState?.ui?.showMissingLinks).toBe(false);
    expect(restoredState?.ui?.viewMode).toBe('extended-graph');
  });

  it('safely handles corrupted or invalid fragments without throwing', async () => {
    expect(await decodeFragmentToState('')).toBeNull();
    expect(await decodeFragmentToState('#')).toBeNull();
    expect(await decodeFragmentToState('#invalid-data')).toBeNull();
    expect(await decodeFragmentToState('#s1=not-valid-base64-or-deflate!')).toBeNull();
    expect(await decodeFragmentToState('#raw=not-json')).toBeNull();
  });

  it('supports backward compatibility with legacy encodeStateToFragment / decodeStateFromFragment', async () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/legacy');
    store.answerQuestion('q1', 'profile', 'https://w3id.org/ro/crate/1.1');

    const fragment = await encodeStateToFragment(store.getState());
    const decoded = await decodeStateFromFragment(fragment);

    expect(decoded).not.toBeNull();
    expect(decoded?.seedUri).toBe('https://example.org/legacy');
    expect(decoded?.links?.[0]?.target).toBe('https://w3id.org/ro/crate/1.1');
  });

  it('losslessly preserves intakeSummary, audit checklist, and showIntakeReview flag across sessions', async () => {
    const store = new AppStore();
    store.setSeedUri('https://portal.marine-data.org/dataset/coral-01');
    store.setActivePatternId('PT-06');
    store.answerQuestionWithProvenance('q1', 'item', 'https://example.org/sitemap.xml', 'AUTO_SITEMAP');
    store.setIntakeSummary({
      recommendedPatternId: 'PT-06',
      confidence: 'high',
      scorePercent: 95,
      rationale: 'Hostwide discovery detected sitemap.xml',
      skippedCount: 2,
      totalCount: 3,
      auditLog: [
        { target: 'https://portal.marine-data.org/robots.txt', status: 'SUCCESS', message: 'Robots.txt retrieved' },
        { target: 'https://portal.marine-data.org/sitemap.xml', status: 'SUCCESS', message: 'Sitemap parsed' }
      ]
    });
    store.toggleIntakeReview(true); // User opened "View Provenance & Review" matrix

    const snapshot = stateToSnapshot(store.getState());
    expect(snapshot.is).toBeDefined();
    expect(snapshot.is?.p).toBe('PT-06');
    expect(snapshot.is?.c).toBe('high');
    expect(snapshot.is?.k).toBe(2);
    expect(snapshot.is?.a).toHaveLength(2);
    expect(snapshot.ui?.r).toBe(true);

    const fragment = await encodeSessionToFragment(store.getState());
    const restored = await decodeFragmentToState(fragment);

    expect(restored).not.toBeNull();
    expect(restored?.intakeSummary).toBeDefined();
    expect(restored?.intakeSummary?.recommendedPatternId).toBe('PT-06');
    expect(restored?.intakeSummary?.confidence).toBe('high');
    expect(restored?.intakeSummary?.skippedCount).toBe(2);
    expect(restored?.intakeSummary?.auditLog).toHaveLength(2);
    expect(restored?.intakeSummary?.auditLog[0].target).toContain('robots.txt');
    expect(restored?.ui?.showIntakeReview).toBe(true);

    // Verify restoring into another AppStore instance restores state completely
    const recipientStore = new AppStore();
    recipientStore.restoreSession(restored!);
    expect(recipientStore.getState().intakeSummary).toBeDefined();
    expect(recipientStore.getState().intakeSummary?.recommendedPatternId).toBe('PT-06');
    expect(recipientStore.getState().ui.showIntakeReview).toBe(true);
  });
});
