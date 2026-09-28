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

  it('should execute end-to-end hostwide intake, auto-skip, pattern deduction, and provenance persistence', async () => {
    const store = new AppStore();
    const seedUri = 'https://portal.marine-data.org/dataset/coral-01';

    // Simulated hostwide extraction
    const mockExtraction = {
      seedUrl: seedUri,
      seedExtraction: {
        url: seedUri,
        status: 200,
        contentType: 'text/html',
        links: [{ rel: 'describedby', target: 'https://portal.marine-data.org/meta/coral-01.jsonld', source: 'link-header' as const }],
        rdfBodies: [],
        trace: [],
        corsBlocked: false
      },
      robotsTxt: {
        sitemaps: ['https://portal.marine-data.org/sitemap.xml'],
        disallowedPaths: ['/api/private'],
        hasApiDisallows: true,
        hasCatalogPaths: false
      },
      sitemap: {
        isSitemapIndex: false,
        childSitemaps: [],
        urls: [seedUri],
        signpostingLinks: [
          { rel: 'item', target: 'https://portal.marine-data.org/dataset/coral-01/specimen-1', source: 'sitemap-xml' as const }
        ],
        detectedRelations: ['item']
      },
      sitemapUrl: 'https://portal.marine-data.org/sitemap.xml',
      auditLog: [{ target: 'https://portal.marine-data.org/robots.txt', status: 'SUCCESS' as const, message: 'Found' }]
    };

    const { classifyResourcePattern } = await import('../src/core/wrx/pattern-classifier');
    const { buildIntakeQuestions } = await import('../src/core/triage/intake-model');

    const classification = classifyResourcePattern(mockExtraction);
    expect(classification.recommendedPattern).toBe('PT-06');
    expect(classification.confidence).toBe('high');

    const questions = buildIntakeQuestions(mockExtraction, classification);
    const skipped = questions.filter(q => q.skipped);
    expect(skipped.length).toBeGreaterThan(0);

    // Apply auto-resolved answers
    for (const q of questions) {
      if (q.skipped && q.currentValue) {
        store.answerQuestionWithProvenance(q.id, q.rel || 'describedby', q.currentValue, q.source, q.evidence);
      }
    }

    store.setActivePatternId(classification.recommendedPattern);
    store.setIntakeSummary({
      recommendedPatternId: classification.recommendedPattern,
      confidence: classification.confidence,
      scorePercent: classification.scorePercent,
      rationale: classification.rationale,
      skippedCount: skipped.length,
      totalCount: questions.length,
      auditLog: mockExtraction.auditLog
    });

    const state = store.getState();
    expect(state.activePatternId).toBe('PT-06');
    expect(state.provenanceHistory.length).toBeGreaterThan(0);
    expect(state.provenanceHistory.some(p => p.source === 'AUTO_ROBOTS')).toBe(true);
    expect(state.intakeSummary?.recommendedPatternId).toBe('PT-06');
  });
});

