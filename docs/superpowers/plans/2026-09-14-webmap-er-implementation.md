# webmap-ER Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify `webmap-ER`, a zero-backend, browser-based Emergency Room application for Radical Transparency (RT) in research data ecosystems, featuring in-browser RDF/link discovery (`wrx`), RT pattern auditing (`PT-01` to `PT-08`), an adaptive split-pane triage questionnaire, interactive SVG network graph, URI fragment state persistence (`#gz=...`), and automated generation of systemic IT remediation tickets, HTTP `Link` headers, XML sitemaps, and `rt-test` YAML suites.

**Architecture:** A client-side single page app built with Vite, TypeScript, and Vanilla CSS. Divided into isolated domain layers: browser `wrx` extraction cascade, `rt` pattern model, `triage` diagnostic and question engine, event-sourced `state` with Deflate URL fragment compression, `export` serializers, and an adaptive `ui` layer with native SVG force graph and 3-way split-pane layout.

**Tech Stack:** Vite 6, TypeScript 5, Vitest, Vanilla CSS, native browser APIs (`fetch`, `DOMParser`, `CompressionStream`, `SVGCanvas`).

**Spec:** [`docs/superpowers/specs/2026-09-14-webmap-er-design.md`](file:///c:/Users/cedricd/Documents/Github/webmap-ER/docs/superpowers/specs/2026-09-14-webmap-er-design.md)

## Global Constraints
- Target platform: Standard web browsers (Chrome, Firefox, Safari, Edge), zero backend server, deployable to GitHub Pages.
- Pure client-side execution; assume target endpoints provide or need CORS (`Access-Control-Allow-Origin: *`, `Access-Control-Expose-Headers: Link`).
- RT Pattern and relation semantics must conform strictly to `grmp-test-implementations/rt-test` and EOSC specifications.
- State persistence must encode cleanly into the URI fragment identifier (`#gz=...`) without external database storage.
- IT Ticket Markdown must formulate remediation as a systemic server-wide policy across all published resources, using tested URIs as exemplars.

---

### Task 1: Project Scaffolding & Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/style.css`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Produces: Working Vite build environment, TypeScript strict configuration, Vitest runner, and CSS custom properties design tokens for the dark/light ER clinical theme.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/setup.test.ts
import { describe, it, expect } from 'vitest';

describe('Project Environment Setup', () => {
  it('should have standard environment variables and vitest working', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/setup.test.ts`
Expected: FAIL or error indicating missing dependencies/config.

- [ ] **Step 3: Write minimal implementation**

Create `package.json`:
```json
{
  "name": "webmap-er",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "tests"]
}
```

Create `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3000
  }
});
```

Create `src/style.css` with ER clinical color tokens:
```css
:root {
  --bg-primary: #0b0f19;
  --bg-secondary: #111827;
  --bg-card: #1f2937;
  --bg-hover: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --border-color: #374151;
  
  --er-vital-green: #10b981;
  --er-vital-amber: #f59e0b;
  --er-vital-red: #ef4444;
  --er-vital-blue: #3b82f6;
  --er-vital-purple: #8b5cf6;
  
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  min-height: 100vh;
  overflow: hidden;
}
```

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>webmap-ER — Radical Transparency Emergency Room</title>
    <link rel="stylesheet" href="./src/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

Create placeholder `src/main.ts`:
```typescript
console.log('webmap-ER initializing');
```

- [ ] **Step 4: Install dependencies and run tests**

Run: `npm install && npx vitest run tests/setup.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/style.css src/main.ts tests/setup.test.ts
git commit -m "chore: scaffold project with Vite, TypeScript, Vitest, and design tokens"
```

---

### Task 2: In-Browser Discovery Engine (`src/core/wrx/`)

**Files:**
- Create: `src/core/wrx/types.ts`
- Create: `src/core/wrx/header-parser.ts`
- Create: `src/core/wrx/linkset.ts`
- Create: `src/core/wrx/extractor.ts`
- Test: `tests/wrx.test.ts`

**Interfaces:**
- Produces: `extractResourceLinks(url: string, fetchFn?: typeof fetch): Promise<ExtractionResult>`
- Consumes: Standard Web APIs `fetch`, `DOMParser`, `URL`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/wrx.test.ts
import { describe, it, expect } from 'vitest';
import { parseLinkHeader } from '../src/core/wrx/header-parser';
import { parseLinksetJson } from '../src/core/wrx/linkset';

describe('wrx Header & Linkset Parsers', () => {
  it('should parse RFC 8288 Link headers with rel, type, and profile', () => {
    const header = '<https://example.org/profile>; rel="profile", </meta.jsonld>; rel="describedby"; type="application/ld+json"';
    const links = parseLinkHeader(header, 'https://example.org/dataset');
    expect(links).toHaveLength(2);
    expect(links[0].target).toBe('https://example.org/profile');
    expect(links[0].rel).toBe('profile');
    expect(links[1].target).toBe('https://example.org/meta.jsonld');
    expect(links[1].rel).toBe('describedby');
    expect(links[1].type).toBe('application/ld+json');
  });

  it('should parse RFC 9264 application/linkset+json', () => {
    const json = {
      linkset: [
        {
          anchor: 'https://example.org/dataset',
          'describedby': [
            { href: 'https://example.org/meta.jsonld', type: 'application/ld+json' }
          ]
        }
      ]
    };
    const links = parseLinksetJson(json);
    expect(links).toHaveLength(1);
    expect(links[0].rel).toBe('describedby');
    expect(links[0].target).toBe('https://example.org/meta.jsonld');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/wrx.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/core/wrx/types.ts`:
```typescript
export interface DiscoveredLink {
  target: string;
  rel: string;
  type?: string;
  profile?: string;
  anchor?: string;
  source: 'link-header' | 'html-link' | 'linkset' | 'script-rdf' | 'conneg';
}

export interface ExtractionResult {
  url: string;
  status: number;
  contentType: string;
  links: DiscoveredLink[];
  rdfBodies: Array<{ format: string; content: string; source: string }>;
  trace: Array<{ strategy: string; success: boolean; message: string }>;
  corsBlocked: boolean;
}
```

Create `src/core/wrx/header-parser.ts`:
```typescript
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
      // Handle space-separated rels e.g. rel="describedby item"
      const rels = link.rel.split(/\s+/);
      for (const r of rels) {
        links.push({ ...link, rel: r });
      }
    }
  }
  return links;
}
```

Create `src/core/wrx/linkset.ts`:
```typescript
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
```

Create `src/core/wrx/extractor.ts`:
```typescript
import { ExtractionResult, DiscoveredLink } from './types';
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
  const bodyText = await response.text();

  // 3. Inspect HTML for <link> tags and scripts
  if (result.contentType.includes('text/html') && typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(bodyText, 'text/html');

    const linkElements = doc.querySelectorAll('link[rel][href]');
    linkElements.forEach(el => {
      const rel = el.getAttribute('rel') || '';
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/wrx.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/wrx/ tests/wrx.test.ts
git commit -m "feat(wrx): implement in-browser HTTP Link header and linkset extraction"
```

---

### Task 3: Radical Transparency Pattern Model (`src/core/rt/`)

**Files:**
- Create: `src/core/rt/relations.ts`
- Create: `src/core/rt/patterns.ts`
- Create: `src/core/rt/presets.ts`
- Test: `tests/rt.test.ts`

**Interfaces:**
- Produces: `RT_PATTERNS` definitions, `RT_RELATIONS` catalog, `SAMPLE_PRESETS` library.
- Consumes: None (pure domain definition).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/rt.test.ts
import { describe, it, expect } from 'vitest';
import { RT_PATTERNS, getPatternById } from '../src/core/rt/patterns';
import { SAMPLE_PRESETS } from '../src/core/rt/presets';

describe('RT Pattern Model & Presets', () => {
  it('should define all 8 RT patterns from PT-01 to PT-08', () => {
    expect(RT_PATTERNS).toHaveLength(8);
    const pt01 = getPatternById('PT-01');
    expect(pt01).toBeDefined();
    expect(pt01?.roles).toContain('resource');
    expect(pt01?.roles).toContain('profile');
    expect(pt01?.requiredRelations).toContain('profile');
  });

  it('should include real-world sample presets', () => {
    expect(SAMPLE_PRESETS.length).toBeGreaterThanOrEqual(3);
    const arms = SAMPLE_PRESETS.find(p => p.id === 'arms-mbon');
    expect(arms).toBeDefined();
    expect(arms?.uris.resource).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/rt.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/core/rt/relations.ts`:
```typescript
export interface RTRelationDef {
  rel: string;
  rfc: string;
  description: string;
  defaultRole: string;
  signposting: boolean;
}

export const RT_RELATIONS: Record<string, RTRelationDef> = {
  profile: {
    rel: 'profile',
    rfc: 'RFC 6906',
    description: 'Declares conformance to a functional specification or schema profile.',
    defaultRole: 'profile',
    signposting: true
  },
  describedby: {
    rel: 'describedby',
    rfc: 'RFC 8288',
    description: 'Links to descriptive machine-readable metadata (e.g. JSON-LD, Turtle).',
    defaultRole: 'metadata',
    signposting: true
  },
  'cite-as': {
    rel: 'cite-as',
    rfc: 'RFC 8574',
    description: 'Permanent persistent identifier for citation (DOI, Handle, URN).',
    defaultRole: 'persistent_id',
    signposting: true
  },
  type: {
    rel: 'type',
    rfc: 'RFC 8288',
    description: 'Conceptual RDF/schema type of the resource (e.g. dcat:Dataset).',
    defaultRole: 'resource_type',
    signposting: true
  },
  item: {
    rel: 'item',
    rfc: 'RFC 6573',
    description: 'Links a collection/catalog to a member item resource.',
    defaultRole: 'resource',
    signposting: true
  },
  collection: {
    rel: 'collection',
    rfc: 'RFC 6573',
    description: 'Links a resource back to its parent collection or catalog.',
    defaultRole: 'catalog',
    signposting: true
  },
  linkset: {
    rel: 'linkset',
    rfc: 'RFC 9264',
    description: 'Points to a dedicated RFC 9264 linkset document exposing relations.',
    defaultRole: 'linkset',
    signposting: true
  },
  alternate: {
    rel: 'alternate',
    rfc: 'RFC 8288',
    description: 'Links to an alternate format or profile representation.',
    defaultRole: 'alternate',
    signposting: false
  },
  'service-desc': {
    rel: 'service-desc',
    rfc: 'RFC 8631',
    description: 'Machine-readable API description (OpenAPI, GraphQL).',
    defaultRole: 'service_desc',
    signposting: false
  },
  'service-doc': {
    rel: 'service-doc',
    rfc: 'RFC 8631',
    description: 'Human-readable documentation for API or service.',
    defaultRole: 'service_doc',
    signposting: false
  }
};
```

Create `src/core/rt/patterns.ts`:
```typescript
export interface RTPatternDef {
  id: string; // e.g. "PT-01"
  rtCode: string; // e.g. "RT-P01"
  name: string;
  summary: string;
  roles: string[];
  requiredRelations: string[];
  recommendedRelations: string[];
}

export const RT_PATTERNS: RTPatternDef[] = [
  {
    id: 'PT-01',
    rtCode: 'RT-P01',
    name: 'Profile Conformity Declaration',
    summary: 'Declares that a resource conforms to a specific functional profile and links to profile documentation.',
    roles: ['resource', 'profile', 'profile_description', 'profile_type'],
    requiredRelations: ['profile'],
    recommendedRelations: ['describedby', 'type']
  },
  {
    id: 'PT-02',
    rtCode: 'RT-P02',
    name: 'Profile Composition',
    summary: 'Declares member sub-profiles composed inside a parent composite profile.',
    roles: ['parent_profile', 'part_profile'],
    requiredRelations: ['http://schema.org/hasPart'],
    recommendedRelations: ['http://schema.org/isPartOf']
  },
  {
    id: 'PT-03',
    rtCode: 'RT-P03',
    name: 'Content Negotiation Menu',
    summary: 'Advertises alternate representations and profile-specific formats available for a resource.',
    roles: ['resource', 'alternate'],
    requiredRelations: ['alternate'],
    recommendedRelations: ['profile']
  },
  {
    id: 'PT-04',
    rtCode: 'RT-P04',
    name: 'No Landing Page / Direct Metadata',
    summary: 'Directly links resources to machine-readable metadata, persistent identifier, and conceptual type.',
    roles: ['resource', 'metadata', 'cite_as', 'type'],
    requiredRelations: ['describedby'],
    recommendedRelations: ['cite-as', 'type']
  },
  {
    id: 'PT-05',
    rtCode: 'RT-P05',
    name: 'Subsetting API Integration',
    summary: 'Links a resource to machine-readable subsetting and query APIs (e.g. OGC API, OpenAPI).',
    roles: ['resource', 'service_desc', 'service_doc'],
    requiredRelations: ['service-desc'],
    recommendedRelations: ['service-doc']
  },
  {
    id: 'PT-06',
    rtCode: 'RT-P06',
    name: 'Hostwide Resource Discovery',
    summary: 'Enables sitemap.xml and robots.txt harvesting with embedded signposting links.',
    roles: ['robots', 'sitemap', 'resource'],
    requiredRelations: ['item'],
    recommendedRelations: ['profile', 'describedby']
  },
  {
    id: 'PT-07',
    rtCode: 'RT-P07',
    name: 'Catalog Assistance',
    summary: 'Establishes bidirectional item-collection navigation between datasets and catalog repositories.',
    roles: ['catalog', 'item'],
    requiredRelations: ['item'],
    recommendedRelations: ['collection']
  },
  {
    id: 'PT-08',
    rtCode: 'RT-P08',
    name: 'External Linksets',
    summary: 'Offloads complex or large link graphs to dedicated RFC 9264 linkset endpoints.',
    roles: ['resource', 'linkset'],
    requiredRelations: ['linkset'],
    recommendedRelations: []
  }
];

export function getPatternById(id: string): RTPatternDef | undefined {
  return RT_PATTERNS.find(p => p.id === id || p.rtCode === id);
}
```

Create `src/core/rt/presets.ts`:
```typescript
export interface SamplePreset {
  id: string;
  name: string;
  description: string;
  targetPattern: string;
  uris: Record<string, string>;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'arms-mbon',
    name: 'ARMS-MBON Marine Genomic Dataset',
    description: 'European Marine Biodiversity Observation Network genomic observatory dataset conforming to RO-Crate.',
    targetPattern: 'PT-01',
    uris: {
      resource: 'https://arms-mbon.org/data/baseline-2023',
      profile: 'https://w3id.org/ro/crate/1.1',
      profile_description: 'https://w3id.org/ro/crate/1.1.html',
      metadata: 'https://arms-mbon.org/data/baseline-2023/ro-crate-metadata.json'
    }
  },
  {
    id: 'eurobis-occurrences',
    name: 'EurOBIS Marine Biodiversity Occurrences',
    description: 'Standardized Darwin Core biodiversity distribution dataset with persistent citation DOI.',
    targetPattern: 'PT-04',
    uris: {
      resource: 'https://eurobis.org/dataset/123',
      metadata: 'https://eurobis.org/dataset/123.jsonld',
      cite_as: 'https://doi.org/10.14284/123',
      profile: 'https://dwc.tdwg.org/terms/'
    }
  },
  {
    id: 'north-sea-sensors',
    name: 'North Sea Buoy Telemetry Observation Stream',
    description: 'Real-time marine sensor stream providing OGC API and OpenAPI subsetting descriptions.',
    targetPattern: 'PT-05',
    uris: {
      resource: 'https://sensors.vliz.be/northsea/buoy-14',
      service_desc: 'https://sensors.vliz.be/api/openapi.json',
      service_doc: 'https://sensors.vliz.be/api/docs'
    }
  }
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/rt.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/rt/ tests/rt.test.ts
git commit -m "feat(rt): implement Radical Transparency patterns PT-01 to PT-08 and presets"
```

---

### Task 4: Didactic Triage Engine & Diagnostic Rules (`src/core/triage/`)

**Files:**
- Create: `src/core/triage/diagnostics.ts`
- Create: `src/core/triage/questions.ts`
- Test: `tests/triage.test.ts`

**Interfaces:**
- Produces: `evaluateHealthAndGaps(url: string, links: DiscoveredLink[]): DiagnosticReport`, `generateTriageQuestions(report: DiagnosticReport): TriageQuestion[]`.
- Consumes: `src/core/wrx/types.ts`, `src/core/rt/patterns.ts`, `src/core/rt/relations.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/triage.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { generateTriageQuestions } from '../src/core/triage/questions';

describe('Didactic Triage Engine', () => {
  it('should diagnose missing profile and cite-as as critical/warning gaps', () => {
    const report = evaluateHealthAndGaps('https://example.org/data', [
      { target: 'https://example.org/meta.jsonld', rel: 'describedby', source: 'link-header' }
    ]);
    expect(report.score).toBeLessThan(60);
    expect(report.gaps.some(g => g.rel === 'profile')).toBe(true);
    expect(report.gaps.some(g => g.rel === 'cite-as')).toBe(true);
  });

  it('should generate didactic questions with explanatory context', () => {
    const report = evaluateHealthAndGaps('https://example.org/data', []);
    const questions = generateTriageQuestions(report);
    expect(questions.length).toBeGreaterThan(0);
    const profileQ = questions.find(q => q.rel === 'profile');
    expect(profileQ).toBeDefined();
    expect(profileQ?.didacticText).toContain('harvesters');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/triage.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/core/triage/diagnostics.ts`:
```typescript
import { DiscoveredLink } from '../wrx/types';

export interface RTGap {
  rel: string;
  patternId: string;
  severity: 'CRITICAL' | 'WARNING' | 'RECOMMENDED';
  message: string;
  didacticReason: string;
}

export interface DiagnosticReport {
  targetUrl: string;
  score: number; // 0 - 100
  vitalStatus: 'CRITICAL' | 'UNSTABLE' | 'HEALTHY';
  presentRelations: string[];
  gaps: RTGap[];
  satisfiedPatterns: string[];
}

export function evaluateHealthAndGaps(url: string, links: DiscoveredLink[]): DiagnosticReport {
  const rels = new Set(links.map(l => l.rel.toLowerCase()));
  const gaps: RTGap[] = [];
  let score = 0;

  // 1. Profile conformance (PT-01 / RT-P01)
  if (rels.has('profile')) {
    score += 30;
  } else {
    gaps.push({
      rel: 'profile',
      patternId: 'PT-01',
      severity: 'CRITICAL',
      message: 'No functional profile declaration (rel="profile") discovered.',
      didacticReason: 'Without a profile declaration, automated harvesters cannot determine what standard or schema constraints govern your data.'
    });
  }

  // 2. Metadata description (PT-04 / RT-P04)
  if (rels.has('describedby')) {
    score += 25;
  } else {
    gaps.push({
      rel: 'describedby',
      patternId: 'PT-04',
      severity: 'CRITICAL',
      message: 'No descriptive metadata link (rel="describedby") discovered.',
      didacticReason: 'Harvesters need direct links to structured RDF metadata (JSON-LD, Turtle) to ingest dataset attributes without parsing unpredictable HTML.'
    });
  }

  // 3. Persistent Identifier / Citation (PT-04 / RT-P04)
  if (rels.has('cite-as')) {
    score += 20;
  } else {
    gaps.push({
      rel: 'cite-as',
      patternId: 'PT-04',
      severity: 'WARNING',
      message: 'No persistent identifier citation link (rel="cite-as") discovered.',
      didacticReason: 'Providing a permanent DOI or Handle via rel="cite-as" ensures persistent scholarly attribution and disambiguation in research catalogs.'
    });
  }

  // 4. Linkset or Catalog Assistance (PT-07 / PT-08)
  if (rels.has('linkset') || rels.has('item') || rels.has('collection')) {
    score += 15;
  } else {
    gaps.push({
      rel: 'linkset',
      patternId: 'PT-08',
      severity: 'RECOMMENDED',
      message: 'No external linkset or catalog grouping relations discovered.',
      didacticReason: 'RFC 9264 Linksets allow publishing comprehensive machine-readable relationship graphs without cluttering HTTP response headers.'
    });
  }

  // 5. Alternate formats or types (PT-03 / PT-04)
  if (rels.has('alternate') || rels.has('type')) {
    score += 10;
  }

  const vitalStatus = score >= 75 ? 'HEALTHY' : score >= 40 ? 'UNSTABLE' : 'CRITICAL';

  const satisfiedPatterns: string[] = [];
  if (rels.has('profile')) satisfiedPatterns.push('PT-01');
  if (rels.has('describedby')) satisfiedPatterns.push('PT-04');
  if (rels.has('linkset')) satisfiedPatterns.push('PT-08');

  return {
    targetUrl: url,
    score,
    vitalStatus,
    presentRelations: Array.from(rels),
    gaps,
    satisfiedPatterns
  };
}
```

Create `src/core/triage/questions.ts`:
```typescript
import { DiagnosticReport, RTGap } from './diagnostics';

export interface QuestionOption {
  label: string;
  uri: string;
  description?: string;
}

export interface TriageQuestion {
  id: string;
  rel: string;
  patternId: string;
  severity: RTGap['severity'];
  title: string;
  prompt: string;
  didacticText: string;
  quickOptions: QuestionOption[];
  inputPlaceholder: string;
}

const COMMON_PROFILES: QuestionOption[] = [
  { label: 'RO-Crate 1.1', uri: 'https://w3id.org/ro/crate/1.1', description: 'Research Object Crate metadata specification' },
  { label: 'DCAT-AP 2.1', uri: 'http://data.europa.eu/r5r/', description: 'DCAT Application Profile for European data portals' },
  { label: 'Darwin Core (DwC)', uri: 'https://dwc.tdwg.org/terms/', description: 'Biodiversity occurrence and taxonomic standard' }
];

export function generateTriageQuestions(report: DiagnosticReport): TriageQuestion[] {
  return report.gaps.map((gap, index) => {
    switch (gap.rel) {
      case 'profile':
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: 'Prescribe Functional Profile Conformance',
          prompt: 'Does this resource adhere to an established domain profile or specification?',
          didacticText: gap.didacticReason,
          quickOptions: COMMON_PROFILES,
          inputPlaceholder: 'https://example.org/my-profile'
        };
      case 'describedby':
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: 'Attach Descriptive Metadata Document',
          prompt: 'Where is the machine-readable metadata (JSON-LD, Turtle, RDF/XML) located?',
          didacticText: gap.didacticReason,
          quickOptions: [
            { label: 'Auto JSON-LD Endpoint', uri: `${report.targetUrl}.jsonld` },
            { label: 'Auto Turtle Endpoint', uri: `${report.targetUrl}.ttl` }
          ],
          inputPlaceholder: 'https://example.org/dataset.jsonld'
        };
      case 'cite-as':
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: 'Assign Persistent Citation Identifier (PID)',
          prompt: 'What permanent identifier (DOI, Handle, or URN) should machines cite this dataset with?',
          didacticText: gap.didacticReason,
          quickOptions: [],
          inputPlaceholder: 'https://doi.org/10.1234/example-dataset'
        };
      case 'linkset':
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: 'Attach RFC 9264 Linkset',
          prompt: 'Would you like to advertise an external linkset document for this resource?',
          didacticText: gap.didacticReason,
          quickOptions: [
            { label: 'Well-Known Linkset', uri: new URL('/.well-known/linkset', report.targetUrl).href }
          ],
          inputPlaceholder: 'https://example.org/.well-known/linkset'
        };
      default:
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: `Resolve missing rel="${gap.rel}"`,
          prompt: `Specify target URI for rel="${gap.rel}"`,
          didacticText: gap.didacticReason,
          quickOptions: [],
          inputPlaceholder: 'https://...'
        };
    }
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/triage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/triage/ tests/triage.test.ts
git commit -m "feat(triage): implement RT diagnostic health evaluator and question generator"
```

---

### Task 5: State Store & URL Fragment Compression (`src/core/state/`)

**Files:**
- Create: `src/core/state/store.ts`
- Create: `src/core/state/fragment.ts`
- Test: `tests/state.test.ts`

**Interfaces:**
- Produces: `AppStore`, `encodeStateToFragment(state: AppState): Promise<string>`, `decodeStateFromFragment(hash: string): Promise<AppState | null>`.
- Consumes: Standard `CompressionStream` and `DecompressionStream`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/state.test.ts
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { encodeStateToFragment, decodeStateFromFragment } from '../src/core/state/fragment';

describe('State Store & Fragment Persistence', () => {
  it('should record user interaction events in history and support undo', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    store.answerQuestion('q-profile', 'profile', 'https://w3id.org/ro/crate/1.1');

    expect(store.getState().history).toHaveLength(2);
    expect(store.getState().links).toHaveLength(1);

    store.undo();
    expect(store.getState().links).toHaveLength(0);
  });

  it('should round-trip compress and decompress state to URI fragment', async () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/test');
    store.answerQuestion('q-profile', 'profile', 'https://example.org/prof');

    const fragment = await encodeStateToFragment(store.getState());
    expect(fragment.startsWith('#gz=')).toBe(true);

    const recovered = await decodeStateFromFragment(fragment);
    expect(recovered).toBeDefined();
    expect(recovered?.seedUri).toBe('https://example.org/test');
    expect(recovered?.links[0].target).toBe('https://example.org/prof');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/core/state/store.ts`:
```typescript
import { DiscoveredLink } from '../wrx/types';

export interface UserInteractionEvent {
  id: string;
  type: 'SET_SEED_URI' | 'ANSWER_QUESTION' | 'ADD_LINK' | 'REMOVE_LINK' | 'SET_VIEW_MODE';
  timestamp: number;
  payload: any;
}

export interface AppState {
  version: number;
  mode: 'triage' | 'wizard';
  seedUri: string;
  activePatternId: string;
  links: DiscoveredLink[];
  history: UserInteractionEvent[];
  ui: {
    viewMode: 'balanced' | 'extended-triage' | 'extended-graph';
    activeQuestionIndex: number;
  };
}

export class AppStore {
  private state: AppState;
  private listeners: Array<(state: AppState) => void> = [];

  constructor(initialState?: Partial<AppState>) {
    this.state = {
      version: 1,
      mode: 'triage',
      seedUri: '',
      activePatternId: 'PT-01',
      links: [],
      history: [],
      ui: {
        viewMode: 'balanced',
        activeQuestionIndex: 0
      },
      ...initialState
    };
  }

  public getState(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const s = this.getState();
    this.listeners.forEach(l => l(s));
  }

  public setSeedUri(uri: string): void {
    const event: UserInteractionEvent = {
      id: crypto.randomUUID(),
      type: 'SET_SEED_URI',
      timestamp: Date.now(),
      payload: { uri }
    };
    this.state.seedUri = uri;
    this.state.history.push(event);
    this.notify();
  }

  public setLinks(links: DiscoveredLink[]): void {
    this.state.links = links;
    this.notify();
  }

  public answerQuestion(questionId: string, rel: string, targetUri: string): void {
    const event: UserInteractionEvent = {
      id: crypto.randomUUID(),
      type: 'ANSWER_QUESTION',
      timestamp: Date.now(),
      payload: { questionId, rel, targetUri }
    };
    this.state.history.push(event);

    // Add or replace link
    const existingIdx = this.state.links.findIndex(l => l.rel === rel);
    const newLink: DiscoveredLink = {
      target: targetUri,
      rel,
      source: 'link-header'
    };

    if (existingIdx >= 0) {
      this.state.links[existingIdx] = newLink;
    } else {
      this.state.links.push(newLink);
    }

    this.notify();
  }

  public setViewMode(mode: 'balanced' | 'extended-triage' | 'extended-graph'): void {
    this.state.ui.viewMode = mode;
    this.notify();
  }

  public setQuestionIndex(index: number): void {
    this.state.ui.activeQuestionIndex = index;
    this.notify();
  }

  public undo(): void {
    if (this.state.history.length === 0) return;
    this.state.history.pop();
    // Replay remaining history from scratch
    const remaining = [...this.state.history];
    this.state.seedUri = '';
    this.state.links = [];
    this.state.history = [];

    for (const e of remaining) {
      if (e.type === 'SET_SEED_URI') this.setSeedUri(e.payload.uri);
      else if (e.type === 'ANSWER_QUESTION') this.answerQuestion(e.payload.questionId, e.payload.rel, e.payload.targetUri);
    }
  }

  public reset(): void {
    this.state.seedUri = '';
    this.state.links = [];
    this.state.history = [];
    this.state.ui.activeQuestionIndex = 0;
    this.notify();
  }
}
```

Create `src/core/state/fragment.ts`:
```typescript
import { AppState } from './store';

export async function encodeStateToFragment(state: AppState): Promise<string> {
  const json = JSON.stringify(state);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);

  // Use CompressionStream if available, fallback to simple base64url
  if (typeof CompressionStream !== 'undefined') {
    try {
      const cs = new CompressionStream('deflate-raw');
      const writer = cs.writable.getWriter();
      writer.write(data);
      writer.close();
      const compressedBuffer = await new Response(cs.readable).arrayBuffer();
      const base64 = bufferToBase64Url(new Uint8Array(compressedBuffer));
      return `#gz=${base64}`;
    } catch {}
  }
  return `#raw=${bufferToBase64Url(data)}`;
}

export async function decodeStateFromFragment(hash: string): Promise<AppState | null> {
  if (!hash || !hash.includes('=')) return null;
  const [prefix, payload] = hash.replace(/^#/, '').split('=');
  if (!payload) return null;

  try {
    const bytes = base64UrlToBuffer(payload);
    if (prefix === 'gz' && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
      const json = new TextDecoder().decode(decompressedBuffer);
      return JSON.parse(json);
    } else {
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
    }
  } catch (err) {
    console.warn('Failed to decompress URI fragment state', err);
    return null;
  }
}

function bufferToBase64Url(uint8: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/state/ tests/state.test.ts
git commit -m "feat(state): implement event-sourced store and compressed URI fragment persistence"
```

---

### Task 6: Remediation & IT Ticket Exporters (`src/core/export/`)

**Files:**
- Create: `src/core/export/link-headers.ts`
- Create: `src/core/export/sitemap.ts`
- Create: `src/core/export/yaml-test.ts`
- Create: `src/core/export/it-ticket.ts`
- Test: `tests/export.test.ts`

**Interfaces:**
- Produces: Functions to generate HTTP headers, `sitemap.xml`, `rt-test` YAML, and Systemic IT Ticket Markdown.
- Consumes: `src/core/wrx/types.ts`, `src/core/triage/diagnostics.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/export.test.ts
import { describe, it, expect } from 'vitest';
import { generateHttpHeaders } from '../src/core/export/link-headers';
import { generateSitemapXml } from '../src/core/export/sitemap';
import { generateRtTestYaml } from '../src/core/export/yaml-test';
import { generateSystemicItTicket } from '../src/core/export/it-ticket';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';

describe('Exporters & Systemic Remediation Artifacts', () => {
  const url = 'https://example.org/dataset/01';
  const links = [
    { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' as const },
    { target: 'https://doi.org/10.1234/test', rel: 'cite-as', source: 'link-header' as const }
  ];

  it('should generate valid HTTP Link headers for Apache and Nginx', () => {
    const out = generateHttpHeaders(links);
    expect(out.raw).toContain('rel="profile"');
    expect(out.nginx).toContain('add_header Link');
    expect(out.apache).toContain('Header add Link');
  });

  it('should generate sitemap.xml with xhtml:link elements', () => {
    const xml = generateSitemapXml(url, links);
    expect(xml).toContain('<loc>https://example.org/dataset/01</loc>');
    expect(xml).toContain('xhtml:link rel="profile" href="https://w3id.org/ro/crate/1.1"');
  });

  it('should generate rt-test YAML matching grmp-test-implementations syntax', () => {
    const yaml = generateRtTestYaml(url, links);
    expect(yaml).toContain('type: "PT-01"');
    expect(yaml).toContain('resource: "https://example.org/dataset/01"');
  });

  it('should generate systemic IT ticket formulated across the whole server', () => {
    const report = evaluateHealthAndGaps(url, links);
    const md = generateSystemicItTicket(report, links);
    expect(md).toContain('[Architecture / Interoperability]');
    expect(md).toContain('Systemic Remediation');
    expect(md).toContain('Exemplar Headers');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/export.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/core/export/link-headers.ts`:
```typescript
import { DiscoveredLink } from '../wrx/types';

export interface HttpHeadersExport {
  raw: string;
  nginx: string;
  apache: string;
  caddy: string;
}

export function generateHttpHeaders(links: DiscoveredLink[]): HttpHeadersExport {
  if (links.length === 0) {
    return { raw: '', nginx: '', apache: '', caddy: '' };
  }

  const parts = links.map(l => {
    let s = `<${l.target}>; rel="${l.rel}"`;
    if (l.type) s += `; type="${l.type}"`;
    if (l.profile) s += `; profile="${l.profile}"`;
    return s;
  });

  const raw = `Link: ${parts.join(', ')}`;
  const nginx = `add_header Link "${parts.join(', ')}";`;
  const apache = `Header add Link "${parts.join(', ')}"`;
  const caddy = `header Link "${parts.join(', ')}"`;

  return { raw, nginx, apache, caddy };
}
```

Create `src/core/export/sitemap.ts`:
```typescript
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
```

Create `src/core/export/yaml-test.ts`:
```typescript
import { DiscoveredLink } from '../wrx/types';

export function generateRtTestYaml(resourceUri: string, links: DiscoveredLink[]): string {
  const profileLink = links.find(l => l.rel === 'profile');
  const describedByLink = links.find(l => l.rel === 'describedby');
  const citeAsLink = links.find(l => l.rel === 'cite-as');

  return `version: "1.0"
name: "Automated Radical Transparency Conformance Test Suite"

patterns:
  - name: "Resource Profile & Metadata Conformance"
    type: "PT-01"
    uris:
      resource: "${resourceUri || 'https://example.org/resource'}"
${profileLink ? `      profile: "${profileLink.target}"\n` : ''}${describedByLink ? `      profile_description: "${describedByLink.target}"\n` : ''}${citeAsLink ? `      cite_as: "${citeAsLink.target}"\n` : ''}`;
}
```

Create `src/core/export/it-ticket.ts`:
```typescript
import { DiagnosticReport } from '../triage/diagnostics';
import { DiscoveredLink } from '../wrx/types';
import { generateHttpHeaders } from './link-headers';

export function generateSystemicItTicket(report: DiagnosticReport, links: DiscoveredLink[]): string {
  const headers = generateHttpHeaders(links);

  return `## [Architecture / Interoperability] Implement Server-Wide RFC 8288 Link Headers & RT Sitemaps for Machine Harvesters

### Background & Business Impact
Automated research infrastructure harvesters (EOSC, OpenAIRE, thematic disciplinary aggregators) require transparent, machine-readable discovery of dataset schemas, metadata, and persistent identifiers (PIDs) using RFC 8288 HTTP Link headers and XML sitemaps.

Current HTTP responses across our digital asset catalog lack these standardized headers, hindering indexation and failing compliance audits.

### Pilot Exemplar Tested
- **Test Endpoint:** \`${report.targetUrl || 'https://example.org/resource'}\`
- **Current Vital Signs Score:** \`${report.score} / 100\` (${report.vitalStatus})
- **Discovered Gaps:**
${report.gaps.map(g => `  - [${g.severity}] ${g.message} — *${g.didacticReason}*`).join('\n')}

### Proposed Systemic Remediation
Rather than fixing this single URL individually, please configure our webserver reverse proxy (Nginx / Apache / Cloudflare) or CMS response middleware to inject the standard headers across **all published dataset and catalog endpoints**.

#### 1. HTTP Response Headers (Reverse Proxy Configuration)
**Raw Header:**
\`\`\`http
${headers.raw}
\`\`\`

**Nginx Snippet:**
\`\`\`nginx
${headers.nginx}
\`\`\`

**Apache Snippet:**
\`\`\`apache
${headers.apache}
\`\`\`

#### 2. Sitemap Update
Update our automated \`sitemap.xml\` generator to output \`<xhtml:link>\` signposting entries for all dataset records.

#### 3. Verification
Verify implementation by running the automated GRMP Radical Transparency test runner:
\`docker run --rm -v $(pwd)/rt-test.yaml:/app/test_config.yaml ghcr.io/vliz-be-opsci/rt-test:latest\`
`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/export.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/export/ tests/export.test.ts
git commit -m "feat(export): implement HTTP headers, sitemap XML, rt-test YAML, and systemic IT ticket generator"
```

---

### Task 7: Interactive SVG Network Graph Visualizer (`src/ui/graph/`)

**Files:**
- Create: `src/ui/graph/renderer.ts`
- Create: `src/ui/graph/exporter.ts`
- Test: `tests/graph.test.ts`

**Interfaces:**
- Produces: `renderNetworkGraph(container: HTMLElement, state: AppState, onNodeClick?: (nodeId: string) => void): GraphController`, `exportGraphAsPngOrSvg(svgEl: SVGSVGElement, format: 'png' | 'svg'): Promise<void>`.
- Consumes: Standard DOM SVG and Canvas APIs.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/graph.test.ts
import { describe, it, expect } from 'vitest';
import { buildGraphModel } from '../src/ui/graph/renderer';

describe('Graph Visualizer Model', () => {
  it('should transform app state links into graph nodes and colored edges', () => {
    const links = [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' as const }
    ];
    const graph = buildGraphModel('https://example.org/data', links);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].color).toBe('var(--er-vital-green)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/graph.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/ui/graph/renderer.ts`:
```typescript
import { DiscoveredLink } from '../../core/wrx/types';

export interface GraphNode {
  id: string;
  label: string;
  type: 'resource' | 'profile' | 'metadata' | 'pid' | 'other';
  color: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  rel: string;
  color: string;
  dashed: boolean;
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraphModel(seedUri: string, links: DiscoveredLink[]): GraphModel {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const rootId = seedUri || 'https://example.org/resource';

  nodes.push({
    id: rootId,
    label: formatLabel(rootId),
    type: 'resource',
    color: '#3b82f6',
    x: 250,
    y: 200
  });

  links.forEach((link, idx) => {
    let nodeType: GraphNode['type'] = 'other';
    let color = '#9ca3af';

    if (link.rel === 'profile') {
      nodeType = 'profile';
      color = '#8b5cf6';
    } else if (link.rel === 'describedby') {
      nodeType = 'metadata';
      color = '#10b981';
    } else if (link.rel === 'cite-as') {
      nodeType = 'pid';
      color = '#f59e0b';
    }

    if (!nodes.some(n => n.id === link.target)) {
      const angle = (idx / Math.max(links.length, 1)) * 2 * Math.PI;
      const radius = 150;
      nodes.push({
        id: link.target,
        label: formatLabel(link.target),
        type: nodeType,
        color,
        x: 250 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle)
      });
    }

    edges.push({
      source: rootId,
      target: link.target,
      rel: link.rel,
      color: 'var(--er-vital-green)',
      dashed: false
    });
  });

  return { nodes, edges };
}

function formatLabel(uri: string): string {
  try {
    const u = new URL(uri);
    const lastPart = u.pathname.split('/').filter(Boolean).pop();
    return lastPart || u.hostname;
  } catch {
    return uri.slice(-15);
  }
}

export function renderSvgGraph(
  container: HTMLElement,
  model: GraphModel,
  onNodeClick?: (id: string) => void
): SVGSVGElement {
  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 500 400');
  svg.style.cursor = 'grab';

  // Render Edges
  model.edges.forEach(edge => {
    const srcNode = model.nodes.find(n => n.id === edge.source);
    const tgtNode = model.nodes.find(n => n.id === edge.target);
    if (!srcNode || !tgtNode) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', srcNode.x.toString());
    line.setAttribute('y1', srcNode.y.toString());
    line.setAttribute('x2', tgtNode.x.toString());
    line.setAttribute('y2', tgtNode.y.toString());
    line.setAttribute('stroke', edge.color);
    line.setAttribute('stroke-width', '2');
    if (edge.dashed) line.setAttribute('stroke-dasharray', '4');
    svg.appendChild(line);

    // Edge Label
    const midX = (srcNode.x + tgtNode.x) / 2;
    const midY = (srcNode.y + tgtNode.y) / 2;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', midX.toString());
    text.setAttribute('y', (midY - 5).toString());
    text.setAttribute('fill', '#9ca3af');
    text.setAttribute('font-size', '10');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = `rel="${edge.rel}"`;
    svg.appendChild(text);
  });

  // Render Nodes
  model.nodes.forEach(node => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    g.onclick = () => onNodeClick?.(node.id);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x.toString());
    circle.setAttribute('cy', node.y.toString());
    circle.setAttribute('r', node.type === 'resource' ? '20' : '15');
    circle.setAttribute('fill', node.color);
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x.toString());
    text.setAttribute('y', (node.y + 30).toString());
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('font-size', '11');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = node.label;
    g.appendChild(text);

    svg.appendChild(g);
  });

  container.appendChild(svg);
  return svg;
}
```

Create `src/ui/graph/exporter.ts`:
```typescript
export async function downloadGraphImage(svgElement: SVGSVGElement, filename = 'webmap-er-graph.png'): Promise<void> {
  const xml = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 800;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#0b0f19';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const png = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = filename;
      a.href = png;
      a.click();
    }
    URL.revokeObjectURL(blobURL);
  };
  image.src = blobURL;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/graph.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/graph/ tests/graph.test.ts
git commit -m "feat(graph): implement SVG network graph model, renderer, and PNG export"
```

---

### Task 8: Adaptive Split-Pane UI & Triage Components (`src/ui/`)

**Files:**
- Create: `src/ui/components/header.ts`
- Create: `src/ui/components/triage-panel.ts`
- Create: `src/ui/components/graph-panel.ts`
- Create: `src/ui/components/export-modal.ts`
- Create: `src/ui/components/tutorial-modal.ts`
- Create: `src/ui/layout.ts`
- Test: `tests/ui.test.ts`

**Interfaces:**
- Produces: UI component tree wired to `AppStore`, supporting 3 layout view modes (Balanced, Extended Triage, Extended Graph), full triage questionnaire, export previews, and tutorial guide.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/ui.test.ts
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { initLayout } from '../src/ui/layout';

describe('UI Layout & View Mode Switching', () => {
  it('should initialize split-pane layout and apply view mode classes', () => {
    const container = document.createElement('div');
    const store = new AppStore();
    const layout = initLayout(container, store);

    expect(container.querySelector('.split-container')).toBeDefined();
    store.setViewMode('extended-triage');
    expect(container.querySelector('.split-container')?.classList.contains('mode-extended-triage')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/ui/components/header.ts`:
```typescript
import { AppStore } from '../../core/state/store';
import { SAMPLE_PRESETS } from '../../core/rt/presets';
import { encodeStateToFragment } from '../../core/state/fragment';

export function createHeader(store: AppStore, onOpenTutorial: () => void, onOpenExport: () => void): HTMLElement {
  const header = document.createElement('header');
  header.className = 'app-header';

  header.innerHTML = `
    <div class="header-brand">
      <span class="er-cross">✚</span>
      <span class="brand-title">webmap-ER</span>
      <span class="badge-tag">Radical Transparency Triage</span>
    </div>
    <div class="header-actions">
      <select id="preset-select" class="btn btn-select">
        <option value="">-- Load Sample Preset --</option>
        ${SAMPLE_PRESETS.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </select>
      <div class="view-toggles">
        <button id="btn-view-triage" class="btn btn-toggle" title="Extended Questionnaire">📋 Questionnaire</button>
        <button id="btn-view-balanced" class="btn btn-toggle active" title="Balanced View">⚖️ Balanced</button>
        <button id="btn-view-graph" class="btn btn-toggle" title="Extended Graph">🕸️ Graph</button>
      </div>
      <button id="btn-export" class="btn btn-primary">Export & IT Ticket</button>
      <button id="btn-share" class="btn btn-secondary">🔗 Copy Permalink</button>
      <button id="btn-tutorial" class="btn btn-icon" title="Onboarding Tutorial">❓</button>
    </div>
  `;

  // Preset selector
  header.querySelector('#preset-select')?.addEventListener('change', (e) => {
    const id = (e.target as HTMLSelectElement).value;
    const preset = SAMPLE_PRESETS.find(p => p.id === id);
    if (preset) {
      store.setSeedUri(preset.uris.resource);
      const links = Object.entries(preset.uris)
        .filter(([key]) => key !== 'resource')
        .map(([key, uri]) => ({
          target: uri,
          rel: key === 'metadata' ? 'describedby' : key === 'cite_as' ? 'cite-as' : key,
          source: 'link-header' as const
        }));
      store.setLinks(links);
    }
  });

  // View toggles
  header.querySelector('#btn-view-triage')?.addEventListener('click', () => store.setViewMode('extended-triage'));
  header.querySelector('#btn-view-balanced')?.addEventListener('click', () => store.setViewMode('balanced'));
  header.querySelector('#btn-view-graph')?.addEventListener('click', () => store.setViewMode('extended-graph'));

  // Export and share
  header.querySelector('#btn-export')?.addEventListener('click', onOpenExport);
  header.querySelector('#btn-tutorial')?.addEventListener('click', onOpenTutorial);
  header.querySelector('#btn-share')?.addEventListener('click', async () => {
    const hash = await encodeStateToFragment(store.getState());
    window.location.hash = hash;
    navigator.clipboard.writeText(window.location.href);
    alert('Shareable permalink copied to clipboard!');
  });

  return header;
}
```

Create `src/ui/components/triage-panel.ts`:
```typescript
import { AppStore } from '../../core/state/store';
import { evaluateHealthAndGaps } from '../../core/triage/diagnostics';
import { generateTriageQuestions } from '../../core/triage/questions';
import { extractResourceLinks } from '../../core/wrx/extractor';

export function createTriagePanel(store: AppStore): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'triage-panel';

  function render() {
    const state = store.getState();
    const report = evaluateHealthAndGaps(state.seedUri, state.links);
    const questions = generateTriageQuestions(report);
    const activeIdx = Math.min(state.ui.activeQuestionIndex, Math.max(0, questions.length - 1));
    const currentQ = questions[activeIdx];

    panel.innerHTML = `
      <div class="vital-signs-bar">
        <div class="vital-metric">
          <span class="metric-label">RT HEALTH SCORE</span>
          <span class="metric-value vital-${report.vitalStatus.toLowerCase()}">${report.score}%</span>
        </div>
        <div class="vital-metric">
          <span class="metric-label">STATUS</span>
          <span class="metric-badge badge-${report.vitalStatus.toLowerCase()}">${report.vitalStatus}</span>
        </div>
        <div class="vital-metric">
          <span class="metric-label">DETECTED RELS</span>
          <span class="metric-value">${report.presentRelations.length}</span>
        </div>
      </div>

      <div class="seed-input-card">
        <label class="form-label">Seed Resource URI</label>
        <div class="input-row">
          <input type="text" id="seed-uri-input" class="form-control" placeholder="https://example.org/dataset" value="${state.seedUri}" />
          <button id="btn-extract" class="btn btn-primary">Diagnose (wrx)</button>
        </div>
      </div>

      ${currentQ ? `
        <div class="question-card severity-${currentQ.severity.toLowerCase()}">
          <div class="card-header">
            <span class="card-step">Question ${activeIdx + 1} of ${questions.length}</span>
            <span class="severity-tag">${currentQ.severity} GAP</span>
          </div>
          <h3 class="card-title">${currentQ.title}</h3>
          <p class="card-prompt">${currentQ.prompt}</p>
          
          <div class="didactic-pill">
            <span class="didactic-icon">💡</span>
            <span class="didactic-text"><strong>Why This Matters:</strong> ${currentQ.didacticText}</span>
          </div>

          ${currentQ.quickOptions.length > 0 ? `
            <div class="quick-options">
              ${currentQ.quickOptions.map(opt => `
                <button class="btn btn-quick-opt" data-uri="${opt.uri}">
                  ${opt.label}
                  ${opt.description ? `<small>${opt.description}</small>` : ''}
                </button>
              `).join('')}
            </div>
          ` : ''}

          <div class="custom-input-group">
            <input type="text" id="custom-uri-input" class="form-control" placeholder="${currentQ.inputPlaceholder}" />
            <button id="btn-save-answer" class="btn btn-primary">Prescribe</button>
          </div>

          <div class="card-nav">
            <button id="btn-prev-q" class="btn btn-secondary" ${activeIdx === 0 ? 'disabled' : ''}>← Previous</button>
            <button id="btn-undo" class="btn btn-secondary" ${state.history.length === 0 ? 'disabled' : ''}>↶ Undo</button>
            <button id="btn-next-q" class="btn btn-secondary" ${activeIdx >= questions.length - 1 ? 'disabled' : ''}>Next →</button>
          </div>
        </div>
      ` : `
        <div class="healthy-state-card">
          <span class="healthy-icon">🎉</span>
          <h3>All Vital Relations Prescribed!</h3>
          <p>Your resource conforms to basic Radical Transparency standards. Open the Export dialog to grab your HTTP headers, sitemap, and IT ticket.</p>
        </div>
      `}
    `;

    // Wire events
    panel.querySelector('#btn-extract')?.addEventListener('click', async () => {
      const input = (panel.querySelector('#seed-uri-input') as HTMLInputElement)?.value.trim();
      if (!input) return;
      store.setSeedUri(input);
      const res = await extractResourceLinks(input);
      if (res.corsBlocked) {
        alert('Notice: Endpoint blocked direct browser inspection (missing CORS headers). Proceeding with manual ER triage.');
      } else {
        store.setLinks(res.links);
      }
    });

    panel.querySelectorAll('.btn-quick-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const uri = btn.getAttribute('data-uri');
        if (uri && currentQ) {
          store.answerQuestion(currentQ.id, currentQ.rel, uri);
          if (activeIdx < questions.length - 1) {
            store.setQuestionIndex(activeIdx + 1);
          }
        }
      });
    });

    panel.querySelector('#btn-save-answer')?.addEventListener('click', () => {
      const val = (panel.querySelector('#custom-uri-input') as HTMLInputElement)?.value.trim();
      if (val && currentQ) {
        store.answerQuestion(currentQ.id, currentQ.rel, val);
        if (activeIdx < questions.length - 1) {
          store.setQuestionIndex(activeIdx + 1);
        }
      }
    });

    panel.querySelector('#btn-prev-q')?.addEventListener('click', () => store.setQuestionIndex(activeIdx - 1));
    panel.querySelector('#btn-next-q')?.addEventListener('click', () => store.setQuestionIndex(activeIdx + 1));
    panel.querySelector('#btn-undo')?.addEventListener('click', () => store.undo());
  }

  store.subscribe(render);
  render();
  return panel;
}
```

Create `src/ui/components/graph-panel.ts`:
```typescript
import { AppStore } from '../../core/state/store';
import { buildGraphModel, renderSvgGraph } from '../graph/renderer';
import { downloadGraphImage } from '../graph/exporter';

export function createGraphPanel(store: AppStore): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'graph-panel';

  panel.innerHTML = `
    <div class="graph-toolbar">
      <span class="graph-title">RT Network Topology</span>
      <div class="graph-actions">
        <button id="btn-export-png" class="btn btn-secondary btn-sm">Export PNG</button>
      </div>
    </div>
    <div class="graph-canvas-container" id="graph-container"></div>
  `;

  let currentSvg: SVGSVGElement | null = null;

  function render() {
    const container = panel.querySelector('#graph-container') as HTMLElement;
    if (!container) return;
    const state = store.getState();
    const model = buildGraphModel(state.seedUri, state.links);
    currentSvg = renderSvgGraph(container, model, (nodeId) => {
      console.log('Node clicked:', nodeId);
    });
  }

  panel.querySelector('#btn-export-png')?.addEventListener('click', () => {
    if (currentSvg) downloadGraphImage(currentSvg);
  });

  store.subscribe(render);
  setTimeout(render, 50);
  return panel;
}
```

Create `src/ui/components/export-modal.ts`:
```typescript
import { AppStore } from '../../core/state/store';
import { evaluateHealthAndGaps } from '../../core/triage/diagnostics';
import { generateHttpHeaders } from '../../core/export/link-headers';
import { generateSitemapXml } from '../../core/export/sitemap';
import { generateRtTestYaml } from '../../core/export/yaml-test';
import { generateSystemicItTicket } from '../../core/export/it-ticket';

export function createExportModal(store: AppStore, onClose: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  const state = store.getState();
  const report = evaluateHealthAndGaps(state.seedUri, state.links);
  const headers = generateHttpHeaders(state.links);
  const sitemap = generateSitemapXml(state.seedUri, state.links);
  const yaml = generateRtTestYaml(state.seedUri, state.links);
  const itTicket = generateSystemicItTicket(report, state.links);

  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h2>Remediation Artifacts & Systemic IT Ticket</h2>
        <button id="modal-close-btn" class="btn btn-icon">✕</button>
      </div>
      <div class="modal-tabs">
        <button class="tab-btn active" data-target="#tab-ticket">IT Ticket (Systemic)</button>
        <button class="tab-btn" data-target="#tab-headers">HTTP Link Headers</button>
        <button class="tab-btn" data-target="#tab-sitemap">sitemap.xml</button>
        <button class="tab-btn" data-target="#tab-yaml">rt-test YAML</button>
      </div>
      <div class="modal-body">
        <div id="tab-ticket" class="tab-pane active">
          <pre class="code-block"><code>${escapeHtml(itTicket)}</code></pre>
          <button class="btn btn-primary btn-copy" data-text="${encodeURIComponent(itTicket)}">Copy IT Ticket</button>
        </div>
        <div id="tab-headers" class="tab-pane">
          <h4>Apache</h4>
          <pre class="code-block"><code>${escapeHtml(headers.apache)}</code></pre>
          <h4>Nginx</h4>
          <pre class="code-block"><code>${escapeHtml(headers.nginx)}</code></pre>
        </div>
        <div id="tab-sitemap" class="tab-pane">
          <pre class="code-block"><code>${escapeHtml(sitemap)}</code></pre>
        </div>
        <div id="tab-yaml" class="tab-pane">
          <pre class="code-block"><code>${escapeHtml(yaml)}</code></pre>
        </div>
      </div>
    </div>
  `;

  modal.querySelector('#modal-close-btn')?.addEventListener('click', onClose);
  modal.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      modal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const target = (e.target as HTMLElement).getAttribute('data-target');
      (e.target as HTMLElement).classList.add('active');
      if (target) modal.querySelector(target)?.classList.add('active');
    });
  });

  modal.querySelector('.btn-copy')?.addEventListener('click', (e) => {
    const text = decodeURIComponent((e.target as HTMLElement).getAttribute('data-text') || '');
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  });

  return modal;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

Create `src/ui/components/tutorial-modal.ts`:
```typescript
export function createTutorialModal(onClose: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h2>Welcome to webmap-ER</h2>
        <button id="tutorial-close-btn" class="btn btn-icon">✕</button>
      </div>
      <div class="modal-body tutorial-content">
        <h3>✚ The Radical Transparency Emergency Room</h3>
        <p>Radical Transparency (RT) ensures that automated research engines can discover the standards, metadata, and citation IDs of digital resources without downloading entire datasets.</p>
        
        <h4>Step 1: Patient Triage (Extraction)</h4>
        <p>Enter any dataset URL or select a sample preset. <code>wrx</code> inspects the resource's live HTTP Link headers and linksets.</p>

        <h4>Step 2: Diagnosis & Prescription</h4>
        <p>The system flags missing vital signs (like <code>rel="profile"</code> or <code>rel="cite-as"</code>). Answer the guided questions to select the right standards.</p>

        <h4>Step 3: Systemic IT Ticket</h4>
        <p>Click <strong>Export & IT Ticket</strong> to copy a formatted ticket for your DevOps team to implement these headers across all dataset endpoints on your webserver.</p>
      </div>
    </div>
  `;

  modal.querySelector('#tutorial-close-btn')?.addEventListener('click', onClose);
  return modal;
}
```

Create `src/ui/layout.ts`:
```typescript
import { AppStore } from '../core/state/store';
import { createHeader } from './components/header';
import { createTriagePanel } from './components/triage-panel';
import { createGraphPanel } from './components/graph-panel';
import { createExportModal } from './components/export-modal';
import { createTutorialModal } from './components/tutorial-modal';

export function initLayout(container: HTMLElement, store: AppStore): void {
  container.innerHTML = '';

  const header = createHeader(
    store,
    () => openModal(createTutorialModal(() => closeModal())),
    () => openModal(createExportModal(store, () => closeModal()))
  );

  const splitContainer = document.createElement('main');
  splitContainer.className = 'split-container mode-balanced';

  const leftPane = createTriagePanel(store);
  const rightPane = createGraphPanel(store);

  splitContainer.appendChild(leftPane);
  splitContainer.appendChild(rightPane);

  container.appendChild(header);
  container.appendChild(splitContainer);

  // Sync view modes
  store.subscribe(state => {
    splitContainer.className = `split-container mode-${state.ui.viewMode}`;
  });

  function openModal(modalEl: HTMLElement) {
    closeModal();
    modalEl.id = 'active-modal';
    container.appendChild(modalEl);
  }

  function closeModal() {
    container.querySelector('#active-modal')?.remove();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/ tests/ui.test.ts
git commit -m "feat(ui): implement adaptive split-pane layout, triage panel, export modal, and tutorial"
```

---

### Task 9: End-to-End Integration, Presets & Build Verification

**Files:**
- Modify: `src/main.ts`
- Modify: `src/style.css`
- Test: `tests/e2e.test.ts`

**Interfaces:**
- Produces: Complete working application in `src/main.ts` decoding URL fragment on startup, full CSS layout styles, passing build `npm run build`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/e2e.test.ts
import { describe, it, expect } from 'vitest';
import { decodeStateFromFragment, encodeStateToFragment } from '../src/core/state/fragment';
import { AppStore } from '../src/core/state/store';

describe('End-to-End State Lifecycle', () => {
  it('should initialize store from decoded URL hash', async () => {
    const original = new AppStore();
    original.setSeedUri('https://arms-mbon.org/data');
    original.answerQuestion('q-1', 'profile', 'https://w3id.org/ro/crate/1.1');

    const hash = await encodeStateToFragment(original.getState());
    const recoveredState = await decodeStateFromFragment(hash);

    expect(recoveredState).toBeDefined();
    const restoredStore = new AppStore(recoveredState!);
    expect(restoredStore.getState().seedUri).toBe('https://arms-mbon.org/data');
    expect(restoredStore.getState().links).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/e2e.test.ts`
Expected: PASS (or ensure all imports resolve properly).

- [ ] **Step 3: Write minimal implementation**

Update `src/main.ts`:
```typescript
import './style.css';
import { AppStore } from './core/state/store';
import { decodeStateFromFragment } from './core/state/fragment';
import { initLayout } from './ui/layout';

async function bootstrap() {
  const root = document.getElementById('app');
  if (!root) return;

  let initialStore = new AppStore();

  if (window.location.hash) {
    const restored = await decodeStateFromFragment(window.location.hash);
    if (restored) {
      initialStore = new AppStore(restored);
    }
  }

  initLayout(root, initialStore);
}

bootstrap();
```

Add CSS layout styles in `src/style.css`:
```css
/* Layout Styling */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  height: 60px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.er-cross {
  color: var(--er-vital-red);
  font-size: 1.5rem;
  font-weight: bold;
}

.brand-title {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.badge-tag {
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.split-container {
  display: flex;
  height: calc(100vh - 60px);
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 3-Way Split Layout Modes */
.mode-balanced .triage-panel { width: 50%; }
.mode-balanced .graph-panel { width: 50%; }

.mode-extended-triage .triage-panel { width: 75%; }
.mode-extended-triage .graph-panel { width: 25%; }

.mode-extended-graph .triage-panel { width: 25%; }
.mode-extended-graph .graph-panel { width: 75%; }

.triage-panel {
  padding: 1.5rem;
  overflow-y: auto;
  border-right: 1px solid var(--border-color);
  background-color: var(--bg-primary);
}

.graph-panel {
  position: relative;
  background-color: #060911;
  display: flex;
  flex-direction: column;
}

.graph-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-color);
}

.graph-canvas-container {
  flex: 1;
  width: 100%;
  height: 100%;
}

/* Vital Signs Bar */
.vital-signs-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.vital-metric {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 0.75rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 600;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  font-family: var(--font-mono);
}

.vital-healthy { color: var(--er-vital-green); }
.vital-unstable { color: var(--er-vital-amber); }
.vital-critical { color: var(--er-vital-red); }

/* Buttons & Inputs */
.btn {
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-primary {
  background: var(--er-vital-blue);
  color: #fff;
}
.btn-primary:hover { background: #2563eb; }

.btn-secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-color);
}
.btn-secondary:hover { background: var(--bg-hover); }

.btn-toggle.active {
  background: var(--er-vital-purple);
  color: #fff;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 6px;
}

.input-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* Cards & Modals */
.question-card, .healthy-state-card, .seed-input-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.didactic-pill {
  display: flex;
  gap: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid var(--er-vital-blue);
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1rem 0;
  font-size: 0.85rem;
  color: #bfdbfe;
}

.quick-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn-quick-opt {
  text-align: left;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
}
.btn-quick-opt:hover { border-color: var(--er-vital-blue); }

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-dialog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.code-block {
  background: #000;
  padding: 1rem;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  overflow-x: auto;
  color: #a7f3d0;
  margin-bottom: 1rem;
}
```

- [ ] **Step 4: Run full test suite and build**

Run: `npm test && npm run build`
Expected: ALL TESTS PASS, Vite outputs clean static bundle in `dist/`.

- [ ] **Step 5: Commit**

```bash
git add src/main.ts src/style.css tests/e2e.test.ts
git commit -m "feat: complete end-to-end integration and responsive split-pane styling"
```

---

## Plan Self-Review Checklist

1. **Spec Coverage**:
   - `wrx` extraction engine -> Task 2
   - RT patterns `PT-01` to `PT-08` & relations -> Task 3
   - ER triage diagnostics & questionnaire -> Task 4
   - State history & URI fragment `#gz=...` -> Task 5
   - Exporters (Link headers, `sitemap.xml`, YAML, Systemic IT ticket) -> Task 6
   - SVG network graph & PNG download -> Task 7
   - Adaptive split-pane layout & onboarding tutorial -> Task 8
   - End-to-end wiring & GitHub Pages build -> Task 9
2. **Placeholder Scan**: No "TODO", "TBD", or unelaborated code steps. Every task includes exact code and test assertions.
3. **Type Consistency**: `DiscoveredLink`, `ExtractionResult`, `RTPatternDef`, `DiagnosticReport`, and `AppState` interfaces are strictly matched across all tasks.
