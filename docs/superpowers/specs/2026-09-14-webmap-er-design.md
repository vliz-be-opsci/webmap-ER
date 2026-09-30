# webmap-ER: Radical Transparency Emergency Room & Web Linking Guidance System

**Date:** 2026-09-14  
**Status:** Approved Specification  
**Target Repository:** `vliz-be-opsci/webmap-ER`

---

## 1. Executive Summary & Vision

`webmap-ER` is an interactive, browser-based "Emergency Room" application for **Radical Transparency (RT)** in research data and web ecosystems. It guides users step-by-step through auditing, diagnosing, and repairing web link relationships on their digital assets, catalogs, and functional profiles.

The system operationalizes the specifications defined in:
- **EOSC Interoperability Framework Solutions**: [Radical Transparency Linkset Usage Patterns](https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns)
- **Metadata Extraction Engine**: [cedricdcc/wrx](https://github.com/cedricdcc/wrx) (cascading RDF discovery across HTTP headers, linksets, HTML tags, and content negotiation)
- **Pattern Testing & Conformance Semantics**: [vliz-be-opsci/grmp-test-implementations/rt-test](https://github.com/vliz-be-opsci/grmp-test-implementations/tree/main/rt-test) (patterns `PT-01` to `PT-08`)

`webmap-ER` runs **entirely client-side** as a zero-backend static web application deployable on GitHub Pages. It features an adaptive split-pane workspace, an interactive SVG/Canvas network graph with live RT health indicators, persistent interaction history and state serialized into URI fragment identifiers (`#gz=...`), and automated generation of systemic IT remediation tickets, HTTP `Link` headers, RFC 9264 linksets, XML sitemaps with `<xhtml:link>` signposting, and drop-in `rt-test` YAML test configurations.

---

## 2. Core Functional Requirements

### 2.1 Dual Operation Modes
1. **Resource-First ER Triage (Audit & Remediate)**:
   - User inputs a target seed URI (dataset landing page, API root, or catalog).
   - The embedded `wrx` extraction engine fetches the URI and retrieves all discoverable link relations, content negotiation options, and metadata provenance.
   - The Diagnostic Engine analyzes discovered links against Radical Transparency requirements, computes an **RT Vital Signs Score (0–100%)**, and identifies critical gaps (e.g. missing `rel="profile"`).
   - The Triage Engine presents an interactive, didactic questionnaire prompting the user for the semantic meaning of missing links.
   - Answering questions immediately updates the graph and generates remediation artifacts.
2. **Pattern-Driven Wizard (Author & Configure)**:
   - User chooses a specific RT pattern goal (e.g., `PT-01` Profile Declaration or `PT-04` No Landing Page Solution).
   - Step-by-step form prompts the user to provide URIs for each semantic role (e.g. `resource`, `profile`, `profile_description`, `cite-as`).
   - Generates the complete conforming Link header set and `rt-test` configuration.

### 2.2 Built-in Presets (Zero-Typing Quickstart)
Pre-packaged configurations based on real-world datasets from `rt-test`:
- **ARMS-MBON Marine Genomic Dataset**: Demonstrates `PT-01` Profile Conformity with RO-Crate and Turtle alternate formats.
- **EurOBIS Marine Occurrences**: Demonstrates `PT-04` Metadata description and Darwin Core archive PID citation.
- **North Sea Sensor Buoy Telemetry**: Demonstrates `PT-05` Subsetting API and OpenAPI integration.

### 2.3 Interaction History & Session Memory
- Every user action (URI entry, question answered, manual node added, option selected, step reverted) is recorded as an immutable event in the session log.
- Supports **Undo / Redo** and jumping back to earlier questions to revise answers without losing downstream progress.
- Preserved across page reloads and link sharing via the URI fragment identifier.

### 2.4 State Persistence via URI Fragment Identifier
- State is serialized, compressed via standard browser `CompressionStream` (Deflate-raw), and encoded as URL-safe Base64 into the URL hash:
  `https://vliz-be-opsci.github.io/webmap-ER/#gz=<compressed_state_payload>`
- Reading a shared link instantly restores the full graph, answered questions, view mode, and interaction history with zero server dependencies.
- One-click **"Copy Shareable Permalink"** button in the header.

---

## 3. UI/UX & Adaptive Split-Pane Workspace

### 3.1 3-Way Adaptive Layout
The user can toggle the workspace layout to fit their immediate task:

1. **Balanced View (50% Questionnaire / 50% Graph)**:
   - Default mode for simultaneous triage answering and observing live graph mutations.
2. **Extended Questionnaire View (75% Questionnaire / 25% Mini-Radar Graph)**:
   - Expands the triage panel into prominent step-by-step guidance cards (Option 3 style).
   - Displays expanded "Why This Matters in the RT Ecosystem" didactic callouts, profile pickers, and live IT ticket preview.
   - Right pane contracts to a compact RT Health Radar and graph thumbnail.
3. **Extended Graph View (20% Checklist / 80% Fullscreen Canvas)**:
   - Maximizes the visual network graph for deep inspection, spatial node rearrangement, and image export.
   - Left pane contracts to a compact health badge and checklist of completed steps.
   - Clicking any node or relation in the graph opens a contextual quick-prescription popover.

### 3.2 Interactive SVG/Canvas Graph Visualizer
- **Semantic Node Types**:
  - `Resource`: Primary dataset, landing page, or service endpoint.
  - `Profile`: Functional standard or specification URI (e.g., `dx-prof`, RO-Crate).
  - `Metadata Document`: Machine-readable RDF description (JSON-LD, Turtle, RDF/XML).
  - `Persistent Identifier (PID)`: Canonical citation URI (DOI, Handle, URN).
  - `Catalog / Linkset`: Collection container or RFC 9264 linkset document.
- **Color-Coded Semantic Relations (Edges)**:
  - `Solid Green`: Verified live via extraction.
  - `Dashed Red`: Missing required link relation (RT gap).
  - `Solid Blue`: Remediated / user-prescribed link relation.
- **Graph Controls**: Pan, zoom, center-fit, node drag-and-drop, and **Export to PNG/SVG**.

### 3.3 Built-in Didactic Onboarding Tutorial
A step-by-step interactive modal overlay explaining:
1. The ER metaphor: Treating broken web discovery as "vital sign trauma" requiring triage and prescription.
2. The role of RFC 8288 HTTP Link headers and RFC 9264 Linksets in automated machine harvesting.
3. How to export and submit the generated systemic IT ticket to web infrastructure teams.

---

## 4. Domain Model: Radical Transparency Patterns & Relations

The domain model follows `grmp-test-implementations/rt-test` and RFC standards:

| Pattern ID | Pattern Name | Key Semantic Roles | Required HTTP Link Relations |
| :--- | :--- | :--- | :--- |
| **PT-01** | **Profile Conformity Declaration** | `resource`, `profile`, `profile_description`, `profile_type` | `resource` $\rightarrow$ `Link: <<profile>>; rel="profile"`<br>`profile` $\rightarrow$ `Link: <<profile_description>>; rel="describedby"`, `Link: <<profile_type>>; rel="type"` |
| **PT-02** | **Profile Composition** | `parent_profile`, `part_profile` | `parent_profile` $\rightarrow$ `Link: <<part_profile>>; rel="http://schema.org/hasPart"`<br>`part_profile` $\rightarrow$ `Link: <<parent_profile>>; rel="http://schema.org/isPartOf"` |
| **PT-03** | **Content Negotiation Menu** | `resource`, `alternate` | `resource` $\rightarrow$ `Link: <<alternate>>; rel="alternate"; type="..."; profile="..."` |
| **PT-04** | **No Landing Page / Metadata** | `resource`, `metadata`, `cite_as`, `type` | `resource` $\rightarrow$ `Link: <<metadata>>; rel="describedby"; type="application/ld+json"`<br>`resource` $\rightarrow$ `Link: <<cite_as>>; rel="cite-as"`<br>`resource` $\rightarrow$ `Link: <<type>>; rel="type"` |
| **PT-05** | **Subsetting API** | `resource`, `service_desc`, `service_doc` | `resource` $\rightarrow$ `Link: <<service_desc>>; rel="service-desc"; type="application/vnd.oai.openapi+json"`<br>`resource` $\rightarrow$ `Link: <<service_doc>>; rel="service-doc"; type="text/html"` |
| **PT-06** | **Hostwide Resource Discovery** | `robots.txt`, `sitemap.xml`, `resource` | `robots.txt` $\rightarrow$ `Sitemap: <sitemap.xml>`<br>`sitemap.xml` $\rightarrow$ `<xhtml:link rel="profile|describedby|cite-as" ...>` |
| **PT-07** | **Catalog Assistance** | `catalog`, `item` | `catalog` $\rightarrow$ `Link: <<item>>; rel="item"`<br>`item` $\rightarrow$ `Link: <<catalog>>; rel="collection"` |
| **PT-08** | **External Linksets** | `resource`, `linkset` | `resource` $\rightarrow$ `Link: <<linkset>>; rel="linkset"; type="application/linkset+json"` |

---

## 5. Exporters & Remediation Artifacts

The system provides 5 actionable outputs:

1. **HTTP Link Header Snippets**:
   - Clean RFC 8288 `Link:` header strings.
   - Ready-to-copy configurations for:
     - **Apache**: `Header add Link "<uri>; rel=\"profile\""`
     - **Nginx**: `add_header Link "<uri>; rel=\"profile\"";`
     - **Caddy**: `header Link "<uri>; rel=\"profile\""`
     - **Cloudflare Workers / CDN**: Response header injection snippet.
2. **RFC 9264 Linkset Document**:
   - Valid `application/linkset+json` payload.
3. **`sitemap.xml` with `<xhtml:link>` / `<rs:ln>` Preview**:
   - Conforms to PT-06 Hostwide Discovery and ResourceSync specifications:
     ```xml
     <?xml version="1.0" encoding="UTF-8"?>
     <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
             xmlns:xhtml="http://www.w3.org/1999/xhtml">
       <url>
         <loc>https://example.org/dataset/sample-01</loc>
         <xhtml:link rel="profile" href="https://w3id.org/ro/crate/1.1"/>
         <xhtml:link rel="describedby" href="https://example.org/dataset/sample-01.jsonld" type="application/ld+json"/>
         <xhtml:link rel="cite-as" href="https://doi.org/10.1234/sample-01"/>
       </url>
     </urlset>
     ```
4. **`rt-test` YAML Test Suite**:
   - Exact syntax compatible with `grmp-test-implementations/rt-test`:
     ```yaml
     version: "1.0"
     name: "Generated Radical Transparency Test Suite"
     patterns:
       - name: "Dataset Profile Conformance (PT-01)"
         type: "PT-01"
         uris:
           resource: "https://example.org/dataset/sample-01"
           profile: "https://w3id.org/ro/crate/1.1"
           profile_description: "https://w3id.org/ro/crate/1.1.html"
     ```
5. **Systemic IT Ticket Markdown**:
   - Formulated as a **systemic webserver/reverse-proxy policy** rather than a narrow one-off bug report:
     ```markdown
     ## [Architecture / Interoperability] Implement Server-Wide RFC 8288 Link Headers & RT Sitemaps

     ### Background & Problem Statement
     Automated research harvesters (EOSC, OpenAIRE, aggregators) require transparent discovery
     of profiles, metadata schemas, and PIDs via RFC 8288 HTTP Link headers and XML sitemaps.
     Current responses for our digital asset endpoints lack these machine-readable headers.

     ### Pilot Resource Tested
     - Endpoint: `https://example.org/dataset/sample-01`
     - Health Score: 45 / 100 (Missing Profile Conformance & PID relations)

     ### Proposed Systemic Remediation
     1. Configure the reverse proxy (Nginx/Apache/Cloudflare) or CMS response middleware to
        automatically inject the required RFC 8288 `Link` headers across all published dataset URIs.
     2. Update the automated `sitemap.xml` generator to include `<xhtml:link>` relations.

     ### Exemplar Headers to Deploy
     ```http
     Link: <https://w3id.org/ro/crate/1.1>; rel="profile",
           <https://example.org/dataset/sample-01.jsonld>; rel="describedby"; type="application/ld+json",
           <https://doi.org/10.1234/sample-01>; rel="cite-as"
     ```

     ### Automated Verification
     Run the attached `rt-test.yaml` test suite using the GRMP containerized test runner.
     ```

---

## 6. Technical Stack & Module Architecture

### 6.1 Technology Choices
- **Bundler & Build Tool**: Vite (modern, fast, produces optimal zero-runtime static bundle for GitHub Pages).
- **Language**: TypeScript (strict mode, ensuring exact alignment with `wrx` and `rt-test` types).
- **Styling**: Vanilla CSS (CSS variables, responsive flex/grid, dark-mode first ER-themed visual identity with high-contrast health indicators).
- **Graph Engine**: Native SVG/Canvas (clean, interactive, zero heavy external framework dependencies).
- **State Compression**: Browser standard `CompressionStream('deflate-raw')` with URL-safe Base64 encoding.

### 6.2 Directory Structure
```text
webmap-ER/
├── index.html                 # Main entry HTML
├── package.json               # Dependencies and scripts (vite, typescript)
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite build configuration (base path for GitHub Pages)
├── src/
│   ├── main.ts                # Application bootstrapper and routing
│   ├── style.css              # Global tokens, typography, and theme styling
│   ├── core/
│   │   ├── wrx/               # Browser extraction engine (adapted from cedricdcc/wrx)
│   │   │   ├── extractor.ts   # Cascading fetch & parse orchestrator
│   │   │   ├── header-parser.ts # RFC 8288 parser
│   │   │   ├── linkset.ts     # RFC 9264 parser
│   │   │   └── types.ts       # Extraction result interfaces
│   │   ├── rt/                # Radical Transparency pattern registry
│   │   │   ├── patterns.ts    # PT-01 to PT-08 schemas and role mappings
│   │   │   └── relations.ts   # Catalog of IANA / RFC link relations
│   │   ├── triage/            # ER diagnostic & guidance engine
│   │   │   ├── diagnostics.ts # Gap analysis and health score calculator
│   │   │   ├── questions.ts   # Interactive questionnaire generator
│   │   │   └── presets.ts     # Sample datasets (ARMS-MBON, EurOBIS, etc.)
│   │   ├── export/            # Export serializers
│   │   │   ├── link-headers.ts# HTTP headers (Apache/Nginx/Caddy)
│   │   │   ├── sitemap.ts     # XML sitemap with xhtml:link generator
│   │   │   ├── linkset.ts     # RFC 9264 JSON generator
│   │   │   ├── yaml-test.ts   # rt-test YAML generator
│   │   │   └── it-ticket.ts   # Systemic IT ticket Markdown generator
│   │   └── state/             # State machine & URI fragment persistence
│   │       ├── store.ts       # Event-sourced state store with history log
│   │       └── fragment.ts    # URL hash compression/decompression
│   └── ui/
│       ├── layout.ts          # Split-pane manager (Balanced / Ext-Triage / Ext-Graph)
│       ├── components/
│       │   ├── header.ts      # Top bar (mode toggle, permalink share, preset picker)
│       │   ├── triage-panel.ts# Left pane (question cards, health bar, IT preview)
│       │   ├── graph-panel.ts # Right pane (SVG interactive graph, controls, inspector)
│       │   └── tutorial-modal.ts # Didactic interactive onboarding guide
│       └── graph/
│           ├── renderer.ts    # SVG node-edge renderer and force layout
│           └── exporter.ts    # PNG / SVG snapshot downloader
└── tests/                     # Automated unit and integration tests
```

---

## 7. Error Handling & Edge Cases

1. **CORS Missing Headers**:
   - If a fetch fails due to browser cross-origin policy, the system displays a didactic diagnostic card explaining that machines and web portals cannot inspect Link headers without `Access-Control-Allow-Origin: *` and `Access-Control-Expose-Headers: Link`. The user can continue in manual wizard mode.
2. **Malformed or Unreachable URIs**:
   - Inline URL validation with automated protocol correction (`https://` prepend).
3. **Corrupted or Incompatible URL Fragments**:
   - Safe parsing with fallback to a clean state and user toast notification. Versioned state schema (`version: 1`).

---

## 8. Verification & Delivery Plan

### 8.1 Automated Unit Tests
- `wrx` Link header and Linkset parsing.
- RT Pattern diagnostic evaluation (verifying exact health scores and trauma flags for test configurations).
- State compression round-trip integrity (`state === decompress(compress(state))`).
- Export generation formatting (valid XML sitemaps, valid YAML, valid Apache/Nginx syntax).

### 8.2 End-to-End Verification
- Vite build verification (`npm run build` generates production `dist/`).
- Browser subagent validation:
  - Loading presets and verifying live extraction.
  - Answering triage questions and confirming instant graph updates.
  - Toggling between Balanced, Extended Questionnaire, and Extended Graph views.
  - Testing Undo/Redo in interaction history.
  - Testing permalink creation and reload from URI fragment.
  - Testing export buttons (copy IT ticket, copy headers, download PNG/SVG).
