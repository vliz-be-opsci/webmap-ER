import { DiscoveredLink } from './types';

export function parseLinksetJson(jsonPayload: any): DiscoveredLink[] {
  const links: DiscoveredLink[] = [];
  if (!jsonPayload || !jsonPayload.linkset || !Array.isArray(jsonPayload.linkset)) {
    return links;
  }

  for (const item of jsonPayload.linkset) {
    const anchor = item.anchor;
    for (const [relKey, targets] of Object.entries(item)) {
      if (relKey === 'anchor' || !Array.isArray(targets)) continue;
      for (const t of targets as any[]) {
        if (t && t.href) {
          links.push({
            target: t.href,
            rel: relKey,
            type: t.type,
            profile: t.profile,
            anchor,
            source: 'linkset'
          });
        }
      }
    }
  }
  return links;
}
