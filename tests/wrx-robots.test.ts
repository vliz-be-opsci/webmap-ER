import { describe, it, expect } from 'vitest';
import { parseRobotsTxt } from '../src/core/wrx/robots-parser';

describe('wrx robots-parser', () => {
  it('extracts single and multiple sitemap directives with comments stripped', () => {
    const robots = `
      # Global robots.txt
      User-agent: *
      Disallow: /api/private/
      Disallow: /catalog/drafts/
      
      Sitemap: https://example.org/sitemap.xml
      sitemap: /relative-sitemap.xml # inline comment
    `;

    const res = parseRobotsTxt(robots, 'https://example.org/dataset');
    expect(res.sitemaps).toHaveLength(2);
    expect(res.sitemaps[0]).toBe('https://example.org/sitemap.xml');
    expect(res.sitemaps[1]).toBe('https://example.org/relative-sitemap.xml');
    expect(res.hasApiDisallows).toBe(true);
    expect(res.hasCatalogPaths).toBe(true);
  });

  it('handles empty or malformed content safely', () => {
    const res = parseRobotsTxt('', 'https://example.org');
    expect(res.sitemaps).toEqual([]);
    expect(res.disallowedPaths).toEqual([]);
    expect(res.hasApiDisallows).toBe(false);
  });
});
