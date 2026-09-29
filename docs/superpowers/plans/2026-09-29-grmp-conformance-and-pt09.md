# GRMP Test Runner Conformance & Pattern PT-09 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the WebMap-ER YAML exporter (`rt-test.yaml`) with the official GRMP Docker container schema (`ghcr.io/vliz-be-opsci/rt-test`) across all Radical Transparency patterns, and introduce Pattern PT-09 (Versioned Release Lifecycle).

**Architecture:** Extend `RT_PATTERNS` in `src/core/rt/patterns.ts` with PT-09, update diagnostics and triage for PT-09 relations (`latest-version`, `predecessor-version`, `successor-version`, `version-history`), and rewrite `src/core/export/yaml-test.ts` to emit the empirical GRMP runner schema (`title`, `description`, `options`, nested lists, `check_*` booleans).

**Tech Stack:** TypeScript, Vitest, RFC 8288, RFC 5829, RFC 9264, YAML, GRMP Docker test runner.

**Spec:** `docs/superpowers/specs/2026-09-29-grmp-conformance-and-pt09-design.md`

## Global Constraints
- Preserve zero-emoji doctrine in all UI and generated artifacts.
- Keep backwards-compatible function signatures where possible.
- Strictly adhere to GRMP schema property names (`title`, `options`, `check_composite`, `check_variants`, `check_descriptions`, `check_children`, `check_history`, `check_releases`).

---

### Task 1: Add Pattern PT-09 to `src/core/rt/patterns.ts` & Triage Questions

**Files:**
- Modify: `src/core/rt/patterns.ts`
- Modify: `src/core/triage/questions.ts`
- Modify: `src/core/triage/diagnostics.ts`
- Test: `tests/multi-pattern.test.ts`

**Interfaces:**
- `RT_PATTERNS`: Array length updated from 8 to 9.
- `PT-09` definition: `id: 'PT-09'`, `rtCode: 'RT-P09'`, `requiredRelations: ['latest-version']`, `recommendedRelations: ['predecessor-version', 'successor-version', 'version-history']`.

- [ ] **Step 1: Write failing test in `tests/multi-pattern.test.ts` expecting 9 patterns**
- [ ] **Step 2: Add PT-09 to `RT_PATTERNS` in `src/core/rt/patterns.ts`**
- [ ] **Step 3: Update `src/core/triage/questions.ts` for PT-09 relations**
- [ ] **Step 4: Update `tests/multi-pattern.test.ts` and `tests/triage.test.ts`**
- [ ] **Step 5: Run tests and verify**

---

### Task 2: Implement Empirical GRMP YAML Test Generator

**Files:**
- Modify: `src/core/export/yaml-test.ts`
- Test: `tests/yaml-test.test.ts`

**Interfaces:**
- `generateRtTestYaml(resourceUri: string, links: DiscoveredLink[], activePatternId?: string, options?: RtTestOptions): string`
- Output structure matching GRMP Docker runner schema for PT-01 through PT-09.

- [ ] **Step 1: Write comprehensive failing tests in `tests/yaml-test.test.ts` covering root options and PT-01 to PT-09 GRMP schemas**
- [ ] **Step 2: Implement GRMP-compliant generation in `src/core/export/yaml-test.ts`**
  - Root `title`, `description`, and `options` (`timeout: 10`, `verify_ssl: false`, `max_depth: 3`).
  - PT-01: `profile_description_profile`, `profile_type`.
  - PT-02: `composite_profile`, `member_profiles: [...]`, `check_composite: true`.
  - PT-03: `concept`, `variant_menu`, `variants: [...]`, `check_variants: true`.
  - PT-04: `pid`, `content`, `resource`, `descriptions: [...]`, `check_descriptions: true`.
  - PT-05: `dataset`, `base_api`, `api_catalog`, `service_desc`, `service_doc`, `service_meta`.
  - PT-06: `host`, `robots_txt: true`, `sitemap`, `resources: [...]`.
  - PT-07: `api_catalog`, `api_catalog_sitemap`, `api_endpoints: [...]`.
  - PT-08: `resource`, `master_linkset`, `child_linksets: [...]`, `check_children: true`.
  - PT-09: `series`, `series_pid`, `latest_version`, `version_history`, `history_profile`, `releases: [...]`, `check_history: true`, `check_releases: true`.
- [ ] **Step 3: Run `tests/yaml-test.test.ts` and verify all pass**

---

### Task 3: Wire Active Pattern into Export Modal & Verification

**Files:**
- Modify: `src/ui/components/export-modal.ts`
- Modify: `src/ui/components/triage-panel.ts` (tutorial and pattern references)
- Test: `tests/export.test.ts`

- [ ] **Step 1: Pass `state.activePatternId` to `generateRtTestYaml` in `src/ui/components/export-modal.ts`**
- [ ] **Step 2: Update tutorial modal or triage panel copy referencing 9 patterns**
- [ ] **Step 3: Run full test suite (`npm test`) and production build (`npm run build`)**
