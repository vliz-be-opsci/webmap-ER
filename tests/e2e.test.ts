import { describe, it, expect } from 'vitest';
import { decodeStateFromFragment, encodeStateToFragment } from '../src/core/state/fragment';
import { AppStore } from '../src/core/state/store';
import { SAMPLE_PRESETS } from '../src/core/rt/presets';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { generateSystemicItTicket } from '../src/core/export/it-ticket';

describe('End-to-End State & Triage Workflow', () => {
  it('should initialize store, handle preset, diagnose, prescribe, and persist to URL fragment', async () => {
    const store = new AppStore();
    const preset = SAMPLE_PRESETS[0]; // ARMS-MBON
    store.setSeedUri(preset.uris.resource);
    
    // Initial evaluation
    const initialReport = evaluateHealthAndGaps(preset.uris.resource, store.getState().links);
    expect(initialReport.score).toBeLessThan(50);

    // Prescribe profile
    store.answerQuestion('q-profile-0', 'profile', preset.uris.profile);
    // Prescribe metadata
    store.answerQuestion('q-describedby-1', 'describedby', preset.uris.metadata);

    const updatedReport = evaluateHealthAndGaps(preset.uris.resource, store.getState().links);
    expect(updatedReport.score).toBeGreaterThanOrEqual(55);

    // Generate Systemic IT Ticket
    const ticket = generateSystemicItTicket(updatedReport, store.getState().links);
    expect(ticket).toContain('[Architecture / Interoperability]');
    expect(ticket).toContain(preset.uris.profile);

    // Fragment round-trip
    const fragment = await encodeStateToFragment(store.getState());
    const restored = await decodeStateFromFragment(fragment);

    expect(restored).toBeDefined();
    expect(restored?.seedUri).toBe(preset.uris.resource);
    expect(restored?.links.some(l => l.target === preset.uris.profile)).toBe(true);
  });
});
