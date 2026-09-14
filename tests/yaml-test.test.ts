import { describe, it, expect } from 'vitest';
import { generateRtTestYaml } from '../src/core/export/yaml-test';
import { DiscoveredLink } from '../src/core/wrx/types';

describe('Multi-Pattern GRMPy rt-test YAML Exporter', () => {
  it('should emit pattern test entries for PT-01, PT-04, PT-05, and PT-08', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' },
      { target: 'https://example.org/data.jsonld', rel: 'describedby', source: 'link-header' },
      { target: 'https://doi.org/10.1234/res', rel: 'cite-as', source: 'link-header' },
      { target: 'https://example.org/api/openapi.json', rel: 'service-desc', source: 'link-header' },
      { target: 'https://example.org/.well-known/linkset', rel: 'linkset', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/dataset/01', links);
    expect(yaml).toContain('type: "PT-01"');
    expect(yaml).toContain('type: "PT-04"');
    expect(yaml).toContain('type: "PT-05"');
    expect(yaml).toContain('type: "PT-08"');
  });

  it('should support PT-02, PT-03, PT-06, PT-07 when respective links exist', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/subpart', rel: 'http://schema.org/hasPart', source: 'link-header' },
      { target: 'https://example.org/data.csv', rel: 'alternate', source: 'link-header' },
      { target: 'https://example.org/item-1', rel: 'item', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/dataset/01', links);
    expect(yaml).toContain('type: "PT-02"');
    expect(yaml).toContain('type: "PT-03"');
    expect(yaml).toContain('type: "PT-06"');
  });
});
