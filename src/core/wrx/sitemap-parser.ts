import { DiscoveredLink } from './types';

export interface SitemapParseResult {
  isSitemapIndex: boolean;
  childSitemaps: string[];
  urls: string[];
  signpostingLinks: DiscoveredLink[];
  detectedRelations: string[];
}

export function parseSitemapXml(xmlContent: string, sitemapUrl: string): SitemapParseResult {
  const result: SitemapParseResult = {
    isSitemapIndex: false,
    childSitemaps: [],
    urls: [],
    signpostingLinks: [],
    detectedRelations: []
  };

  if (!xmlContent || typeof DOMParser === 'undefined') {
    return result;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    if (doc.querySelector('parsererror')) {
      return result;
    }

    const root = doc.documentElement;
    if (!root) return result;

    const rootTag = (root.localName || root.nodeName || '').toLowerCase();
    if (rootTag.includes('sitemapindex')) {
      result.isSitemapIndex = true;
      const sitemaps = Array.from(doc.getElementsByTagName('sitemap')).concat(
        Array.from(doc.getElementsByTagNameNS('*', 'sitemap'))
      );
      // Deduplicate elements
      const uniqueSitemaps = Array.from(new Set(sitemaps));

      uniqueSitemaps.forEach(smEl => {
        const locEls = Array.from(smEl.getElementsByTagName('loc')).concat(
          Array.from(smEl.getElementsByTagNameNS('*', 'loc'))
        );
        const loc = locEls[0]?.textContent?.trim();
        if (loc) {
          try {
            result.childSitemaps.push(new URL(loc, sitemapUrl).href);
          } catch {
            result.childSitemaps.push(loc);
          }
        }
      });
      return result;
    }

    // Get all <url> tags
    const urlElements = Array.from(new Set(
      Array.from(doc.getElementsByTagName('url')).concat(
        Array.from(doc.getElementsByTagNameNS('*', 'url'))
      )
    ));

    let count = 0;
    urlElements.forEach(urlEl => {
      if (count < 50) {
        const locEls = Array.from(urlEl.getElementsByTagName('loc')).concat(
          Array.from(urlEl.getElementsByTagNameNS('*', 'loc'))
        );
        const loc = locEls[0]?.textContent?.trim();
        if (loc) {
          try {
            result.urls.push(new URL(loc, sitemapUrl).href);
          } catch {
            result.urls.push(loc);
          }
        }
        count++;
      }

      // Check for <link> tags in standard or xhtml namespace
      const linkElements = Array.from(urlEl.getElementsByTagName('xhtml:link'))
        .concat(Array.from(urlEl.getElementsByTagName('link')))
        .concat(Array.from(urlEl.getElementsByTagNameNS('*', 'link')));

      const uniqueLinks = Array.from(new Set(linkElements));

      uniqueLinks.forEach(l => {
        const rel = l.getAttribute('rel')?.trim();
        const href = l.getAttribute('href')?.trim();
        const type = l.getAttribute('type')?.trim() || undefined;
        const profile = l.getAttribute('profile')?.trim() || undefined;

        if (rel && href) {
          try {
            const target = new URL(href, sitemapUrl).href;
            result.signpostingLinks.push({
              rel,
              target,
              type,
              profile,
              source: 'sitemap-xml'
            });
            if (!result.detectedRelations.includes(rel)) {
              result.detectedRelations.push(rel);
            }
          } catch {}
        }
      });
    });
  } catch {
    // Graceful handling of any parser exceptions
  }

  return result;
}
