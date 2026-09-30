import { describe, it, expect } from 'vitest';
import { detectSmartMetadata } from '../src/core/wrx/smart-detector';
import { ExtractionResult } from '../src/core/wrx/types';

describe('Smart Linked Data & Profile Extractor', () => {
  it('should extract profile and PID from embedded JSON-LD conformsTo and identifier', () => {
    const mockExtraction: ExtractionResult = {
      url: 'https://example.org/dataset/01',
      status: 200,
      contentType: 'text/html',
      links: [],
      rdfBodies: [
        {
          format: 'application/ld+json',
          source: 'embedded-script',
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            'conformsTo': 'https://w3id.org/ro/crate/1.1',
            'identifier': 'https://doi.org/10.1234/sample-01'
          })
        }
      ],
      trace: [],
      corsBlocked: false
    };

    const inference = detectSmartMetadata(mockExtraction);
    expect(inference.hasLinkedData).toBe(true);
    expect(inference.detectedProfiles.some(p => p.uri === 'https://w3id.org/ro/crate/1.1')).toBe(true);
    expect(inference.detectedPids.some(p => p.uri === 'https://doi.org/10.1234/sample-01')).toBe(true);
  });

  it('should extract profile inferred from @context string or array', () => {
    const mockExtraction: ExtractionResult = {
      url: 'https://example.org/ro-crate',
      status: 200,
      contentType: 'application/ld+json',
      links: [],
      rdfBodies: [
        {
          format: 'application/ld+json',
          source: 'conneg',
          content: JSON.stringify({
            '@context': 'https://w3id.org/ro/crate/1.1/context',
            '@graph': [
              {
                '@id': 'ro-crate-metadata.json',
                '@type': 'CreativeWork'
              }
            ]
          })
        }
      ],
      trace: [],
      corsBlocked: false
    };

    const inference = detectSmartMetadata(mockExtraction);
    expect(inference.hasLinkedData).toBe(true);
    expect(inference.detectedProfiles.some(p => p.uri.includes('ro/crate/1.1'))).toBe(true);
  });

  it('should detect API signatures and recommend PT-05 Subsetting API', () => {
    const mockExtraction: ExtractionResult = {
      url: 'https://example.org/api/v1',
      status: 200,
      contentType: 'application/json',
      links: [
        { target: 'https://example.org/api/openapi.json', rel: 'service-desc', source: 'link-header' }
      ],
      rdfBodies: [],
      trace: [],
      corsBlocked: false
    };

    const inference = detectSmartMetadata(mockExtraction);
    expect(inference.recommendedPatternFocus).toBe('PT-05');
    expect(inference.detectedApis.length).toBeGreaterThan(0);
  });

  it('should flag hasLinkedData as false when no RDF headers or bodies exist', () => {
    const mockExtraction: ExtractionResult = {
      url: 'https://example.org/plain-html',
      status: 200,
      contentType: 'text/html',
      links: [],
      rdfBodies: [],
      trace: [],
      corsBlocked: false
    };

    const inference = detectSmartMetadata(mockExtraction);
    expect(inference.hasLinkedData).toBe(false);
  });
});
