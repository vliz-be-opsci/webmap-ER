// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { probeHostwideResource } from '../src/core/wrx/host-prober';

describe('wrx host-prober', () => {
  it('probes seed, robots.txt, and sitemap.xml concurrently', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://example.org/dataset') {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'text/html', 'Link': '<https://example.org/dataset.jsonld>; rel="describedby"' }),
          text: () => Promise.resolve('<html><head></head><body>Dataset</body></html>')
        });
      }
      if (url === 'https://example.org/robots.txt') {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'text/plain' }),
          text: () => Promise.resolve('Sitemap: https://example.org/sitemap.xml\nDisallow: /api')
        });
      }
      if (url === 'https://example.org/sitemap.xml') {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/xml' }),
          text: () => Promise.resolve('<urlset><url><loc>https://example.org/dataset</loc></url></urlset>')
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    const result = await probeHostwideResource('https://example.org/dataset', mockFetch as any);
    expect(result.seedExtraction.links).toHaveLength(1);
    expect(result.robotsTxt?.sitemaps).toContain('https://example.org/sitemap.xml');
    expect(result.sitemap?.urls).toContain('https://example.org/dataset');
    expect(result.auditLog.some(a => a.status === 'SUCCESS' && a.target.includes('robots.txt'))).toBe(true);
  });

  it('handles CORS or network failure gracefully', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await probeHostwideResource('https://cors-blocked.org/resource', mockFetch as any);
    expect(result.auditLog.some(a => a.status === 'CORS_RESTRICTED')).toBe(true);
  });
});
