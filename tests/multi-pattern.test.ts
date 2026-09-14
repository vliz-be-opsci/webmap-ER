import { describe, it, expect } from 'vitest';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { DiscoveredLink } from '../src/core/wrx/types';

describe('Comprehensive 8-Pattern RT Diagnostic Engine', () => {
  it('should evaluate all 8 patterns and report conformity status for each', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' },
      { target: 'https://example.org/metadata.jsonld', rel: 'describedby', source: 'link-header' },
      { target: 'https://doi.org/10.1234/res', rel: 'cite-as', source: 'link-header' }
    ];

    const report = evaluateHealthAndGaps('https://example.org/dataset', links);
    expect(report.patterns.length).toBe(8);

    const pt01 = report.patterns.find(p => p.patternId === 'PT-01');
    expect(pt01?.status).toBe('SATISFIED');

    const pt04 = report.patterns.find(p => p.patternId === 'PT-04');
    expect(pt04?.status).toBe('SATISFIED');

    const pt05 = report.patterns.find(p => p.patternId === 'PT-05');
    expect(pt05?.status).toBe('UNSATISFIED');
    expect(pt05?.missingRequired).toContain('service-desc');
  });

  it('should mark PT-05 as SATISFIED when service-desc is present', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/api/openapi.json', rel: 'service-desc', source: 'link-header' }
    ];

    const report = evaluateHealthAndGaps('https://example.org/api', links);
    const pt05 = report.patterns.find(p => p.patternId === 'PT-05');
    expect(pt05?.status).toBe('SATISFIED');
  });

  it('should mark PT-08 as SATISFIED when linkset is present', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/.well-known/linkset', rel: 'linkset', source: 'link-header' }
    ];

    const report = evaluateHealthAndGaps('https://example.org/res', links);
    const pt08 = report.patterns.find(p => p.patternId === 'PT-08');
    expect(pt08?.status).toBe('SATISFIED');
  });
});
