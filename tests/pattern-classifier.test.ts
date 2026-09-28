import { describe, it, expect } from 'vitest';
import { classifyResourcePattern } from '../src/core/wrx/pattern-classifier';
import { AggregatedHostExtraction } from '../src/core/wrx/host-prober';

describe('wrx pattern-classifier', () => {
  it('classifies PT-06 with high confidence when sitemap signposting is found', () => {
    const extraction: AggregatedHostExtraction = {
      seedUrl: 'https://example.org/dataset',
      seedExtraction: { url: 'https://example.org/dataset', status: 200, contentType: 'text/html', links: [], rdfBodies: [], trace: [], corsBlocked: false },
      sitemap: {
        isSitemapIndex: false,
        childSitemaps: [],
        urls: ['https://example.org/dataset'],
        signpostingLinks: [{ rel: 'describedby', target: 'https://example.org/d1.jsonld', source: 'sitemap-xml' }],
        detectedRelations: ['describedby']
      },
      auditLog: []
    };

    const result = classifyResourcePattern(extraction);
    expect(result.recommendedPattern).toBe('PT-06');
    expect(result.confidence).toBe('high');
    expect(result.scorePercent).toBeGreaterThanOrEqual(85);
  });

  it('classifies PT-05 when service-desc or OpenAPI endpoint is present', () => {
    const extraction: AggregatedHostExtraction = {
      seedUrl: 'https://example.org/api/v1/collections',
      seedExtraction: {
        url: 'https://example.org/api/v1/collections',
        status: 200,
        contentType: 'application/json',
        links: [{ rel: 'service-desc', target: 'https://example.org/openapi.json', source: 'link-header' }],
        rdfBodies: [],
        trace: [],
        corsBlocked: false
      },
      auditLog: []
    };

    const result = classifyResourcePattern(extraction);
    expect(result.recommendedPattern).toBe('PT-05');
    expect(result.confidence).toBe('high');
  });

  it('classifies PT-01 when rel="profile" is present on seed resource', () => {
    const extraction: AggregatedHostExtraction = {
      seedUrl: 'https://example.org/dataset',
      seedExtraction: {
        url: 'https://example.org/dataset',
        status: 200,
        contentType: 'text/html',
        links: [{ rel: 'profile', target: 'https://w3id.org/ro/crate/1.1', source: 'link-header' }],
        rdfBodies: [],
        trace: [],
        corsBlocked: false
      },
      auditLog: []
    };

    const result = classifyResourcePattern(extraction);
    expect(result.recommendedPattern).toBe('PT-01');
    expect(result.confidence).toBe('high');
  });
});
