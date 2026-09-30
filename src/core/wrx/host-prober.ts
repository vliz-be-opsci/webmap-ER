import { extractResourceLinks } from './extractor';
import { ExtractionResult } from './types';
import { parseRobotsTxt, RobotsTxtResult } from './robots-parser';
import { parseSitemapXml, SitemapParseResult } from './sitemap-parser';

export interface HostAuditItem {
  target: string;
  status: 'SUCCESS' | 'CORS_RESTRICTED' | 'NOT_FOUND' | 'ERROR';
  message: string;
}

export interface AggregatedHostExtraction {
  seedUrl: string;
  seedExtraction: ExtractionResult;
  robotsTxt?: RobotsTxtResult;
  sitemap?: SitemapParseResult;
  sitemapUrl?: string;
  auditLog: HostAuditItem[];
}

export async function probeHostwideResource(
  seedUrl: string,
  fetchFn: typeof fetch = window.fetch.bind(window)
): Promise<AggregatedHostExtraction> {
  const auditLog: HostAuditItem[] = [];

  let origin = 'https://example.org';
  try {
    const u = new URL(seedUrl);
    origin = u.origin;
  } catch {}

  const robotsUrl = `${origin}/robots.txt`;
  let defaultSitemapUrl = `${origin}/sitemap.xml`;

  // 1. Probe Seed URL & robots.txt concurrently
  const [seedRes, robotsRes] = await Promise.all([
    extractResourceLinks(seedUrl, fetchFn),
    (async () => {
      try {
        const resp = await fetchFn(robotsUrl);
        if (!resp.ok) {
          auditLog.push({ target: robotsUrl, status: 'NOT_FOUND', message: `HTTP ${resp.status}` });
          return null;
        }
        const text = await resp.text();
        auditLog.push({ target: robotsUrl, status: 'SUCCESS', message: 'Robots.txt retrieved' });
        return parseRobotsTxt(text, robotsUrl);
      } catch (err: any) {
        auditLog.push({
          target: robotsUrl,
          status: 'CORS_RESTRICTED',
          message: err?.message || 'CORS or Network error'
        });
        return null;
      }
    })()
  ]);

  if (seedRes.corsBlocked) {
    auditLog.push({ target: seedUrl, status: 'CORS_RESTRICTED', message: 'Seed inspection blocked by CORS' });
  } else {
    auditLog.push({ target: seedUrl, status: 'SUCCESS', message: `Seed analyzed (${seedRes.links.length} links)` });
  }

  // 2. Probe Sitemap
  let sitemapTarget = defaultSitemapUrl;
  if (robotsRes && robotsRes.sitemaps.length > 0) {
    sitemapTarget = robotsRes.sitemaps[0];
  }

  let sitemapData: SitemapParseResult | undefined = undefined;
  try {
    const resp = await fetchFn(sitemapTarget);
    if (resp.ok) {
      const xml = await resp.text();
      sitemapData = parseSitemapXml(xml, sitemapTarget);
      auditLog.push({
        target: sitemapTarget,
        status: 'SUCCESS',
        message: `Sitemap loaded (${sitemapData.signpostingLinks.length} signposts, ${sitemapData.urls.length} URLs)`
      });
    } else {
      auditLog.push({ target: sitemapTarget, status: 'NOT_FOUND', message: `HTTP ${resp.status}` });
    }
  } catch (err: any) {
    auditLog.push({
      target: sitemapTarget,
      status: 'CORS_RESTRICTED',
      message: err?.message || 'CORS or Network error'
    });
  }

  return {
    seedUrl,
    seedExtraction: seedRes,
    robotsTxt: robotsRes || undefined,
    sitemap: sitemapData,
    sitemapUrl: sitemapTarget,
    auditLog
  };
}
