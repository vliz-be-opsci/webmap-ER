# Design Specification: GRMP Test Runner Conformance & Pattern PT-09 Integration

**Date:** 2026-09-29  
**Status:** Approved  
**Topic:** Align `rt-test.yaml` generation with containerized GRMP runner (`ghcr.io/vliz-be-opsci/rt-test:latest`) and integrate Radical Transparency Pattern PT-09 (Versioned Release Lifecycle).

---

## 1. Problem Statement & Motivation
WebMap-ER generates an `rt-test.yaml` configuration intended to be fed directly into the containerized GRMP test runner:
```bash
docker run --rm -v $(pwd)/rt-test.yaml:/app/test_config.yaml ghcr.io/vliz-be-opsci/rt-test:latest
```
An empirical audit against live, passing GRMP test suites revealed fundamental discrepancies between our previous generator and GRMP's schema parser:
1. **Root Configuration Schema:** GRMP requires `title`, `description`, and `options` (`timeout: 10`, `verify_ssl: false`, `max_depth: 3`). WebMap-ER was emitting deprecated `version` and `name` attributes.
2. **Pattern Property Names & Data Structures:**
   - **PT-01**: Requires `profile_description_profile` and `profile_type`; had improper `cite_as`.
   - **PT-02**: Requires `resource`, `composite_profile`, `member_profiles: [ ... ]`, and `check_composite: true`.
   - **PT-03**: Requires `concept`, `variant_menu`, `variants: [ { uri, type } ]`, and `check_variants: true`.
   - **PT-04**: Requires `pid`, `content`, `resource`, `descriptions: [ { uri, type } ]`, and `check_descriptions: true`.
   - **PT-05**: Requires `dataset`, `base_api`, `api_catalog`, `service_desc`, `service_doc`, and `service_meta`.
   - **PT-06**: Requires `host`, `robots_txt: true`, `sitemap: "<url>"`, and `resources: [ { uri, linkset, profile } ]`.
   - **PT-07**: Requires `api_catalog`, `api_catalog_sitemap`, and `api_endpoints: [ { uri } ]`.
   - **PT-08**: Requires `resource`, `master_linkset`, `child_linksets: [ ... ]`, and `check_children: true`.
3. **Missing Pattern PT-09:** WebMap-ER supported 8 patterns (PT-01 to PT-08). The EOSC Interoperability Framework and GRMP include **PT-09: Release Linking & Version Navigation** using RFC 5829 relations.

---

## 2. Technical Architecture & Changes

### 2.1. Pattern Definitions (`src/core/rt/patterns.ts`)
Add `PT-09` to `RT_PATTERNS`:
- **ID:** `PT-09` (`RT-P09`)
- **Name:** `Release Linking & Version Navigation`
- **Summary:** `Navigates release lifecycles and dataset versions via RFC 5829 relations (latest-version, predecessor, successor, version-history).`
- **Required Relations:** `['latest-version']`
- **Recommended Relations:** `['predecessor-version', 'successor-version', 'version-history']`
- **Standards:** RFC 5829 (Versioning Links), W3C DCAT-3 (Version Chains)
- **docUrl:** `https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-09-versioning`
- **grmpTestType:** `PT-09`

### 2.2. YAML Exporter Engine (`src/core/export/yaml-test.ts`)
Refactor `generateRtTestYaml(resourceUri: string, links: DiscoveredLink[], activePatternId?: string)`:
1. Parse `resourceUri` to determine hostname, origin, dataset identifier, and parent host.
2. Build root metadata (`title`, `description`, `options`).
3. For each active or detected pattern, generate YAML blocks matching the exact GRMP schema:
   - Dynamic extraction of mime types for `descriptions` (PT-04) and `variants` (PT-03).
   - Array formatting for `member_profiles`, `child_linksets`, `api_endpoints`, and `releases`.
   - Inclusion of GRMP execution flags (`check_composite: true`, `check_variants: true`, `check_descriptions: true`, `check_children: true`, `check_history: true`, `check_releases: true`).
4. Ensure deterministic formatting, clean indentation, and zero emojis.

### 2.3. Diagnostics & Triage Questionnaire
- Support evaluating PT-09 in `src/core/triage/diagnostics.ts` and `src/core/triage/questions.ts`.
- Total pattern count updated to 9 across diagnostics and status reports.

### 2.4. Agent Plan & IT Ticket Updates
- Update `src/core/export/it-ticket.ts` and `src/core/export/agent-plan.ts` documentation to reflect the full PT-01 to PT-09 spectrum.

---

## 3. Verification Plan
- Unit tests in `tests/yaml-test.test.ts` verifying all 9 patterns against the GRMP schema.
- Regression tests in `tests/multi-pattern.test.ts` and `tests/triage.test.ts` verifying 9 patterns evaluated.
- End-to-end integration and TypeScript build verification (`npm test` and `npm run build`).
