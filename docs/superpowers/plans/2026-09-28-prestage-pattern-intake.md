# Prestage Pattern Intake, Question Deduction & Provenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated intake and pattern deduction subsystem embedded in the left triage panel that probes `/robots.txt` and XML sitemaps via `wrx`, auto-skips high-confidence questions, provides a persistent provenance review matrix, and dynamically updates the UI and ER graph based on the selected pattern.

**Architecture:** Extend the `wrx` extraction engine with hostwide discovery modules (`robots-parser`, `sitemap-parser`, `host-prober`), pipe aggregated signals into a multi-factor `pattern-classifier`, manage two-tier questions and auto-skip logic with `intake-model`, persist provenance records in `AppStore`, and render an interactive intake audit bar and review matrix directly inside `triage-panel`.

**Tech Stack:** TypeScript, Vanilla DOM, Cytoscape.js, Vitest, Happy-DOM, RFC 8288 / RFC 9264 Signposting.

**Spec:** [docs/superpowers/specs/2026-09-28-prestage-pattern-intake-design.md](file:///c:/Users/cedricd/Documents/Github/webmap-ER/docs/superpowers/specs/2026-09-28-prestage-pattern-intake-design.md)

## Global Constraints

- Must preserve existing `evaluateHealthAndGaps()` and RT diagnostics without regressions.
- No modal popups for intake; the questionnaire and provenance review matrix must reside natively within the left triage panel.
- Any network or CORS error during hostwide probes must gracefully degrade to heuristic mode rather than throwing unhandled exceptions.
- All new files must be strictly typed TypeScript without `any` escape hatches where domain types exist.

---

### Task 1: Robots.txt Parser in `wrx`

**Files:**
- Create: `src/core/wrx/robots-parser.ts`
- Test: `tests/wrx-robots.test.ts`

**Interfaces:**
- Consumes: None (pure parser utility)
- Produces:
  ```typescript
  export interface RobotsTxtResult {
    sitemaps: string[];
    disallowedPaths: string[];
    hasApiDisallows: boolean;
    hasCatalogPaths: boolean;
  }
  export function parseRobotsTxt(content: string, baseUrl: string): RobotsTxtResult;
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// tests/wrx-robots.test.ts
import { describe, it, expect } from 'vitest';
import { parseRobotsTxt } from '../src/core/wrx/robots-parser';

describe('wrx robots-parser', () => {
  it('extracts single and multiple sitemap directives with comments stripped', () => {
    const robots = `
      # Global robots.txt
      User-agent: *
      Disallow: /api/private/
      Disallow: /catalog/drafts/
      
      Sitemap: https://example.org/sitemap.xml
      sitemap: /relative-sitemap.xml # inline comment
    `;

    const res = parseRobotsTxt(robots, 'https://example.org/dataset');
    expect(res.sitemaps).toHaveLength(2);
    expect(res.sitemaps[0]).toBe('https://example.org/sitemap.xml');
    expect(res.sitemaps[1]).toBe('https://example.org/relative-sitemap.xml');
    expect(res.hasApiDisallows).toBe(true);
    expect(res.hasCatalogPaths).toBe(true);
  });

  it('handles empty or malformed content safely', () => {
    const res = parseRobotsTxt('', 'https://example.org');
    expect(res.sitemaps).toEqual([]);
    expect(res.disallowedPaths).toEqual([]);
    expect(res.hasApiDisallows).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/wrx-robots.test.ts`
Expected: FAIL with "Cannot find module '../src/core/wrx/robots-parser'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/core/wrx/robots-parser.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/wrx-robots.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/core/wrx/robots-parser.ts tests/wrx-robots.test.ts; git commit -m "feat(wrx): implement robots.txt parser"
```

---

### Task 2: XML Sitemap Parser in `wrx`

**Files:**
- Create: `src/core/wrx/sitemap-parser.ts`
- Test: `tests/wrx-sitemap.test.ts`

**Interfaces:**
- Consumes: `DiscoveredLink` from `src/core/wrx/types.ts`
- Produces:
  ```typescript
  export interface SitemapParseResult {
    isSitemapIndex: boolean;
    childSitemaps: string[];
    urls: string[];
    signpostingLinks: DiscoveredLink[];
    detectedRelations: string[];
  }
  export function parseSitemapXml(xmlContent: string, sitemapUrl: string): SitemapParseResult;
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// tests/wrx-sitemap.test.ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/wrx-sitemap.test.ts`
Expected: FAIL with "Cannot find module '../src/core/wrx/sitemap-parser'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/core/wrx/sitemap-parser.ts
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

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  if (doc.querySelector('parsererror')) {
    return result;
  }

  if (doc.documentElement.nodeName.toLowerCase().includes('sitemapindex')) {
    result.isSitemapIndex = true;
    doc.querySelectorAll('sitemap > loc').forEach(el => {
      const loc = (el.textContent || '').trim();
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

  const urlElements = doc.querySelectorAll('url');
  let count = 0;
  urlElements.forEach(urlEl => {
    if (count < 50) {
      const loc = urlEl.querySelector('loc')?.textContent?.trim();
      if (loc) {
        try {
          result.urls.push(new URL(loc, sitemapUrl).href);
        } catch {
          result.urls.push(loc);
        }
      }
      count++;
    }

    const links = urlEl.querySelectorAll('link[rel], *|link[rel]');
    links.forEach(l => {
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

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/wrx-sitemap.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/core/wrx/sitemap-parser.ts tests/wrx-sitemap.test.ts; git commit -m "feat(wrx): implement sitemap XML parser with signposting extraction"
```

---

### Task 3: Host Prober Coordinator in `wrx`

**Files:**
- Create: `src/core/wrx/host-prober.ts`
- Test: `tests/wrx-host-prober.test.ts`

**Interfaces:**
- Consumes: `extractResourceLinks`, `parseRobotsTxt`, `parseSitemapXml`
- Produces:
  ```typescript
  export interface AggregatedHostExtraction {
    seedUrl: string;
    seedExtraction: ExtractionResult;
    robotsTxt?: RobotsTxtResult;
    sitemap?: SitemapParseResult;
    sitemapUrl?: string;
    auditLog: Array<{
      target: string;
      status: 'SUCCESS' | 'CORS_RESTRICTED' | 'NOT_FOUND' | 'ERROR';
      message: string;
    }>;
  }
  export async function probeHostwideResource(seedUrl: string, fetchFn?: typeof fetch): Promise<AggregatedHostExtraction>;
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// tests/wrx-host-prober.test.ts
import { describe, it, expect, vi } from 'vitest';
import { probeHostwideResource } from '../src/core/wrx/host-prober';

describe('wrx host-prober', () => {
  it('probes seed, robots.txt, and sitemap.xml concurrently', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://example.org/dataset') {
        return Promise.resolve({
          status: 200,
          headers: new Headers({ 'content-type': 'text/html', 'Link': '<https://example.org/dataset.jsonld>; rel="describedby"' }),
          text: () => Promise.resolve('<html><head></head><body>Dataset</body></html>')
        });
      }
      if (url === 'https://example.org/robots.txt') {
        return Promise.resolve({
          status: 200,
          headers: new Headers({ 'content-type': 'text/plain' }),
          text: () => Promise.resolve('Sitemap: https://example.org/sitemap.xml\nDisallow: /api')
        });
      }
      if (url === 'https://example.org/sitemap.xml') {
        return Promise.resolve({
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/wrx-host-prober.test.ts`
Expected: FAIL with "Cannot find module '../src/core/wrx/host-prober'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/core/wrx/host-prober.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/wrx-host-prober.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/core/wrx/host-prober.ts tests/wrx-host-prober.test.ts; git commit -m "feat(wrx): implement hostwide probing coordinator"
```

---

### Task 4: Pattern & Profile Classifier in `wrx`

**Files:**
- Create: `src/core/wrx/pattern-classifier.ts`
- Test: `tests/pattern-classifier.test.ts`

**Interfaces:**
- Consumes: `AggregatedHostExtraction` from `src/core/wrx/host-prober.ts`
- Produces:
  ```typescript
  export interface PatternClassificationResult {
    recommendedPattern: string; // "PT-01" to "PT-08"
    confidence: 'high' | 'medium' | 'low';
    scorePercent: number;
    rationale: string;
    detectedSignals: string[];
  }
  export function classifyResourcePattern(extraction: AggregatedHostExtraction): PatternClassificationResult;
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// tests/pattern-classifier.test.ts
import { describe, it, expect } from 'vitest';
import { classifyResourcePattern } from '../src/core/wrx/pattern-classifier';
import { AggregatedHostExtraction } from '../src/core/wrx/host-prober';

describe('wrx pattern-classifier', () => {
  it('classifies PT-06 with high confidence when sitemap signposting is found', () => {
    const extraction: AggregatedHostExtraction = {
      seedUrl: 'https://example.org/dataset',
      seedExtraction: { url: 'https://example.org/dataset', status: 200, contentType: 'text/html', links: [], rdfBodies: [], trace: [], corsBlocked: false },
      sitemap: {
        isSitemapIndex: false,
        childSitemaps: [],
        urls: ['https://example.org/dataset'],
        signpostingLinks: [{ rel: 'describedby', target: 'https://example.org/d1.jsonld', source: 'sitemap-xml' }],
        detectedRelations: ['describedby']
      },
      auditLog: []
    };

    const result = classifyResourcePattern(extraction);
    expect(result.recommendedPattern).toBe('PT-06');
    expect(result.confidence).toBe('high');
    expect(result.scorePercent).toBeGreaterThanOrEqual(85);
  });

  it('classifies PT-05 when service-desc or OpenAPI endpoint is present', () => {
    const extraction: AggregatedHostExtraction = {
      seedUrl: 'https://example.org/api/v1/collections',
      seedExtraction: {
        url: 'https://example.org/api/v1/collections',
        status: 200,
        contentType: 'application/json',
        links: [{ rel: 'service-desc', target: 'https://example.org/openapi.json', source: 'link-header' }],
        rdfBodies: [],
        trace: [],
        corsBlocked: false
      },
      auditLog: []
    };

    const result = classifyResourcePattern(extraction);
    expect(result.recommendedPattern).toBe('PT-05');
    expect(result.confidence).toBe('high');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/pattern-classifier.test.ts`
Expected: FAIL with "Cannot find module '../src/core/wrx/pattern-classifier'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/core/wrx/pattern-classifier.ts
import { AggregatedHostExtraction } from './host-prober';

export interface PatternClassificationResult {
  recommendedPattern: string;
  confidence: 'high' | 'medium' | 'low';
  scorePercent: number;
  rationale: string;
  detectedSignals: string[];
}

export function classifyResourcePattern(extraction: AggregatedHostExtraction): PatternClassificationResult {
  const signals: string[] = [];
  const seedLinks = extraction.seedExtraction.links;
  const rels = new Set(seedLinks.map(l => l.rel.toLowerCase()));

  // 1. PT-06 Hostwide Sitemaps Evaluation
  if (extraction.sitemap && extraction.sitemap.signpostingLinks.length > 0) {
    signals.push(`Sitemap contains ${extraction.sitemap.signpostingLinks.length} embedded signposting links`);
    return {
      recommendedPattern: 'PT-06',
      confidence: 'high',
      scorePercent: 95,
      rationale: 'Hostwide discovery active: XML sitemap with <xhtml:link> signposting relations discovered.',
      detectedSignals: signals
    };
  }

  // 2. PT-05 Subsetting API Evaluation
  const hasServiceDesc = rels.has('service-desc') || rels.has('service-doc');
  const urlLower = extraction.seedUrl.toLowerCase();
  const isApiUrl = urlLower.includes('/api') || urlLower.includes('openapi.json') || urlLower.includes('swagger.json');
  if (hasServiceDesc) {
    signals.push('Explicit service-desc or service-doc link relation present in seed headers');
    return {
      recommendedPattern: 'PT-05',
      confidence: 'high',
      scorePercent: 90,
      rationale: 'Subsetting API detected via explicit machine-readable service description.',
      detectedSignals: signals
    };
  }
  if (isApiUrl) {
    signals.push('Seed URI path heuristics match web API conventions (/api)');
    return {
      recommendedPattern: 'PT-05',
      confidence: 'medium',
      scorePercent: 70,
      rationale: 'URL structure indicates an API endpoint; PT-05 Subsetting API Integration recommended.',
      detectedSignals: signals
    };
  }

  // 3. PT-07 Catalog Assistance Evaluation
  if (rels.has('item') || rels.has('collection') || urlLower.includes('/catalog') || urlLower.includes('/records')) {
    signals.push('Catalog navigation links (item/collection) or catalog URL paths detected');
    return {
      recommendedPattern: 'PT-07',
      confidence: rels.has('item') ? 'high' : 'medium',
      scorePercent: rels.has('item') ? 88 : 68,
      rationale: 'Catalog collection or member resource structure identified; PT-07 recommended.',
      detectedSignals: signals
    };
  }

  // 4. PT-01 Profile Conformity Evaluation
  if (rels.has('profile')) {
    signals.push('rel="profile" header declared on seed resource');
    return {
      recommendedPattern: 'PT-01',
      confidence: 'high',
      scorePercent: 92,
      rationale: 'Resource explicitly declares functional profile conformance via rel="profile".',
      detectedSignals: signals
    };
  }

  // 5. PT-04 Direct Metadata Evaluation
  if (rels.has('describedby')) {
    signals.push('rel="describedby" metadata link discovered on seed');
    return {
      recommendedPattern: 'PT-04',
      confidence: 'high',
      scorePercent: 86,
      rationale: 'Direct machine-readable metadata linked without separate landing page.',
      detectedSignals: signals
    };
  }

  // Fallback: PT-01 Baseline
  signals.push('Standard web resource without specialized API or catalog indicators');
  return {
    recommendedPattern: 'PT-01',
    confidence: 'low',
    scorePercent: 45,
    rationale: 'Baseline dataset triage: recommend establishing functional profile conformance (PT-01).',
    detectedSignals: signals
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/pattern-classifier.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/core/wrx/pattern-classifier.ts tests/pattern-classifier.test.ts; git commit -m "feat(wrx): implement pattern classifier and scoring engine"
```

---

### Task 5: Intake Question & Provenance Model

**Files:**
- Create: `src/core/triage/intake-model.ts`
- Test: `tests/intake-model.test.ts`

**Interfaces:**
- Consumes: `AggregatedHostExtraction`, `PatternClassificationResult`
- Produces:
  ```typescript
  export type ResolutionSource = 'AUTO_ROBOTS' | 'AUTO_SITEMAP' | 'AUTO_LINK_HEADER' | 'AUTO_JSONLD' | 'AUTO_HEURISTIC' | 'HUMAN' | 'UNRESOLVED';
  export interface IntakeQuestionItem {
    id: string;
    tier: 1 | 2;
    patternId: string;
    rel?: string;
    title: string;
    prompt: string;
    didacticText: string;
    currentValue: string;
    source: ResolutionSource;
    confidence: 'high' | 'medium' | 'low';
    skipped: boolean;
    evidence?: string;
    quickOptions: Array<{ label: string; value: string }>;
  }
  export function buildIntakeQuestions(extraction: AggregatedHostExtraction, classification: PatternClassificationResult): IntakeQuestionItem[];
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// tests/intake-model.test.ts
import { describe, it, expect } from 'vitest';
import { buildIntakeQuestions } from '../src/core/triage/intake-model';
import { AggregatedHostExtraction } from '../src/core/wrx/host-prober';
import { PatternClassificationResult } from '../src/core/wrx/pattern-classifier';

describe('intake-model questions and auto-skip', () => {
  it('automatically skips high confidence sitemap question for PT-06 when discovered via robots.txt', () => {
    const extraction: AggregatedHostExtraction = {
      seedUrl: 'https://example.org/dataset',
      seedExtraction: { url: 'https://example.org/dataset', status: 200, contentType: 'text/html', links: [], rdfBodies: [], trace: [], corsBlocked: false },
      robotsTxt: { sitemaps: ['https://example.org/sitemap.xml'], disallowedPaths: [], hasApiDisallows: false, hasCatalogPaths: false },
      sitemapUrl: 'https://example.org/sitemap.xml',
      auditLog: []
    };
    const classification: PatternClassificationResult = {
      recommendedPattern: 'PT-06',
      confidence: 'high',
      scorePercent: 90,
      rationale: 'Sitemap found',
      detectedSignals: []
    };

    const questions = buildIntakeQuestions(extraction, classification);
    const sitemapQ = questions.find(q => q.id === 'q-intake-sitemap');
    expect(sitemapQ).toBeDefined();
    expect(sitemapQ?.skipped).toBe(true);
    expect(sitemapQ?.source).toBe('AUTO_ROBOTS');
    expect(sitemapQ?.currentValue).toBe('https://example.org/sitemap.xml');
  });

  it('keeps question unskipped with heuristic guess when confidence is low or heuristic', () => {
    const extraction: AggregatedHostExtraction = {
      seedUrl: 'https://example.org/api/data',
      seedExtraction: { url: 'https://example.org/api/data', status: 200, contentType: 'application/json', links: [], rdfBodies: [], trace: [], corsBlocked: false },
      auditLog: []
    };
    const classification: PatternClassificationResult = {
      recommendedPattern: 'PT-05',
      confidence: 'medium',
      scorePercent: 70,
      rationale: 'URL heuristic',
      detectedSignals: []
    };

    const questions = buildIntakeQuestions(extraction, classification);
    const apiQ = questions.find(q => q.id === 'q-intake-service-desc');
    expect(apiQ).toBeDefined();
    expect(apiQ?.skipped).toBe(false);
    expect(apiQ?.source).toBe('AUTO_HEURISTIC');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/intake-model.test.ts`
Expected: FAIL with "Cannot find module '../src/core/triage/intake-model'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/core/triage/intake-model.ts
import { AggregatedHostExtraction } from '../wrx/host-prober';
import { PatternClassificationResult } from '../wrx/pattern-classifier';

export type ResolutionSource =
  | 'AUTO_ROBOTS'
  | 'AUTO_SITEMAP'
  | 'AUTO_LINK_HEADER'
  | 'AUTO_JSONLD'
  | 'AUTO_HEURISTIC'
  | 'HUMAN'
  | 'UNRESOLVED';

export interface IntakeQuestionItem {
  id: string;
  tier: 1 | 2;
  patternId: string;
  rel?: string;
  title: string;
  prompt: string;
  didacticText: string;
  currentValue: string;
  source: ResolutionSource;
  confidence: 'high' | 'medium' | 'low';
  skipped: boolean;
  evidence?: string;
  quickOptions: Array<{ label: string; value: string }>;
}

export function buildIntakeQuestions(
  extraction: AggregatedHostExtraction,
  classification: PatternClassificationResult
): IntakeQuestionItem[] {
  const items: IntakeQuestionItem[] = [];
  const seedUrl = extraction.seedUrl;
  const seedLinks = extraction.seedExtraction.links;

  // Tier 1: Archetype Classification
  const patternId = classification.recommendedPattern;
  const isHighConfidenceArchetype = classification.confidence === 'high';

  items.push({
    id: 'q-intake-archetype',
    tier: 1,
    patternId,
    title: 'Resource Archetype & RT Pattern Focus',
    prompt: `Based on automated inspection, this resource conforms best to ${patternId}. Is this classification accurate?`,
    didacticText: classification.rationale,
    currentValue: patternId,
    source: isHighConfidenceArchetype ? 'AUTO_LINK_HEADER' : 'AUTO_HEURISTIC',
    confidence: classification.confidence,
    skipped: isHighConfidenceArchetype,
    evidence: classification.detectedSignals.join('; '),
    quickOptions: [
      { label: 'PT-01: Profile Conformity Declaration', value: 'PT-01' },
      { label: 'PT-04: Direct Metadata / No Landing Page', value: 'PT-04' },
      { label: 'PT-05: Subsetting API Integration', value: 'PT-05' },
      { label: 'PT-06: Hostwide Resource Discovery (Sitemaps)', value: 'PT-06' },
      { label: 'PT-07: Catalog Assistance', value: 'PT-07' }
    ]
  });

  // Tier 2: Key pattern-specific endpoints
  if (patternId === 'PT-06') {
    const sitemapUrl = extraction.sitemapUrl || (extraction.robotsTxt?.sitemaps[0]);
    const hasSitemapFromRobots = !!(extraction.robotsTxt?.sitemaps && extraction.robotsTxt.sitemaps.length > 0);
    const hasSitemapDoc = !!extraction.sitemap;

    items.push({
      id: 'q-intake-sitemap',
      tier: 2,
      patternId: 'PT-06',
      rel: 'item',
      title: 'Hostwide XML Sitemap Location',
      prompt: 'Where is the machine-harvestable XML sitemap located for this host?',
      didacticText: 'Pattern 06 embeds signposting links directly into sitemap.xml to enable bulk harvesting.',
      currentValue: sitemapUrl || `${new URL(seedUrl).origin}/sitemap.xml`,
      source: hasSitemapFromRobots ? 'AUTO_ROBOTS' : hasSitemapDoc ? 'AUTO_SITEMAP' : 'AUTO_HEURISTIC',
      confidence: (hasSitemapFromRobots || hasSitemapDoc) ? 'high' : 'medium',
      skipped: hasSitemapFromRobots || hasSitemapDoc,
      evidence: hasSitemapFromRobots ? 'Discovered in /robots.txt' : 'Probed default /sitemap.xml',
      quickOptions: [
        { label: 'Root Sitemap XML', value: `${new URL(seedUrl).origin}/sitemap.xml` },
        { label: 'Well-Known Sitemap', value: `${new URL(seedUrl).origin}/.well-known/sitemap.xml` }
      ]
    });
  } else if (patternId === 'PT-05') {
    const serviceDescLink = seedLinks.find(l => l.rel === 'service-desc');
    const isHighDesc = !!serviceDescLink;
    const descUrl = serviceDescLink?.target || `${seedUrl}/openapi.json`;

    items.push({
      id: 'q-intake-service-desc',
      tier: 2,
      patternId: 'PT-05',
      rel: 'service-desc',
      title: 'Machine-Readable Service Description (OpenAPI / OGC API)',
      prompt: 'Where is the OpenAPI / service description contract located?',
      didacticText: 'PT-05 enables automated harvesters to query sub-collections without scraping HTML.',
      currentValue: descUrl,
      source: isHighDesc ? 'AUTO_LINK_HEADER' : 'AUTO_HEURISTIC',
      confidence: isHighDesc ? 'high' : 'medium',
      skipped: isHighDesc,
      evidence: isHighDesc ? 'Found rel="service-desc" in HTTP headers' : 'Derived from API URL heuristic',
      quickOptions: [
        { label: 'OpenAPI JSON', value: `${seedUrl}/openapi.json` },
        { label: 'OGC API Features Collections', value: `${seedUrl}/collections` }
      ]
    });
  } else if (patternId === 'PT-01') {
    const profileLink = seedLinks.find(l => l.rel === 'profile');
    const hasProfile = !!profileLink;
    const profileVal = profileLink?.target || 'https://w3id.org/ro/crate/1.1';

    items.push({
      id: 'q-intake-profile',
      tier: 2,
      patternId: 'PT-01',
      rel: 'profile',
      title: 'Functional Profile Conformance Specification',
      prompt: 'Which profile or metadata schema specification does this resource adhere to?',
      didacticText: 'Signposting functional profiles tells crawlers which semantic rules govern this asset.',
      currentValue: profileVal,
      source: hasProfile ? 'AUTO_LINK_HEADER' : 'AUTO_HEURISTIC',
      confidence: hasProfile ? 'high' : 'medium',
      skipped: hasProfile,
      evidence: hasProfile ? 'Extracted from HTTP Link profile header' : 'Preset default profile',
      quickOptions: [
        { label: 'RO-Crate 1.1', value: 'https://w3id.org/ro/crate/1.1' },
        { label: 'DCAT-AP 2.1', value: 'http://data.europa.eu/r5r/' },
        { label: 'Darwin Core (DwC)', value: 'https://dwc.tdwg.org/terms/' }
      ]
    });
  } else if (patternId === 'PT-04') {
    const descLink = seedLinks.find(l => l.rel === 'describedby');
    const hasDesc = !!descLink;
    items.push({
      id: 'q-intake-describedby',
      tier: 2,
      patternId: 'PT-04',
      rel: 'describedby',
      title: 'Direct Descriptive Metadata URI',
      prompt: 'Where is the direct JSON-LD or Turtle metadata representation located?',
      didacticText: 'PT-04 provides direct access to machine-readable metadata without intermediate HTML wrappers.',
      currentValue: descLink?.target || `${seedUrl}.jsonld`,
      source: hasDesc ? 'AUTO_LINK_HEADER' : 'AUTO_HEURISTIC',
      confidence: hasDesc ? 'high' : 'medium',
      skipped: hasDesc,
      evidence: hasDesc ? 'Found rel="describedby" header' : 'Generated default JSON-LD path',
      quickOptions: [
        { label: 'JSON-LD Endpoint', value: `${seedUrl}.jsonld` },
        { label: 'Turtle Endpoint', value: `${seedUrl}.ttl` }
      ]
    });
  }

  return items;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/intake-model.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/core/triage/intake-model.ts tests/intake-model.test.ts; git commit -m "feat(triage): implement intake question model and auto-skip logic"
```

---

### Task 6: State & Store Provenance Integration

**Files:**
- Modify: `src/core/state/store.ts`
- Test: `tests/state.test.ts`

**Interfaces:**
- Consumes: `ResolutionSource` from `src/core/triage/intake-model.ts`
- Produces:
  ```typescript
  export interface RelationProvenance {
    rel: string;
    targetUri: string;
    source: ResolutionSource;
    evidence?: string;
    timestamp: number;
  }
  // Store methods: answerQuestionWithProvenance(id, rel, uri, source, evidence), setIntakeAudit(summary)
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// Add to tests/state.test.ts
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';

describe('AppStore provenance integration', () => {
  it('records provenance when an answer is saved', () => {
    const store = new AppStore();
    store.answerQuestionWithProvenance(
      'q-sitemap',
      'item',
      'https://example.org/sitemap.xml',
      'AUTO_ROBOTS',
      'Extracted from /robots.txt'
    );

    const state = store.getState();
    expect(state.links).toHaveLength(1);
    expect(state.provenanceHistory).toBeDefined();
    expect(state.provenanceHistory[0]).toMatchObject({
      rel: 'item',
      targetUri: 'https://example.org/sitemap.xml',
      source: 'AUTO_ROBOTS',
      evidence: 'Extracted from /robots.txt'
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/state.test.ts`
Expected: FAIL with "store.answerQuestionWithProvenance is not a function"

- [ ] **Step 3: Update `src/core/state/store.ts`**

Update `src/core/state/store.ts` to include `provenanceHistory` in `AppState` and implement `answerQuestionWithProvenance`:

```typescript
// In src/core/state/store.ts:
export interface RelationProvenance {
  rel: string;
  targetUri: string;
  source: string;
  evidence?: string;
  timestamp: number;
}

export interface IntakeSummaryState {
  recommendedPatternId: string;
  confidence: 'high' | 'medium' | 'low';
  scorePercent: number;
  rationale: string;
  skippedCount: number;
  totalCount: number;
  auditLog: Array<{ target: string; status: string; message: string }>;
}

export interface AppState {
  version: number;
  mode: 'triage' | 'wizard';
  seedUri: string;
  activePatternId: string;
  links: DiscoveredLink[];
  smartInference?: SmartInferenceResult;
  history: UserInteractionEvent[];
  provenanceHistory: RelationProvenance[];
  intakeSummary?: IntakeSummaryState;
  ui: {
    viewMode: 'balanced' | 'extended-triage' | 'extended-graph';
    activeQuestionIndex: number;
    showIntakeReview: boolean;
  };
}
```
Add method:
```typescript
public answerQuestionWithProvenance(
  questionId: string,
  rel: string,
  targetUri: string,
  source: string = 'HUMAN',
  evidence?: string
): void {
  this.answerQuestion(questionId, rel, targetUri);
  const prov: RelationProvenance = {
    rel,
    targetUri,
    source,
    evidence,
    timestamp: Date.now()
  };
  const existingIdx = this.state.provenanceHistory.findIndex(p => p.rel === rel);
  if (existingIdx >= 0) {
    this.state.provenanceHistory[existingIdx] = prov;
  } else {
    this.state.provenanceHistory.push(prov);
  }
  this.notify();
}

public setIntakeSummary(summary: IntakeSummaryState | undefined): void {
  this.state.intakeSummary = summary;
  this.notify();
}

public toggleIntakeReview(show?: boolean): void {
  this.state.ui.showIntakeReview = show !== undefined ? show : !this.state.ui.showIntakeReview;
  this.notify();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/state.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/core/state/store.ts tests/state.test.ts; git commit -m "feat(state): add persistent provenance tracking to store"
```

---

### Task 7: In-Panel Triage Questionnaire & Review Matrix UI

**Files:**
- Modify: `src/ui/components/triage-panel.ts`
- Modify: `src/style.css`
- Test: `tests/triage-panel-intake.test.ts`

**Interfaces:**
- Consumes: `probeHostwideResource`, `classifyResourcePattern`, `buildIntakeQuestions`, `AppStore`
- Produces: Integrated in-panel intake audit bar, auto-skip question navigation, and Review Matrix with provenance badges.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/triage-panel-intake.test.ts
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createTriagePanel } from '../src/ui/components/triage-panel';

describe('triage-panel intake and provenance UI', () => {
  it('renders provenance audit strip and review toggle button', () => {
    const store = new AppStore();
    store.setIntakeSummary({
      recommendedPatternId: 'PT-06',
      confidence: 'high',
      scorePercent: 92,
      rationale: 'Sitemap detected',
      skippedCount: 2,
      totalCount: 3,
      auditLog: [{ target: 'https://example.org/robots.txt', status: 'SUCCESS', message: 'Retrieved' }]
    });

    const panel = createTriagePanel(store);
    expect(panel.querySelector('.provenance-audit-strip')).not.toBeNull();
    expect(panel.querySelector('#btn-toggle-review')).not.toBeNull();
    expect(panel.textContent).toContain('PT-06');
  });

  it('renders review matrix when showIntakeReview is true', () => {
    const store = new AppStore();
    store.answerQuestionWithProvenance('q1', 'profile', 'https://w3id.org/ro/crate/1.1', 'AUTO_JSONLD');
    store.toggleIntakeReview(true);

    const panel = createTriagePanel(store);
    expect(panel.querySelector('.provenance-review-matrix')).not.toBeNull();
    expect(panel.textContent).toContain('AUTO_JSONLD');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/triage-panel-intake.test.ts`
Expected: FAIL with missing DOM elements

- [ ] **Step 3: Update `src/ui/components/triage-panel.ts` & `src/style.css`**

1. Wire `probeHostwideResource()`, `classifyResourcePattern()`, and `buildIntakeQuestions()` inside `#btn-extract` in `triage-panel.ts`.
2. Automatically pre-populate high-confidence items with `store.answerQuestionWithProvenance()`.
3. If high-confidence questions exist, notify via toast: `Auto-resolved N questions from machine evidence`.
4. Render the `.provenance-audit-strip` showing crawl indicators, pattern recommendation, and `[View Provenance & Review]` button.
5. Render `.provenance-review-matrix` when `state.ui.showIntakeReview === true`, featuring:
   - Pattern summary badge
   - Provenance table (`Target Relation`, `Value`, `Provenance Badge`)
   - Pattern switcher buttons
   - `[Apply Pattern & Synchronize Workspace]` button that sets `activePatternId` and closes the review matrix.
6. Add CSS classes in `src/style.css` for `.provenance-audit-strip`, `.provenance-badge-auto`, `.provenance-badge-human`, and `.provenance-review-matrix`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/triage-panel-intake.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```powershell
git add src/ui/components/triage-panel.ts src/style.css tests/triage-panel-intake.test.ts; git commit -m "feat(ui): implement in-panel intake audit strip and provenance review matrix"
```

---

### Task 8: End-to-End System Integration & Full Verification

**Files:**
- Modify: `tests/e2e.test.ts`
- Run: Full test suite

- [ ] **Step 1: Write E2E integration test**

Verify the full pipeline in `tests/e2e.test.ts`:
1. Initialize `AppStore`.
2. Execute intake on a mock URI with robots.txt and sitemap.
3. Verify questions are auto-skipped.
4. Verify provenance history is preserved in store.
5. Apply pattern and verify UI state updates active pattern, gap diagnostics, and graph nodes.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: ALL tests pass across all 28+ test suites.

- [ ] **Step 3: Build verification**

Run: `npm run build`
Expected: Clean TypeScript compilation and Vite bundle without errors.

- [ ] **Step 4: Commit**

```powershell
git add tests/e2e.test.ts; git commit -m "test(e2e): verify end-to-end prestage intake, pattern deduction, and provenance"
```
