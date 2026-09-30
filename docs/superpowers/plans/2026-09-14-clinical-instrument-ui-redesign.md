# Clinical Instrument UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform webmap-ER into an authoritative Precision Scientific & Clinical Instrument by eliminating AI aesthetic tells (mint/teal code blocks, emojis, card soup, flat system fonts, native browser alerts), establishing a dual-theme architecture (Light & Dark) with a 3-tier CSS token system, introducing lightweight inline SVG iconography, an authentic Telemetry HUD, theme-aware coordinate-grid SVG graph canvas, and a non-intrusive clinical Toast notification system.

**Architecture:** A strict 3-tier CSS custom property system loaded at `:root` (`[data-theme="light"]` and `[data-theme="dark"]`) with a lightweight theme manager persisting to `localStorage`. Zero-dependency inline SVG icon registry replaces all emojis. The Triage Panel is restructured around the *One Thing Leads* rule with an expressive Telemetry HUD and tabular numerals. The native SVG graph visualizer is upgraded with an oscilloscope-style coordinate dot grid, directional RFC relation arrows, and dual-ring node badges.

**Tech Stack:** Vanilla TypeScript, Vite, CSS Custom Properties (3-tier design tokens), Native SVG/Canvas, Happy-DOM, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-14-clinical-instrument-ui-redesign.md`](file:///c:/Users/cedricd/Documents/Github/webmap-ER/docs/superpowers/specs/2026-09-14-clinical-instrument-ui-redesign.md)

## Global Constraints
- Absolute zero emoji in any UI, copy, comments, or commit messages.
- Zero external runtime library dependencies (use inline SVGs and pure TypeScript/CSS).
- Maintain 100% WCAG 2.2 AA contrast compliance ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large text and UI components) in both Light and Dark modes.
- Preserve all existing core engine functionality (`wrx` cascading extraction, diagnostic evaluation, event-sourced state store, URI fragment compression, and remediation exports).

---

### Task 1: CSS Design Tokens & Dual-Theme Architecture

**Files:**
- Modify: `index.html:1-14`
- Modify: `src/style.css:1-332`
- Test: `tests/style.test.ts`

**Interfaces:**
- Consumes: Google Fonts (`Inter` and `JetBrains Mono`)
- Produces: CSS custom properties (`--surface-canvas`, `--surface-panel`, `--surface-card`, `--border-subtle`, `--text-primary`, `--text-secondary`, `--clinical-emerald`, `--clinical-amber`, `--clinical-crimson`, `--clinical-cobalt`, `--clinical-indigo`, etc.)

- [ ] **Step 1: Write the failing style test**

```typescript
// tests/style.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('CSS Token System & Anti-AI Auditing', () => {
  const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf-8');

  it('should define dual themes [data-theme="light"] and [data-theme="dark"]', () => {
    expect(css).toContain('[data-theme="light"]');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('--surface-canvas');
    expect(css).toContain('--clinical-crimson');
    expect(css).toContain('--clinical-emerald');
  });

  it('should not contain banned AI tells like glowing mint teal (#a7f3d0)', () => {
    expect(css).not.toContain('#a7f3d0');
  });

  it('should enforce tabular numbers on metrics', () => {
    expect(css).toContain('tabular-nums');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/style.test.ts`  
Expected: FAIL with missing `[data-theme="light"]` or `#a7f3d0` present.

- [ ] **Step 3: Update `index.html` and rewrite `src/style.css`**

Add font preconnect in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Implement `src/style.css` with:
- `:root` font families, radii, and transition tokens.
- Complete `[data-theme="light"]` and `[data-theme="dark"]` token sets.
- Full 8-state interactive rules (`:hover`, `:focus-visible`, `:active`, `:disabled`, etc.).
- Clean terminal-style code blocks with neutral, high-contrast syntax colors.
- Telemetry HUD, badge, button, and modal styling.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/style.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.html src/style.css tests/style.test.ts
git commit -m "feat(design): implement dual-theme 3-tier CSS token system"
```

---

### Task 2: Theme Initialization & State Manager

**Files:**
- Create: `src/core/theme/theme.ts`
- Modify: `src/main.ts:1-23`
- Test: `tests/theme.test.ts`

**Interfaces:**
- Produces: 
  - `type Theme = 'light' | 'dark'`
  - `getInitialTheme(): Theme`
  - `setTheme(theme: Theme): void`
  - `toggleTheme(): Theme`
  - `subscribeTheme(cb: (theme: Theme) => void): () => void`

- [ ] **Step 1: Write the failing theme test**

```typescript
// tests/theme.test.ts
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { getInitialTheme, setTheme, toggleTheme } from '../src/core/theme/theme';

describe('Theme Manager', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should initialize theme and set data-theme on documentElement', () => {
    const theme = getInitialTheme();
    expect(['light', 'dark']).toContain(theme);
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
  });

  it('should allow setting theme and persist to localStorage', () => {
    setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('webmap-er-theme')).toBe('dark');

    setTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('webmap-er-theme')).toBe('light');
  });

  it('should toggle theme cleanly between light and dark', () => {
    setTheme('dark');
    const next = toggleTheme();
    expect(next).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/theme.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/core/theme/theme.ts` and initialize in `src/main.ts`**

```typescript
// src/core/theme/theme.ts
export type Theme = 'light' | 'dark';

const THEME_KEY = 'webmap-er-theme';
type ThemeListener = (theme: Theme) => void;
const listeners: ThemeListener[] = [];

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    applyTheme(stored);
    return stored;
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = prefersDark ? 'dark' : 'light';
  applyTheme(initial);
  return initial;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  listeners.forEach(cb => cb(theme));
}

export function setTheme(theme: Theme): void {
  applyTheme(theme);
}

export function toggleTheme(): Theme {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

export function subscribeTheme(cb: ThemeListener): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}
```

In `src/main.ts`, call `getInitialTheme()` during bootstrap.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/theme.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/theme/theme.ts src/main.ts tests/theme.test.ts
git commit -m "feat(theme): add persistent light and dark theme manager"
```

---

### Task 3: Inline SVG Iconography Registry

**Files:**
- Create: `src/ui/icons.ts`
- Test: `tests/icons.test.ts`

**Interfaces:**
- Produces: 
  - `iconCross(cls?: string): string`
  - `iconListChecks(cls?: string): string`
  - `iconColumns2(cls?: string): string`
  - `iconNetwork(cls?: string): string`
  - `iconLink(cls?: string): string`
  - `iconFileCode(cls?: string): string`
  - `iconHelpCircle(cls?: string): string`
  - `iconInfo(cls?: string): string`
  - `iconRotateCcw(cls?: string): string`
  - `iconChevronLeft(cls?: string): string`
  - `iconChevronRight(cls?: string): string`
  - `iconShieldCheck(cls?: string): string`
  - `iconSun(cls?: string): string`
  - `iconMoon(cls?: string): string`
  - `iconCopy(cls?: string): string`
  - `iconCheck(cls?: string): string`
  - `iconClose(cls?: string): string`

- [ ] **Step 1: Write the failing icons test**

```typescript
// tests/icons.test.ts
import { describe, it, expect } from 'vitest';
import * as icons from '../src/ui/icons';

describe('SVG Iconography Registry', () => {
  it('should export all required clinical and navigation icons as valid SVG strings', () => {
    const requiredIcons = [
      'iconCross', 'iconListChecks', 'iconColumns2', 'iconNetwork',
      'iconLink', 'iconFileCode', 'iconHelpCircle', 'iconInfo',
      'iconRotateCcw', 'iconChevronLeft', 'iconChevronRight',
      'iconShieldCheck', 'iconSun', 'iconMoon', 'iconCopy',
      'iconCheck', 'iconClose'
    ];

    requiredIcons.forEach(name => {
      const fn = (icons as any)[name];
      expect(typeof fn).toBe('function');
      const svg = fn();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('stroke="currentColor"');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/icons.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/ui/icons.ts`**

Write standard inline Lucide-style SVGs with customizable class names, `viewBox="0 0 24 24"`, `fill="none"`, and `stroke="currentColor"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/icons.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/icons.ts tests/icons.test.ts
git commit -m "feat(icons): add zero-dependency inline SVG icon registry"
```

---

### Task 4: Non-Intrusive Clinical Toast Notification Manager

**Files:**
- Create: `src/ui/components/toast.ts`
- Modify: `src/ui/layout.ts:1-44`
- Test: `tests/toast.test.ts`

**Interfaces:**
- Produces:
  - `showToast(title: string, description?: string, type?: 'info' | 'success' | 'warning' | 'error'): void`
  - `createToastContainer(): HTMLElement`

- [ ] **Step 1: Write the failing toast test**

```typescript
// tests/toast.test.ts
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { showToast, createToastContainer } from '../src/ui/components/toast';

describe('Clinical Toast Manager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const container = createToastContainer();
    document.body.appendChild(container);
  });

  it('should render a toast item when showToast is dispatched', () => {
    showToast('Diagnostic Complete', 'Score updated to 85%', 'success');
    const toast = document.querySelector('.clinical-toast');
    expect(toast).toBeDefined();
    expect(toast?.textContent).toContain('Diagnostic Complete');
    expect(toast?.textContent).toContain('Score updated to 85%');
    expect(toast?.classList.contains('toast-success')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/toast.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/ui/components/toast.ts` and mount in `src/ui/layout.ts`**

Implement toast component with title, optional description, icon, dismiss button, and 3500ms auto-removal with CSS slide/fade animations.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/toast.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/toast.ts src/ui/layout.ts tests/toast.test.ts
git commit -m "feat(ui): add non-intrusive clinical toast notification system"
```

---

### Task 5: Header Redesign with Theme Switcher & SVG Icons

**Files:**
- Modify: `src/ui/components/header.ts:1-81`
- Test: `tests/header.test.ts`

**Interfaces:**
- Consumes: `AppStore`, `theme.ts`, `icons.ts`, `toast.ts`
- Produces: Updated `createHeader(store, onOpenTutorial, onOpenExport): HTMLElement`

- [ ] **Step 1: Write the failing header test**

```typescript
// tests/header.test.ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createHeader } from '../src/ui/components/header';

describe('Header Component Redesign', () => {
  it('should render brand cross emblem, SVG view switchers, and theme toggle without emojis', () => {
    const store = new AppStore();
    const header = createHeader(store, () => {}, () => {});
    
    expect(header.querySelector('.brand-emblem')).toBeDefined();
    expect(header.querySelector('#btn-theme-toggle')).toBeDefined();
    expect(header.querySelector('#btn-view-balanced svg')).toBeDefined();
    
    // Check no emojis in header text
    expect(header.innerHTML).not.toContain('📋');
    expect(header.innerHTML).not.toContain('⚖️');
    expect(header.innerHTML).not.toContain('🕸️');
    expect(header.innerHTML).not.toContain('🔗');
    expect(header.innerHTML).not.toContain('❓');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/header.test.ts`  
Expected: FAIL with missing theme toggle or emojis detected.

- [ ] **Step 3: Update `src/ui/components/header.ts`**

- Replace emojis with inline SVG icons (`iconListChecks`, `iconColumns2`, `iconNetwork`, `iconLink`, `iconFileCode`, `iconHelpCircle`, `iconSun`, `iconMoon`, `iconCross`).
- Wire the theme toggle to `toggleTheme()`.
- Wire permalink copy to `showToast('Permalink Copied', 'Shareable state URL saved to clipboard.', 'success')` instead of native `alert()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/header.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/header.ts tests/header.test.ts
git commit -m "feat(ui): redesign header with theme switcher and inline SVG icons"
```

---

### Task 6: Clinical Telemetry HUD & Questionnaire Redesign

**Files:**
- Modify: `src/ui/components/triage-panel.ts:1-131`
- Test: `tests/triage-panel.test.ts`

**Interfaces:**
- Consumes: `AppStore`, `diagnostics.ts`, `questions.ts`, `icons.ts`, `toast.ts`
- Produces: Updated `createTriagePanel(store): HTMLElement`

- [ ] **Step 1: Write the failing triage panel test**

```typescript
// tests/triage-panel.test.ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createTriagePanel } from '../src/ui/components/triage-panel';

describe('Triage Panel Telemetry HUD & Questionnaire', () => {
  it('should render the Telemetry HUD with score meter and no emojis', () => {
    const store = new AppStore();
    const panel = createTriagePanel(store);

    expect(panel.querySelector('.telemetry-hud')).toBeDefined();
    expect(panel.querySelector('.hud-health-score')).toBeDefined();
    expect(panel.querySelector('.hud-meter-bar')).toBeDefined();
    
    // Check no emojis in panel
    expect(panel.innerHTML).not.toContain('💡');
    expect(panel.innerHTML).not.toContain('🎉');
    expect(panel.innerHTML).not.toContain('←');
    expect(panel.innerHTML).not.toContain('Next →');
    expect(panel.innerHTML).not.toContain('↶');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/triage-panel.test.ts`  
Expected: FAIL with `.telemetry-hud` not found.

- [ ] **Step 3: Update `src/ui/components/triage-panel.ts`**

- Build **Clinical Telemetry HUD**:
  - Primary element: 2.25rem tabular score percentage (`font-variant-numeric: tabular-nums; font-family: var(--font-mono)`), dynamic condition badge (`CRITICAL TRAUMA`, `UNSTABLE CONDITION`, `VITAL CONFORMITY`), and real-time gap-closure progress bar.
  - Secondary telemetry bar: total detected relations, missing role count, protocol indicator.
- Build terminal-style seed URI input.
- Replace didactic pill with clinical rationale callout using `iconInfo`.
- Replace navigation buttons with `iconChevronLeft`, `iconChevronRight`, `iconRotateCcw`.
- Replace CORS `alert()` with `showToast(..., 'warning')`.
- Replace healthy state card emoji with `iconShieldCheck`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/triage-panel.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/triage-panel.ts tests/triage-panel.test.ts
git commit -m "feat(ui): redesign triage panel with clinical telemetry HUD and SVG icons"
```

---

### Task 7: Theme-Aware SVG Graph Canvas with Coordinate Grid & Directional Edges

**Files:**
- Modify: `src/ui/graph/renderer.ts:1-162`
- Modify: `src/ui/components/graph-panel.ts:1-44`
- Test: `tests/graph-renderer.test.ts`

**Interfaces:**
- Consumes: `DiscoveredLink`, `icons.ts`, `toast.ts`
- Produces: Updated `renderSvgGraph(container, model, onNodeClick): SVGSVGElement`

- [ ] **Step 1: Write the failing graph test**

```typescript
// tests/graph-renderer.test.ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { buildGraphModel, renderSvgGraph } from '../src/ui/graph/renderer';

describe('Graph Visualizer SVG Enhancements', () => {
  it('should render coordinate grid-dots pattern and relation arrow markers', () => {
    const container = document.createElement('div');
    const model = buildGraphModel('https://example.org/res', [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' }
    ]);
    const svg = renderSvgGraph(container, model);

    expect(svg.querySelector('defs pattern#grid-dots')).toBeDefined();
    expect(svg.querySelector('defs marker#rel-arrow')).toBeDefined();
    expect(svg.querySelector('line[marker-end="url(#rel-arrow)"]')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/graph-renderer.test.ts`  
Expected: FAIL with `grid-dots` pattern not found.

- [ ] **Step 3: Update `src/ui/graph/renderer.ts` and `src/ui/components/graph-panel.ts`**

- In `renderer.ts`:
  - Add `<defs>` with `<pattern id="grid-dots">` (16x16 grid spacing) and `<marker id="rel-arrow">` (directional arrowhead).
  - Add background `<rect width="100%" height="100%" fill="url(#grid-dots)">`.
  - Node styling: dual-ring badge for resource, capsule nodes with high-contrast text and pill backgrounds.
  - Edges: attach `marker-end="url(#rel-arrow)"` and render relation pill capsules.
- In `graph-panel.ts`:
  - Add SVG icons to Export PNG and Export SVG buttons.
  - Connect export completions to `showToast('Export Generated', 'Image snapshot downloaded.', 'success')`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/graph-renderer.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/graph/renderer.ts src/ui/components/graph-panel.ts tests/graph-renderer.test.ts
git commit -m "feat(graph): add coordinate grid background and directional relation arrows"
```

---

### Task 8: Dual-Theme Accessible Modals & Clean Code Blocks

**Files:**
- Modify: `src/ui/components/export-modal.ts:1-95`
- Modify: `src/ui/components/tutorial-modal.ts:1-46`
- Test: `tests/modals.test.ts`

**Interfaces:**
- Consumes: `icons.ts`, `toast.ts`
- Produces: Accessible modals without emojis, utilizing theme tokens and CSS active classes

- [ ] **Step 1: Write the failing modals test**

```typescript
// tests/modals.test.ts
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createExportModal } from '../src/ui/components/export-modal';
import { createTutorialModal } from '../src/ui/components/tutorial-modal';

describe('Modal Dialogs & Remediation Code Blocks', () => {
  it('should render export modal with accessible tabs and no emojis', () => {
    const store = new AppStore();
    const modal = createExportModal(store, () => {});
    
    expect(modal.querySelector('[role="tablist"]')).toBeDefined();
    expect(modal.innerHTML).not.toContain('📋');
    expect(modal.innerHTML).not.toContain('✕'); // uses SVG close icon
  });

  it('should render tutorial modal with clinical workflow diagram and no emojis', () => {
    const modal = createTutorialModal(() => {});
    expect(modal.innerHTML).not.toContain('✚'); // uses SVG emblem
    expect(modal.querySelector('.tutorial-steps')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/modals.test.ts`  
Expected: FAIL with missing `[role="tablist"]`.

- [ ] **Step 3: Update `src/ui/components/export-modal.ts` and `src/ui/components/tutorial-modal.ts`**

- Add ARIA attributes (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`).
- Replace inline style updates with `.tab-btn.is-active` class toggles.
- Connect code copy buttons to `showToast('Copied to Clipboard', 'Artifact snippet copied.', 'success')`.
- Replace emojis with inline SVG icons (`iconCopy`, `iconClose`, `iconCross`, `iconCheck`).
- Update tutorial modal with a clean 3-step clinical triage diagram.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/modals.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/export-modal.ts src/ui/components/tutorial-modal.ts tests/modals.test.ts
git commit -m "feat(ui): upgrade export and tutorial modals with ARIA accessibility and SVG icons"
```

---

### Task 9: End-to-End Build, Test Verification & Visual Smoke Test

**Files:**
- Test: All unit and integration test suites
- Target: Full Vite production build

- [ ] **Step 1: TypeScript type checking**

Run: `npx tsc --noEmit`  
Expected: 0 errors.

- [ ] **Step 2: Run all unit and integration tests**

Run: `npx vitest run`  
Expected: All tests pass across existing and new test suites.

- [ ] **Step 3: Run production build**

Run: `npm run build`  
Expected: Generates `dist/` cleanly without warnings.

- [ ] **Step 4: Browser verification & screenshot review**

Use browser subagent to verify:
- Theme toggle changes light/dark modes across header, panels, canvas, and modals.
- Load sample preset (ARMS-MBON) and check Telemetry HUD score update.
- Answer questions and observe immediate graph mutations.
- Check graph coordinate dot-grid pattern and directional arrowheads.
- Open export modal, switch tabs, and copy artifact to confirm clinical toast notification.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: complete clinical instrument UI redesign verification"
```
