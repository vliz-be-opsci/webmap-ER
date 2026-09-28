import { describe, it, expect } from 'vitest';
import { buildIntakeQuestions } from '../src/core/triage/intake-model';
import { AggregatedHostExtraction } from '../src/core/wrx/host-prober';
import { PatternClassificationResult } from '../src/core/wrx/pattern-classifier';

describe('intake-model questions and auto-skip', () => {
  it('automatically skips high confidence sitemap question for PT-06 when discovered via robots.txt', () => {
    const extraction: AggregatedHostExtraction = {
      seedUrl: 'https://example.org/dataset',
      seedExtraction: { url: 'https://example.org/dataset', status: 200, contentType: 'text/html', links: [], rdfBodies: [], trace: [], corsBlocked: false },
      robotsTxt: { sitemaps: ['https://example.org/sitemap.xml'], disallowedPaths: [], hasApiDisallows: false, hasCatalogPaths: false },
      sitemapUrl: 'https://example.org/sitemap.xml',
      auditLog: []
    };
    const classification: PatternClassificationResult = {
      recommendedPattern: 'PT-06',
      confidence: 'high',
      scorePercent: 90,
      rationale: 'Sitemap found',
      detectedSignals: []
    };

    const questions = buildIntakeQuestions(extraction, classification);
    const sitemapQ = questions.find(q => q.id === 'q-intake-sitemap');
    expect(sitemapQ).toBeDefined();
    expect(sitemapQ?.skipped).toBe(true);
    expect(sitemapQ?.source).toBe('AUTO_ROBOTS');
    expect(sitemapQ?.currentValue).toBe('https://example.org/sitemap.xml');
  });

  it('keeps question unskipped with heuristic guess when confidence is low or heuristic', () => {
    const extraction: AggregatedHostExtraction = {
      seedUrl: 'https://example.org/api/data',
      seedExtraction: { url: 'https://example.org/api/data', status: 200, contentType: 'application/json', links: [], rdfBodies: [], trace: [], corsBlocked: false },
      auditLog: []
    };
    const classification: PatternClassificationResult = {
      recommendedPattern: 'PT-05',
      confidence: 'medium',
      scorePercent: 70,
      rationale: 'URL heuristic',
      detectedSignals: []
    };

    const questions = buildIntakeQuestions(extraction, classification);
    const apiQ = questions.find(q => q.id === 'q-intake-service-desc');
    expect(apiQ).toBeDefined();
    expect(apiQ?.skipped).toBe(false);
    expect(apiQ?.source).toBe('AUTO_HEURISTIC');
  });
});
