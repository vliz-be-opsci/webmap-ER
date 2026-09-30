import { ExtractionResult } from './types';
import { parseLinkHeader } from './header-parser';
import { parseLinksetJson } from './linkset';

const RDF_ACCEPT = 'text/turtle, application/ld+json;q=0.9, application/rdf+xml;q=0.8, text/html;q=0.7, */*;q=0.1';

export async function extractResourceLinks(
  url: string,
  fetchFn: typeof fetch = window.fetch.bind(window)
): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    url,
    status: 0,
    contentType: '',
    links: [],
    rdfBodies: [],
    trace: [],
    corsBlocked: false
  };

  let response: Response;
  try {
    response = await fetchFn(url, {
      headers: {
        'Accept': RDF_ACCEPT
      }
    });
    result.status = response.status;
    result.contentType = response.headers.get('content-type') || '';
  } catch (err: any) {
    result.corsBlocked = true;
    result.trace.push({
      strategy: 'fetch',
      success: false,
      message: `Fetch failed. Possible CORS restriction or network error: ${err?.message}`
    });
    return result;
  }

  // 1. Parse HTTP Link Headers
  const linkHeader = response.headers.get('Link') || response.headers.get('link');
  if (linkHeader) {
    const headerLinks = parseLinkHeader(linkHeader, url);
    result.links.push(...headerLinks);
    result.trace.push({
      strategy: 'http-link-header',
      success: true,
      message: `Found ${headerLinks.length} relations in HTTP Link header.`
    });
  } else {
    result.trace.push({
      strategy: 'http-link-header',
      success: false,
      message: 'No HTTP Link header exposed by server.'
    });
  }

  // 2. Read body if available
  let bodyText = '';
  try {
    bodyText = await response.text();
  } catch {}

  // 3. Inspect HTML for <link> tags and scripts
  if (result.contentType.includes('text/html') && typeof DOMParser !== 'undefined' && bodyText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(bodyText, 'text/html');

    const IGNORED_HTML_RELS = new Set([
      'stylesheet',
      'alternate stylesheet',
      'icon',
      'shortcut icon',
      'apple-touch-icon',
      'preload',
      'prefetch',
      'dns-prefetch',
      'preconnect',
      'prerender',
      'manifest',
      'mask-icon',
      'modulepreload'
    ]);

    const linkElements = doc.querySelectorAll('link[rel][href]');
    linkElements.forEach(el => {
      const rel = (el.getAttribute('rel') || '').trim();
      if (IGNORED_HTML_RELS.has(rel.toLowerCase())) return;

      const href = el.getAttribute('href') || '';
      const type = el.getAttribute('type') || undefined;
      const profile = el.getAttribute('profile') || undefined;
      try {
        const resolved = new URL(href, url).href;
        result.links.push({
          target: resolved,
          rel,
          type,
          profile,
          source: 'html-link'
        });
      } catch {}
    });

    // Check embedded JSON-LD scripts
    const scriptElements = doc.querySelectorAll('script[type="application/ld+json"]');
    scriptElements.forEach(s => {
      if (s.textContent) {
        result.rdfBodies.push({
          format: 'application/ld+json',
          content: s.textContent,
          source: 'embedded-script'
        });
      }
    });
  }

  // 4. If linkset discovered, attempt fetch
  const linksetLinks = result.links.filter(l => l.rel === 'linkset');
  for (const ls of linksetLinks) {
    try {
      const lsRes = await fetchFn(ls.target, {
        headers: { 'Accept': 'application/linkset+json, application/linkset;q=0.9' }
      });
      if (lsRes.ok) {
        const ct = lsRes.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const json = await lsRes.json();
          const parsed = parseLinksetJson(json);
          result.links.push(...parsed);
        }
      }
    } catch {}
  }

  return result;
}
