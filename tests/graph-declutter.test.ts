// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { extractResourceLinks } from '../src/core/wrx/extractor';
import { buildGraphModel, isRtRelation } from '../src/ui/graph/renderer';
import { DiscoveredLink } from '../src/core/wrx/types';

describe('Graph Decluttering & Irrelevant Link Elimination', () => {
  it('should ignore stylesheet, icon, preload, and manifest links in HTML extraction', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="/styles.css">
          <link rel="icon" href="/favicon.ico">
          <link rel="preload" href="/font.woff2" as="font">
          <link rel="manifest" href="/manifest.json">
          <link rel="profile" href="https://w3id.org/ro/crate/1.1">
          <link rel="describedby" href="https://example.org/meta.jsonld">
        </head>
        <body></body>
      </html>
    `;

    const mockFetch = async () => new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

    const res = await extractResourceLinks('https://example.org/dataset', mockFetch as any);
    const rels = res.links.map(l => l.rel);

    expect(rels).toContain('profile');
    expect(rels).toContain('describedby');
    expect(rels).not.toContain('stylesheet');
    expect(rels).not.toContain('icon');
    expect(rels).not.toContain('preload');
    expect(rels).not.toContain('manifest');
  });

  it('should filter out non-RT links from graph model nodes and edges', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' },
      { target: 'https://example.org/styles.css', rel: 'stylesheet', source: 'html-link' },
      { target: 'https://example.org/favicon.ico', rel: 'icon', source: 'html-link' },
      { target: 'https://example.org/meta.jsonld', rel: 'describedby', source: 'link-header' }
    ];

    const model = buildGraphModel('https://example.org/dataset', links);
    const nodeIds = model.nodes.map(n => n.id);

    expect(nodeIds).toContain('https://w3id.org/ro/crate/1.1');
    expect(nodeIds).toContain('https://example.org/meta.jsonld');
    expect(nodeIds).not.toContain('https://example.org/styles.css');
    expect(nodeIds).not.toContain('https://example.org/favicon.ico');
  });

  it('should identify RT relations correctly via isRtRelation helper', () => {
    expect(isRtRelation('profile')).toBe(true);
    expect(isRtRelation('describedby')).toBe(true);
    expect(isRtRelation('cite-as')).toBe(true);
    expect(isRtRelation('service-desc')).toBe(true);
    expect(isRtRelation('stylesheet')).toBe(false);
    expect(isRtRelation('icon')).toBe(false);
  });
});
