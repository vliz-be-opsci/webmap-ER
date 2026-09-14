import { DiscoveredLink } from '../wrx/types';

export function generateSitemapXml(resourceUri: string, links: DiscoveredLink[]): string {
  const xhtmlLinks = links
    .map(l => {
      let attr = `rel="${l.rel}" href="${l.target}"`;
      if (l.type) attr += ` type="${l.type}"`;
      return `    <xhtml:link ${attr}/>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${resourceUri || 'https://example.org/resource'}</loc>
${xhtmlLinks}
  </url>
</urlset>`;
}
