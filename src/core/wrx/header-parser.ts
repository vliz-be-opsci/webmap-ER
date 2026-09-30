import { DiscoveredLink } from './types';

export function parseLinkHeader(headerValue: string | null, baseUrl: string): DiscoveredLink[] {
  if (!headerValue || !headerValue.trim()) return [];
  const links: DiscoveredLink[] = [];
  const entries = headerValue.split(/,\s*(?=<)/);

  for (const entry of entries) {
    const match = entry.match(/<([^>]+)>(.*)/);
    if (!match) continue;
    const rawTarget = match[1];
    const paramsString = match[2];

    let targetUrl: string;
    try {
      targetUrl = new URL(rawTarget, baseUrl).href;
    } catch {
      targetUrl = rawTarget;
    }

    const link: DiscoveredLink = {
      target: targetUrl,
      rel: '',
      source: 'link-header'
    };

    const paramRegex = /;\s*([a-zA-Z*_-]+)\s*=\s*(?:"([^"]*)"|([^;,]+))/g;
    let pMatch;
    while ((pMatch = paramRegex.exec(paramsString)) !== null) {
      const key = pMatch[1].toLowerCase();
      const val = pMatch[2] !== undefined ? pMatch[2] : pMatch[3]?.trim();
      if (key === 'rel') link.rel = val;
      else if (key === 'type') link.type = val;
      else if (key === 'profile') link.profile = val;
      else if (key === 'anchor') link.anchor = val;
    }

    if (link.rel) {
      const rels = link.rel.split(/\s+/);
      for (const r of rels) {
        if (r.trim()) {
          links.push({ ...link, rel: r.trim() });
        }
      }
    }
  }
  return links;
}
