// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { parseSitemapXml } from '../src/core/wrx/sitemap-parser';

describe('wrx sitemap-parser', () => {
  it('parses standard sitemap with xhtml:link signposting tags', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
              xmlns:xhtml="http://www.w3.org/1999/xhtml">
        <url>
          <loc>https://example.org/dataset/01</loc>
          <xhtml:link rel="describedby" type="application/ld+json" href="https://example.org/dataset/01.jsonld"/>
          <xhtml:link rel="item" href="https://example.org/dataset/01/item-1"/>
        </url>
        <url>
          <loc>https://example.org/dataset/02</loc>
          <xhtml:link rel="profile" href="https://w3id.org/ro/crate/1.1"/>
        </url>
      </urlset>`;

    const res = parseSitemapXml(xml, 'https://example.org/sitemap.xml');
    expect(res.isSitemapIndex).toBe(false);
    expect(res.urls).toHaveLength(2);
    expect(res.signpostingLinks).toHaveLength(3);
    expect(res.detectedRelations).toContain('describedby');
    expect(res.detectedRelations).toContain('item');
    expect(res.detectedRelations).toContain('profile');
  });

  it('detects sitemapindex structure', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap>
          <loc>https://example.org/sitemap-datasets.xml</loc>
        </sitemap>
      </sitemapindex>`;

    const res = parseSitemapXml(xml, 'https://example.org/sitemap.xml');
    expect(res.isSitemapIndex).toBe(true);
    expect(res.childSitemaps).toContain('https://example.org/sitemap-datasets.xml');
  });

  it('handles invalid XML safely', () => {
    const res = parseSitemapXml('<not valid xml', 'https://example.org');
    expect(res.urls).toEqual([]);
    expect(res.signpostingLinks).toEqual([]);
  });
});
