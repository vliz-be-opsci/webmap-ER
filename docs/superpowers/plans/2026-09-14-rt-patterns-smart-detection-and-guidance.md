# RT Multi-Pattern Engine, Smart Linked-Data Detection & Guided Triage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand webmap-ER to support the full suite of Radical Transparency patterns (PT-01 through PT-08), smart auto-detection and profile extraction from embedded JSON-LD and APIs, proactive missing linked-data and variant probing (PT-03), prominent PT-06 sitemap signposting with live XML preview, multi-pattern GRMPy test suite generation, enriched issue Markdown with ASCII network topology and RT literature links, and an interactive 5-step guided tour modal with preset jumpstart.

**Architecture:** A smart heuristic detector (`smart-detector.ts`) inspects JSON-LD scripts and RDF payloads for profiles, PIDs, and APIs. The diagnostic engine evaluates all 8 patterns with individual conformity statuses. Triage guidance gains a Pattern Matrix Strip for filtering and a Smart Suggestions Strip for 1-click adoption. Exporters are upgraded to emit multi-pattern GRMPy YAML and ASCII issue markdown. The tutorial modal is upgraded to an interactive 5-step product tour.

**Tech Stack:** Vanilla TypeScript, Vite, CSS Custom Properties (dual-theme tokens), Native SVG, Happy-DOM, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-14-rt-patterns-smart-detection-and-guidance.md`](file:///c:/Users/cedricd/Documents/Github/webmap-ER/docs/superpowers/specs/2026-09-14-rt-patterns-smart-detection-and-guidance.md)

## Global Constraints
- Absolute zero emoji in any UI, copy, comments, or commit messages.
- Zero external runtime library dependencies (use pure TypeScript and standard browser APIs).
- Maintain 100% WCAG 2.2 AA contrast compliance across Light and Dark modes.
- Preserve all existing state serialization, compression (`#gz=...`), and UI layout features.

---

### Task 1: Smart Linked-Data & Profile Extractor

**Files:**
- Create: `src/core/wrx/smart-detector.ts`
- Test: `tests/smart-detector.test.ts`

**Interfaces:**
- Consumes: `ExtractionResult` from `src/core/wrx/types.ts`
- Produces:
  ```typescript
  export interface DetectedItem {
    uri: string;
    label: string;
    source: string;
    confidence: 'high' | 'medium';
  }

  export interface SmartInferenceResult {
    detectedProfiles: DetectedItem[];
    detectedPids: DetectedItem[];
    detectedApis: Array<{ serviceDesc?: string; serviceDoc?: string; source: string }>;
    recommendedPatternFocus: 'PT-01' | 'PT-05' | 'PT-06' | 'PT-07' | 'ALL';
    hasLinkedData: boolean;
    didacticHint?: string;
  }

  export function detectSmartMetadata(result: ExtractionResult): SmartInferenceResult;
  ```

- [ ] **Step 1: Write the failing smart detector test**

```typescript
// tests/smart-detector.test.ts
import { describe, it, expect } from 'vitest';
import { detectSmartMetadata } from '../src/core/wrx/smart-detector';
import { ExtractionResult } from '../src/core/wrx/types';

describe('Smart Linked Data & Profile Extractor', () => {
  it('should extract profile and PID from embedded JSON-LD conformsTo and identifier', () => {
    const mockExtraction: ExtractionResult = {
      url: 'https://example.org/dataset/01',
      status: 200,
      contentType: 'text/html',
      links: [],
      rdfBodies: [
        {
          format: 'application/ld+json',
          source: 'embedded-script',
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            'conformsTo': 'https://w3id.org/ro/crate/1.1',
            'identifier': 'https://doi.org/10.1234/sample-01'
          })
        }
      ],
      trace: [],
      corsBlocked: false
    };

    const inference = detectSmartMetadata(mockExtraction);
    expect(inference.hasLinkedData).toBe(true);
    expect(inference.detectedProfiles.some(p => p.uri === 'https://w3id.org/ro/crate/1.1')).toBe(true);
    expect(inference.detectedPids.some(p => p.uri === 'https://doi.org/10.1234/sample-01')).toBe(true);
  });

  it('should detect API signatures and recommend PT-05 Subsetting API', () => {
    const mockExtraction: ExtractionResult = {
      url: 'https://example.org/api/v1',
      status: 200,
      contentType: 'application/json',
      links: [
        { target: 'https://example.org/api/openapi.json', rel: 'service-desc', source: 'link-header' }
      ],
      rdfBodies: [],
      trace: [],
      corsBlocked: false
    };

    const inference = detectSmartMetadata(mockExtraction);
    expect(inference.recommendedPatternFocus).toBe('PT-05');
    expect(inference.detectedApis.length).toBeGreaterThan(0);
  });

  it('should flag hasLinkedData as false when no RDF headers or bodies exist', () => {
    const mockExtraction: ExtractionResult = {
      url: 'https://example.org/plain-html',
      status: 200,
      contentType: 'text/html',
      links: [],
      rdfBodies: [],
      trace: [],
      corsBlocked: false
    };

    const inference = detectSmartMetadata(mockExtraction);
    expect(inference.hasLinkedData).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/smart-detector.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/core/wrx/smart-detector.ts`**

Implement `detectSmartMetadata` with JSON-LD parsing, `@graph` traversal, `@context` inspection, PID regex detection, and API link relation detection.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/smart-detector.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/wrx/smart-detector.ts tests/smart-detector.test.ts
git commit -m "feat(wrx): add smart linked-data and profile detection"
```

---

### Task 2: Comprehensive 8-Pattern RT Conformance Engine

**Files:**
- Modify: `src/core/rt/patterns.ts:1-89`
- Modify: `src/core/triage/diagnostics.ts:1-98`
- Test: `tests/multi-pattern.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface PatternConformity {
    patternId: string;
    name: string;
    status: 'SATISFIED' | 'PARTIAL' | 'UNSATISFIED';
    presentRelations: string[];
    missingRequired: string[];
    missingRecommended: string[];
  }

  export interface DiagnosticReport {
    targetUrl: string;
    score: number;
    vitalStatus: 'CRITICAL' | 'UNSTABLE' | 'HEALTHY';
    presentRelations: string[];
    patterns: PatternConformity[];
    gaps: RTGap[];
    satisfiedPatterns: string[];
    smartInference?: SmartInferenceResult;
  }
  ```

- [ ] **Step 1: Write the failing multi-pattern diagnostic test**

```typescript
// tests/multi-pattern.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { DiscoveredLink } from '../src/core/wrx/types';

describe('Comprehensive 8-Pattern RT Diagnostic Engine', () => {
  it('should evaluate all 8 patterns and report conformity status for each', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' },
      { target: 'https://example.org/metadata.jsonld', rel: 'describedby', source: 'link-header' },
      { target: 'https://doi.org/10.1234/res', rel: 'cite-as', source: 'link-header' }
    ];

    const report = evaluateHealthAndGaps('https://example.org/dataset', links);
    expect(report.patterns.length).toBe(8);

    const pt01 = report.patterns.find(p => p.patternId === 'PT-01');
    expect(pt01?.status).toBe('SATISFIED');

    const pt05 = report.patterns.find(p => p.patternId === 'PT-05');
    expect(pt05?.status).toBe('UNSATISFIED');
    expect(pt05?.missingRequired).toContain('service-desc');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/multi-pattern.test.ts`  
Expected: FAIL with `report.patterns` undefined.

- [ ] **Step 3: Update `src/core/rt/patterns.ts` and `src/core/triage/diagnostics.ts`**

Expand `evaluateHealthAndGaps` to audit against all 8 RT patterns, compute `PatternConformity[]`, generate gaps with literature-informed didactic guidance, and accept optional `SmartInferenceResult`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/multi-pattern.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/rt/patterns.ts src/core/triage/diagnostics.ts tests/multi-pattern.test.ts
git commit -m "feat(rt): implement 8-pattern diagnostic conformity engine"
```

---

### Task 3: Multi-Pattern Questionnaire & Proactive Probing Engine

**Files:**
- Modify: `src/core/triage/questions.ts:1-106`
- Test: `tests/questions.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export function generateTriageQuestions(
    report: DiagnosticReport,
    activePatternFilter?: string
  ): TriageQuestion[];
  ```

- [ ] **Step 1: Write the failing questions test**

```typescript
// tests/questions.test.ts
import { describe, it, expect } from 'vitest';
import { generateTriageQuestions } from '../src/core/triage/questions';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { SmartInferenceResult } from '../src/core/wrx/smart-detector';

describe('Multi-Pattern Questionnaire Generator', () => {
  it('should generate questions for all unresolved gaps and support filtering by pattern', () => {
    const report = evaluateHealthAndGaps('https://example.org/dataset', []);
    const allQuestions = generateTriageQuestions(report);
    expect(allQuestions.length).toBeGreaterThanOrEqual(4);

    const apiQuestions = generateTriageQuestions(report, 'PT-05');
    expect(apiQuestions.length).toBeGreaterThan(0);
    expect(apiQuestions.every(q => q.patternId === 'PT-05')).toBe(true);
  });

  it('should inject auto-detected profiles into quick options when smart inference is provided', () => {
    const smartInference: SmartInferenceResult = {
      detectedProfiles: [
        { uri: 'https://w3id.org/ro/crate/1.1', label: 'RO-Crate 1.1', source: 'jsonld', confidence: 'high' }
      ],
      detectedPids: [],
      detectedApis: [],
      recommendedPatternFocus: 'PT-01',
      hasLinkedData: true
    };

    const report = evaluateHealthAndGaps('https://example.org/dataset', []);
    report.smartInference = smartInference;

    const questions = generateTriageQuestions(report, 'PT-01');
    const profileQ = questions.find(q => q.rel === 'profile');
    expect(profileQ?.quickOptions.some(opt => opt.description?.includes('Auto-detected'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/questions.test.ts`  
Expected: FAIL with missing pattern filtering.

- [ ] **Step 3: Update `src/core/triage/questions.ts`**

Implement questions across all 8 patterns (PT-01 to PT-08), smart option injection, proactive missing linked-data inquiry, and pattern-based filtering.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/questions.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/triage/questions.ts tests/questions.test.ts
git commit -m "feat(triage): expand questionnaire for 8 patterns with smart suggestions"
```

---

### Task 4: Multi-Pattern GRMPy / `rt-test` YAML Generator

**Files:**
- Modify: `src/core/export/yaml-test.ts:1-18`
- Test: `tests/yaml-test.test.ts`

**Interfaces:**
- Produces: `generateRtTestYaml(resourceUri: string, links: DiscoveredLink[]): string`

- [ ] **Step 1: Write the failing YAML test**

```typescript
// tests/yaml-test.test.ts
import { describe, it, expect } from 'vitest';
import { generateRtTestYaml } from '../src/core/export/yaml-test';
import { DiscoveredLink } from '../src/core/wrx/types';

describe('Multi-Pattern GRMPy rt-test YAML Exporter', () => {
  it('should emit pattern test entries for PT-01, PT-04, PT-05, and PT-08', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' },
      { target: 'https://example.org/data.jsonld', rel: 'describedby', source: 'link-header' },
      { target: 'https://doi.org/10.1234/res', rel: 'cite-as', source: 'link-header' },
      { target: 'https://example.org/api/openapi.json', rel: 'service-desc', source: 'link-header' },
      { target: 'https://example.org/.well-known/linkset', rel: 'linkset', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/dataset/01', links);
    expect(yaml).toContain('type: "PT-01"');
    expect(yaml).toContain('type: "PT-04"');
    expect(yaml).toContain('type: "PT-05"');
    expect(yaml).toContain('type: "PT-08"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/yaml-test.test.ts`  
Expected: FAIL with `type: "PT-05"` missing.

- [ ] **Step 3: Update `src/core/export/yaml-test.ts`**

Emit test blocks for all configured link relations adhering to `grmp-test-implementations/rt-test` schema.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/yaml-test.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/export/yaml-test.ts tests/yaml-test.test.ts
git commit -m "feat(export): output multi-pattern GRMPy test suite YAML"
```

---

### Task 5: Systemic IT Ticket with ASCII Network Topology & RT Literature Links

**Files:**
- Modify: `src/core/export/it-ticket.ts:1-48`
- Test: `tests/it-ticket.test.ts`

**Interfaces:**
- Produces: `generateSystemicItTicket(report: DiagnosticReport, links: DiscoveredLink[]): string`

- [ ] **Step 1: Write the failing ticket test**

```typescript
// tests/it-ticket.test.ts
import { describe, it, expect } from 'vitest';
import { generateSystemicItTicket } from '../src/core/export/it-ticket';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { DiscoveredLink } from '../src/core/wrx/types';

describe('Systemic IT Ticket with ASCII Topology & Literature Links', () => {
  it('should include ASCII network topology and standard RT literature citations', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' },
      { target: 'https://example.org/metadata.jsonld', rel: 'describedby', source: 'link-header' }
    ];
    const report = evaluateHealthAndGaps('https://example.org/res', links);
    const ticket = generateSystemicItTicket(report, links);

    // Check ASCII topology
    expect(ticket).toContain('+--[rel="profile"]');
    expect(ticket).toContain('+--[rel="describedby"]');

    // Check Literature references
    expect(ticket).toContain('EOSC Interoperability Framework');
    expect(ticket).toContain('RFC 8288');
    expect(ticket).toContain('RFC 9264');
    expect(ticket).toContain('ghcr.io/vliz-be-opsci/rt-test');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/it-ticket.test.ts`  
Expected: FAIL with missing ASCII topology and literature citations.

- [ ] **Step 3: Update `src/core/export/it-ticket.ts`**

Generate ASCII box-and-wire topology, pattern breakdown, EOSC IF literature links, and reproducible containerized test run command.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/it-ticket.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/export/it-ticket.ts tests/it-ticket.test.ts
git commit -m "feat(export): enrich IT ticket with ASCII network topology and RT literature links"
```

---

### Task 6: Triage Panel UI: Pattern Matrix Strip, Smart Suggestions & PT-06 Sitemap Card

**Files:**
- Modify: `src/ui/components/triage-panel.ts:1-215`
- Test: `tests/triage-panel-patterns.test.ts`

**Interfaces:**
- Consumes: `diagnostics.ts`, `questions.ts`, `smart-detector.ts`, `toast.ts`, `icons.ts`
- Produces: Updated `createTriagePanel(store): HTMLElement`

- [ ] **Step 1: Write the failing triage panel pattern test**

```typescript
// tests/triage-panel-patterns.test.ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createTriagePanel } from '../src/ui/components/triage-panel';

describe('Triage Panel Pattern Matrix & Smart Guidance', () => {
  it('should render the Pattern Matrix Strip with badges for PT-01 to PT-08', () => {
    const store = new AppStore();
    const panel = createTriagePanel(store);

    const matrix = panel.querySelector('.pattern-matrix-strip');
    expect(matrix).not.toBeNull();
    expect(matrix?.querySelectorAll('.pattern-badge').length).toBe(8);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/triage-panel-patterns.test.ts`  
Expected: FAIL with `.pattern-matrix-strip` not found.

- [ ] **Step 3: Update `src/ui/components/triage-panel.ts`**

- Add **Pattern Matrix Strip** below Telemetry HUD with status dots and click-to-filter.
- Add **Smart Suggestions Strip** above question when auto-detected items exist with 1-click adoption.
- Add **PT-06 Live Sitemap Preview Card** displaying dynamic `<xhtml:link>` `<urlset>` XML and copy button.
- Integrate secondary linked-data crawling on user-provided metadata URIs.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/triage-panel-patterns.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/triage-panel.ts tests/triage-panel-patterns.test.ts
git commit -m "feat(ui): add pattern matrix strip, smart suggestions, and sitemap preview"
```

---

### Task 7: Interactive 5-Step Guided Tour Modal with Preset Jumpstart

**Files:**
- Modify: `src/ui/components/tutorial-modal.ts:1-85`
- Test: `tests/tutorial-modal-tour.test.ts`

**Interfaces:**
- Consumes: `icons.ts`, `toast.ts`, `presets.ts`
- Produces: `createTutorialModal(onClose, onLaunchPreset?): HTMLElement`

- [ ] **Step 1: Write the failing tutorial tour test**

```typescript
// tests/tutorial-modal-tour.test.ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { createTutorialModal } from '../src/ui/components/tutorial-modal';

describe('Interactive 5-Step Guided Tour Modal', () => {
  it('should render step dots and jumpstart preset launch button', () => {
    let presetLaunched = false;
    const modal = createTutorialModal(() => {}, () => { presetLaunched = true; });

    expect(modal.querySelectorAll('.tour-step-dot').length).toBe(5);
    const jumpstartBtn = modal.querySelector('#btn-launch-preset') as HTMLButtonElement;
    expect(jumpstartBtn).not.toBeNull();
    jumpstartBtn.click();
    expect(presetLaunched).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tutorial-modal-tour.test.ts`  
Expected: FAIL with `.tour-step-dot` not found.

- [ ] **Step 3: Update `src/ui/components/tutorial-modal.ts` and `src/ui/layout.ts`**

Implement 5-step carousel with step indicators, visual summaries, Next/Previous controls, and the "Launch Sample Preset" jumpstart button.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/tutorial-modal-tour.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/tutorial-modal.ts src/ui/layout.ts tests/tutorial-modal-tour.test.ts
git commit -m "feat(ui): implement interactive 5-step guided tour modal with preset jumpstart"
```

---

### Task 8: End-to-End Build, Test Verification & Visual Smoke Test

**Files:**
- Test: Full Vitest suite
- Target: TypeScript compiler and Vite production build

- [ ] **Step 1: TypeScript type checking**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 2: Run all unit and integration tests**

Run: `npx vitest run`  
Expected: All tests pass.

- [ ] **Step 3: Run production build**

Run: `npm run build`  
Expected: Build succeeds.

- [ ] **Step 4: Browser verification**

Verify in browser:
- Pattern Matrix Strip renders 8 patterns and filters questions on click.
- Smart suggestions strip renders when seed has embedded JSON-LD.
- PT-06 sitemap card renders with live XML snippet and copy action.
- Tutorial button opens 5-step tour with jumpstart preset button.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: complete RT multi-pattern and smart detection verification"
```
