# Radical Transparency Multi-Pattern Engine, Smart Linked-Data Detection & Guided Triage Specification

**Date:** 2026-09-14  
**Status:** Approved Design Specification  
**Target Repository:** `vliz-be-opsci/webmap-ER`  

---

## 1. Executive Summary & Vision

`webmap-ER` provides an interactive Emergency Room (ER) diagnostic and triage system for web link relations on digital research assets. While initial prototypes focused on `PT-01` (Profile Conformity), full adherence to EOSC Interoperability Framework solutions requires supporting the entire suite of **Radical Transparency (RT) patterns (PT-01 through PT-08)**.

This specification expands `webmap-ER` across four critical dimensions:
1. **Full 8-Pattern RT Conformance Engine:** Simultaneous gap evaluation, pattern conformity tracking (`PT-01` to `PT-08`), and an interactive Pattern Matrix Strip that exposes users to all 8 patterns.
2. **Smart Linked-Data & Profile Auto-Detection:** Automated heuristic parsing of embedded JSON-LD scripts, `@context`, `conformsTo`, `@type`, and API signatures (`OpenAPI`, `service-desc`), surfacing 1-click adoption chips directly in triage.
3. **Apparent & Actionable Sitemap Guidance (PT-06):** A first-class triage step detailing `robots.txt` $\to$ `sitemap.xml` crawler harvesting with an inline, dynamically generated `<xhtml:link>` signposting preview card.
4. **Multi-Pattern GRMPy Exporters & Rich Issue Tickets:** Full `rt-test.yaml` generation supporting all 8 patterns, plus an enriched systemic IT ticket with a GRMPy-style ASCII network topology and direct links to EOSC RT pattern literature.
5. **Interactive 5-Step Guided Tour Modal:** A didactic product tour explaining key application capabilities with a 1-click sample preset jumpstart button.

---

## 2. Smart Linked-Data & Profile Extractor (`src/core/wrx/smart-detector.ts`)

### 2.1 Inspection Pipeline
When `wrx` crawls a target seed URI, `detectSmartMetadata(result: ExtractionResult)` inspects:
- Embedded `<script type="application/ld+json">` text.
- Direct JSON-LD / RDF responses fetched via HTTP content negotiation.
- HTTP `Link` response headers and HTML `<link>` elements.

### 2.2 Extraction Heuristics
1. **Profile Inference:**
   - Traverses root JSON-LD objects and `@graph` arrays.
   - Extracts profile URIs declared under `conformsTo`, `dct:conformsTo`, `dcterms:conformsTo`, or `schema:conformsTo`.
   - Inspects `@context` strings and objects for known profile signatures (e.g. `https://w3id.org/ro/crate/1.1/context` $\to$ infers `https://w3id.org/ro/crate/1.1`).
   - Maps `@type: "Dataset"` or `@type: "BioChemEntity"` to recommended disciplinary standards (RO-Crate 1.1, DCAT-AP, Darwin Core).
2. **API & Subsetting Detection (PT-05):**
   - Detects `@type: "DataService"` in JSON-LD.
   - Scans URL and headers for `service-desc`, `openapi.json`, `swagger.json`, or `/api`.
   - Flags `recommendedPatternFocus = 'PT-05'` and extracts `serviceDesc` URI.
3. **Persistent Identifier (PID) Extraction (PT-04):**
   - Scans `identifier`, `@id`, and `sameAs` for canonical DOI regex (`10.\d{4,9}/[-._;()/:A-Za-z0-9]+`), Handle URLs, or URNs.

### 2.3 Data Contract
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
  didacticHint?: string;
}
```

---

## 3. Comprehensive 8-Pattern RT Conformance Engine

### 3.1 Pattern Matrix & Requirements

| Pattern ID | Pattern Name | Target Roles | Required Relations | Recommended Relations |
| :--- | :--- | :--- | :--- | :--- |
| **PT-01** | Profile Conformity | `resource`, `profile`, `profile_description` | `rel="profile"` | `rel="describedby"`, `rel="type"` |
| **PT-02** | Profile Composition | `parent_profile`, `part_profile` | `rel="http://schema.org/hasPart"` | `rel="http://schema.org/isPartOf"` |
| **PT-03** | Content Negotiation Menu | `resource`, `alternate` | `rel="alternate"` | `profile="..."`, `type="..."` |
| **PT-04** | Direct Metadata & PID | `resource`, `metadata`, `cite_as` | `rel="describedby"`, `rel="cite-as"` | `rel="type"` |
| **PT-05** | Subsetting API | `resource`, `service_desc`, `service_doc` | `rel="service-desc"` | `rel="service-doc"` |
| **PT-06** | Hostwide Discovery | `robots.txt`, `sitemap.xml`, `resource` | `item` or sitemap signposting | `<xhtml:link>` relations |
| **PT-07** | Catalog Assistance | `catalog`, `item` | `rel="item"` or `rel="collection"` | Bidirectional pair |
| **PT-08** | External Linksets | `resource`, `linkset` | `rel="linkset"` (RFC 9264) | `type="application/linkset+json"` |

### 3.2 Evaluation Data Structure (`src/core/triage/diagnostics.ts`)
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
  score: number; // 0 - 100 Baseline Vital Signs Score
  vitalStatus: 'CRITICAL' | 'UNSTABLE' | 'HEALTHY';
  presentRelations: string[];
  patterns: PatternConformity[];
  gaps: RTGap[];
  smartInference?: SmartInferenceResult;
}
```

---

## 4. Triage Guidance UI & Pattern Matrix

### 4.1 Pattern Matrix Strip (`src/ui/components/triage-panel.ts`)
- Rendered below the Telemetry HUD.
- Features 8 interactive badges (`PT-01` through `PT-08`) with status dots (green = satisfied, amber = gap, gray = optional).
- Clicking any badge sets an active pattern filter (e.g. focusing specifically on `PT-05 Subsetting API`).
- Includes a `"View All (N Gaps)"` badge to show comprehensive guidance.

### 4.2 Automated Smart Suggestions Strip
- Rendered above the active question whenever `smartInference` discovers metadata.
- Shows 1-click adoption chips:
  - `[+ Adopt Detected Profile: RO-Crate 1.1]`
  - `[+ Adopt Detected PID: https://doi.org/10.1234/...]`
  - `[+ Route Guidance to PT-05 Subsetting API]`
- Clicking a chip immediately updates the store, recalculates the health score, registers the relation on the graph canvas, and triggers a success toast.

### 4.3 Actionable PT-06 Hostwide Discovery & Live Sitemap Card
- Dedicated question for PT-06 explaining the EOSC requirement for `robots.txt` $\to$ `sitemap.xml` with `<xhtml:link>` signposting.
- Inline live-rendered XML preview card displaying the resource entry:
  ```xml
  <url>
    <loc>https://example.org/dataset/01</loc>
    <xhtml:link rel="profile" href="https://w3id.org/ro/crate/1.1"/>
    <xhtml:link rel="describedby" href="https://example.org/dataset/01.jsonld" type="application/ld+json"/>
    <xhtml:link rel="cite-as" href="https://doi.org/10.1234/dataset-01"/>
  </url>
  ```
- Includes a 1-click **"Copy Sitemap XML Snippet"** button with toast confirmation.

---

## 5. Exporters Expansion: Multi-Pattern GRMPy Tests & Rich Issue Tickets

### 5.1 Multi-Pattern GRMPy / `rt-test` YAML Generator (`src/core/export/yaml-test.ts`)
Generates conforming test entries for all configured patterns (`PT-01` to `PT-08`):
```yaml
version: "1.0"
name: "Radical Transparency Multi-Pattern Test Suite"
patterns:
  - name: "Dataset Profile Conformance (PT-01)"
    type: "PT-01"
    uris:
      resource: "https://example.org/dataset/01"
      profile: "https://w3id.org/ro/crate/1.1"
      profile_description: "https://w3id.org/ro/crate/1.1.html"
  - name: "Direct Metadata & Persistent Citation (PT-04)"
    type: "PT-04"
    uris:
      resource: "https://example.org/dataset/01"
      metadata: "https://example.org/dataset/01.jsonld"
      cite_as: "https://doi.org/10.1234/dataset-01"
  - name: "Subsetting API Integration (PT-05)"
    type: "PT-05"
    uris:
      resource: "https://example.org/dataset/01"
      service_desc: "https://example.org/api/openapi.json"
```

### 5.2 Systemic Issue Markdown with ASCII Topology & Literature References (`src/core/export/it-ticket.ts`)
1. **ASCII Network Topology Diagram:**
   ```text
   +-----------------------------------------------------------+
   |  Target Resource: https://example.org/dataset/01          |
   +-----------------------------------------------------------+
         |
         +--[rel="profile"]------------> [Profile: RO-Crate 1.1]
         |
         +--[rel="describedby"]--------> [Metadata: JSON-LD]
         |
         +--[rel="cite-as"]------------> [PID: DOI 10.1234/...]
         |
         +--[rel="service-desc"]-------> [API: OpenAPI Spec]
         |
         +--[rel="linkset"]------------> [RFC 9264 Linkset]
   ```
2. **Authoritative Standard & Literature References:**
   - [EOSC IF Radical Transparency Linkset Usage Patterns](https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns)
   - [GRMP Test Implementations (rt-test & GRMPy)](https://github.com/vliz-be-opsci/grmp-test-implementations/tree/main/rt-test)
   - [RFC 8288: Web Linking Standards](https://www.rfc-editor.org/rfc/rfc8288.html)
   - [RFC 9264: Linkset Media Types](https://www.rfc-editor.org/rfc/rfc9264.html)
   - [W3C DXWG Profiles Vocabulary](https://www.w3.org/TR/dx-prof/)
3. **Reproducible Test Runner Command:**
   Instructions for running `rt-test` containerized via Docker/Podman in CI/CD pipelines.

---

## 6. Interactive 5-Step Guided Tour Modal (`src/ui/components/tutorial-modal.ts`)

Triggered by `#btn-tutorial`:
1. **Step 1: Patient Triage & Extraction:** Seed URI entry, preset loading, and HTTP header crawling.
2. **Step 2: Diagnostic Telemetry HUD & Pattern Matrix:** RT Vital Signs Score and monitoring patterns PT-01 to PT-08.
3. **Step 3: Smart Auto-Detection & Prescriptions:** Linked data heuristic extraction and 1-click adoption.
4. **Step 4: Interactive Graph Visualizer:** Inspecting directional link relation network topology.
5. **Step 5: Systemic IT Remediation & Sitemaps:** Exporting reverse-proxy headers, XML sitemaps, and GRMPy test suites.
- **Interactive Jumpstart Button:** `"Launch Sample Preset"` loads `ARMS-MBON` immediately and dismisses the tutorial.

---

## 7. Verification Plan

1. **Unit Tests (Vitest):**
   - `tests/smart-detector.test.ts`: Test extraction of profiles from JSON-LD `@context`, `conformsTo`, and API signatures.
   - `tests/multi-pattern.test.ts`: Verify gap evaluation and conformity reporting across all 8 patterns.
   - `tests/yaml-test.test.ts`: Verify multi-pattern YAML test suite generation for PT-01, PT-04, PT-05, PT-08.
   - `tests/it-ticket.test.ts`: Verify generated ASCII topology diagram and literature links.
   - `tests/tutorial-modal.test.ts`: Verify 5-step carousel progression and jumpstart button.
2. **Static Checking:** `npx tsc --noEmit`.
3. **Production Build:** `npm run build`.
4. **Browser Subagent Smoke Test:**
   - Test preset loading, smart detection chips, pattern filtering, sitemap preview copy, and tutorial modal.
