import { describe, it, expect } from 'vitest';
import { parseLinkHeader } from '../src/core/wrx/header-parser';
import { parseLinksetJson } from '../src/core/wrx/linkset';

describe('wrx Header & Linkset Parsers', () => {
  it('should parse RFC 8288 Link headers with rel, type, and profile', () => {
    const header = '<https://example.org/profile>; rel="profile", </meta.jsonld>; rel="describedby"; type="application/ld+json"';
    const links = parseLinkHeader(header, 'https://example.org/dataset');
    expect(links).toHaveLength(2);
    expect(links[0].target).toBe('https://example.org/profile');
    expect(links[0].rel).toBe('profile');
    expect(links[1].target).toBe('https://example.org/meta.jsonld');
    expect(links[1].rel).toBe('describedby');
    expect(links[1].type).toBe('application/ld+json');
  });

  it('should parse RFC 9264 application/linkset+json', () => {
    const json = {
      linkset: [
        {
          anchor: 'https://example.org/dataset',
          'describedby': [
            { href: 'https://example.org/meta.jsonld', type: 'application/ld+json' }
          ]
        }
      ]
    };
    const links = parseLinksetJson(json);
    expect(links).toHaveLength(1);
    expect(links[0].rel).toBe('describedby');
    expect(links[0].target).toBe('https://example.org/meta.jsonld');
  });
});
