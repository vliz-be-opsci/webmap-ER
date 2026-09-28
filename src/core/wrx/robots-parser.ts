export interface RobotsTxtResult {
  sitemaps: string[];
  disallowedPaths: string[];
  hasApiDisallows: boolean;
  hasCatalogPaths: boolean;
}

export function parseRobotsTxt(content: string, baseUrl: string): RobotsTxtResult {
  const sitemaps: string[] = [];
  const disallowedPaths: string[] = [];
  let hasApiDisallows = false;
  let hasCatalogPaths = false;

  if (!content || typeof content !== 'string') {
    return { sitemaps, disallowedPaths, hasApiDisallows, hasCatalogPaths };
  }

  const lines = content.split(/\r?\n/);
  for (let rawLine of lines) {
    const commentIdx = rawLine.indexOf('#');
    if (commentIdx >= 0) {
      rawLine = rawLine.substring(0, commentIdx);
    }
    const line = rawLine.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const directive = line.substring(0, colonIdx).trim().toLowerCase();
    const value = line.substring(colonIdx + 1).trim();

    if (directive === 'sitemap' && value) {
      try {
        const resolved = new URL(value, baseUrl).href;
        if (!sitemaps.includes(resolved)) {
          sitemaps.push(resolved);
        }
      } catch {
        // Ignore invalid URL
      }
    } else if (directive === 'disallow' && value) {
      disallowedPaths.push(value);
      const valLower = value.toLowerCase();
      if (valLower.includes('/api') || valLower.includes('/swagger') || valLower.includes('/openapi')) {
        hasApiDisallows = true;
      }
      if (valLower.includes('/catalog') || valLower.includes('/datasets') || valLower.includes('/records')) {
        hasCatalogPaths = true;
      }
    }
  }

  return {
    sitemaps,
    disallowedPaths,
    hasApiDisallows,
    hasCatalogPaths
  };
}
