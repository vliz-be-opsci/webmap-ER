# webmap-ER: Precision Scientific & Clinical Instrument UI Redesign

**Date:** 2026-09-14  
**Status:** Design Specification  
**Target Repository:** `vliz-be-opsci/webmap-ER`  

---

## 1. Executive Summary & Design Vision

`webmap-ER` is an interactive, browser-based Emergency Room & guidance system for Radical Transparency (RT) and RFC 8288/9264 web linking across open research data ecosystems. 

While the functional engine (cascading extraction via `wrx`, diagnostic scoring, and systemic export generators) is sound, the initial user interface carries numerous hallmark **AI-generated aesthetic tells**:
- Ubiquitous generic dark mode (`#0b0f19` / `#111827` / `#1f2937`) with glowing mint/teal (`#a7f3d0`) code blocks.
- Over-reliance on emojis (`✚`, `📋`, `⚖️`, `🕸️`, `🔗`, `❓`, `💡`, `🎉`, `←`, `Next →`, `↶ Undo`) as makeshift iconography.
- "Card soup" layout without visual hierarchy where three identical small boxes represent vital signs, violating the *One Thing Leads* rule.
- Flat typography lacking tabular alignment (`font-variant-numeric: tabular-nums`), causing visual jitter.
- Disruptive native browser `alert()` dialogs for clipboard operations and CORS notifications.
- Complete absence of a Light Mode or theme toggle.

This specification defines a comprehensive visual and structural redesign that transforms `webmap-ER` into an authoritative **Precision Scientific & Clinical Instrument**. It introduces a complete dual-theme architecture (Light & Dark), lightweight inline SVG iconography, an authentic Telemetry HUD, a theme-responsive SVG graph canvas with coordinate grid patterns, and a non-intrusive in-app diagnostic Toast system.

---

## 2. Token Architecture & Dual-Theme System

The styling layer is organized into a strict 3-tier CSS custom property system loaded at root.

### 2.1 Color Foundations & Semantic Mapping

```css
:root {
  /* Typography Scale */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  
  /* Radii & Hairlines */
  --radius-xs: 3px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Elevation Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Light Theme: Clinical Daylight / Lab Paper */
[data-theme="light"] {
  --surface-canvas: #f8fafc;
  --surface-panel: #ffffff;
  --surface-card: #ffffff;
  --surface-subtle: #f1f5f9;
  --surface-hover: #e2e8f0;
  --surface-active: #cbd5e1;
  --surface-dialog: #ffffff;
  --surface-code: #f1f5f9;

  --border-subtle: #e2e8f0;
  --border-strong: #cbd5e1;
  --border-focus: #2563eb;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --text-code: #1e293b;

  /* Clinical Signal Tokens */
  --clinical-emerald: #059669;
  --clinical-emerald-bg: rgba(5, 150, 105, 0.08);
  --clinical-amber: #d97706;
  --clinical-amber-bg: rgba(217, 119, 6, 0.08);
  --clinical-crimson: #dc2626;
  --clinical-crimson-bg: rgba(220, 38, 38, 0.08);
  --clinical-cobalt: #2563eb;
  --clinical-cobalt-bg: rgba(37, 99, 235, 0.08);
  --clinical-indigo: #4f46e5;
  --clinical-indigo-bg: rgba(79, 70, 229, 0.08);

  --canvas-grid-dot: rgba(15, 23, 42, 0.08);
}

/* Dark Theme: Precision Workstation / Lab Console */
[data-theme="dark"] {
  --surface-canvas: #090d16;
  --surface-panel: #0f172a;
  --surface-card: #131d31;
  --surface-subtle: #17233c;
  --surface-hover: #1e2e4f;
  --surface-active: #273b64;
  --surface-dialog: #0f172a;
  --surface-code: #070b12;

  --border-subtle: #1e293b;
  --border-strong: #334155;
  --border-focus: #3b82f6;

  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-code: #e2e8f0;

  /* Clinical Signal Tokens */
  --clinical-emerald: #10b981;
  --clinical-emerald-bg: rgba(16, 185, 129, 0.12);
  --clinical-amber: #f59e0b;
  --clinical-amber-bg: rgba(245, 158, 11, 0.12);
  --clinical-crimson: #ef4444;
  --clinical-crimson-bg: rgba(239, 68, 68, 0.14);
  --clinical-cobalt: #3b82f6;
  --clinical-cobalt-bg: rgba(59, 130, 246, 0.12);
  --clinical-indigo: #818cf8;
  --clinical-indigo-bg: rgba(129, 140, 248, 0.12);

  --canvas-grid-dot: rgba(255, 255, 255, 0.08);
}
```

### 2.2 Theme Initialization & Persistence
- Theme detection priority:
  1. `localStorage.getItem('webmap-er-theme')`
  2. `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`
- Script execution in `<head>` or main entry sets `data-theme` on `<html>` before initial paint to prevent flash of unstyled content (FOUC).
- Theme toggle control in the header toggles theme and broadcasts to store/listeners.

---

## 3. Iconography & Elimination of Emoji Tells

All emojis are removed and replaced by lightweight, semantic, inline SVG icons with `currentColor` stroke:

| Location | Prior Emoji | Replacement SVG Icon |
| :--- | :--- | :--- |
| Header Logo | `✚` | Clinical Cross Emblem (`stroke-width: 2.5`) |
| View: Triage | `📋` | `list-checks` (Task list with check marks) |
| View: Balanced | `⚖️` | `columns-2` (Dual split-pane icon) |
| View: Graph | `🕸️` | `network` (Connected node network) |
| Action: Share | `🔗` | `link-2` |
| Action: Export | Text only | `file-code` / `download` |
| Action: Tutorial | `❓` | `help-circle` |
| Triage: Didactic | `💡` | `info` / `stethoscope` |
| Triage: Undo | `↶` | `rotate-ccw` |
| Triage: Nav | `←` / `Next →` | `chevron-left` / `chevron-right` |
| State: Healthy | `🎉` | `shield-check` (Verification crest) |

---

## 4. Component Redesigns

### 4.1 Header (`src/ui/components/header.ts`)
- **Brand Unit**: Integrated clinical emblem badge with subtle pulse, bold mono title `webmap-ER`, and a precision tag `RADICAL TRANSPARENCY TRIAGE`.
- **Preset Selector**: Formatted select control with hairline borders and distinct option labels.
- **Segmented View Switcher**: Tactile 3-segment toggle (`Questionnaire`, `Balanced`, `Graph`) with clean SVG icons, active background transition, and keyboard navigation.
- **Theme Switcher**: Sun / Moon icon toggle with smooth rotating state transition.
- **Export & Share Actions**: Primary clinical action styling with hover elevation and clear focus rings.

### 4.2 Clinical Telemetry HUD (`src/ui/components/triage-panel.ts`)
- **One Thing Leads**: 
  - Large **Vital Health Status Gauge**: tabular percentage score (e.g. `45%`, `100%`) in `JetBrains Mono` at `2.25rem`.
  - Dynamic status badge: `CRITICAL TRAUMA` (Crimson), `UNSTABLE CONDITION` (Amber), or `VITAL CONFORMITY` (Emerald).
  - Continuous telemetry bar showing proportion of diagnosed vs missing relations.
- **Secondary Telemetry Strip**: Detected relation counters, seed protocol status, and active pattern conformity.
- **Input Bar**: Terminal-style input with `HTTPS` protocol badge, clear button, and a tactile "Diagnose (wrx)" button with loading spinner state.

### 4.3 Triage Questionnaire & Prescriptions
- **Eliminate AI Alert Box**: Replace the heavy blue left border with a clean **Clinical Guidance Panel** featuring an `info` SVG icon, subtle background tint, and didactic text explaining the semantic importance of the relation in EOSC/harvester discovery.
- **Prescription Option Cards**: Structured cards displaying standard name, target URI in `JetBrains Mono`, and didactic summary. Hover and active states provide crisp tactile depression.
- **8 Interactive States**: default, hover, focus-visible (`outline: 2px solid var(--border-focus); outline-offset: 2px`), active, disabled, loading, selected, and error.

### 4.4 Non-Intrusive Clinical Toast System (`src/ui/components/toast.ts`)
- Replaces all blocking browser `alert()` popups.
- Floating container anchored to the bottom-right corner.
- Injects a toast element with icon, title, description, and auto-dismiss progress bar (3.5s timeout).
- Used for:
  - "Shareable permalink copied to clipboard"
  - "Artifact copied to clipboard"
  - "CORS inspection blocked — switched to manual triage"

### 4.5 Interactive SVG Graph Canvas (`src/ui/graph/renderer.ts`)
- **Theme-Aware Canvas**: Adapts to `--surface-canvas` automatically.
- **Coordinate Dot-Grid Background**: Injected `<defs><pattern id="grid-dots">` creates an authentic scientific oscilloscope / plotting screen.
- **Directional Relation Arrows**: `<marker id="rel-arrow">` renders directional arrows on edges representing source $\to$ target RFC link semantics.
- **Node Badges**:
  - `Resource`: Primary cobalt core with dual ring.
  - `Profile`: Clinical indigo capsule.
  - `Metadata`: Emerald document node.
  - `PID`: Amber citation node.
  - Labels rendered with pill backgrounds to guarantee legible contrast in both light and dark modes.

### 4.6 Modals (`export-modal.ts` & `tutorial-modal.ts`)
- Glassmorphic modal backdrop with `backdrop-filter: blur(8px)`.
- Semantic tab switching using `.tab-btn.is-active` and ARIA attributes (`role="tab"`, `aria-selected="true"`).
- Code blocks styled without glowing teal, formatted in `JetBrains Mono` with clean neutral syntax highlighting and instant copy-to-clipboard action.

---

## 5. File Structure Changes

```text
src/
├── style.css                      # Complete 3-tier token architecture & dual-theme styles
├── main.ts                        # Bootstrapper with theme initialization
├── ui/
│   ├── layout.ts                  # Split container with toast mount
│   ├── icons.ts                   # [NEW] Reusable inline SVG icon helper registry
│   ├── components/
│   │   ├── toast.ts               # [NEW] Non-intrusive clinical toast notification manager
│   │   ├── header.ts              # Redesigned header with theme toggle and SVG icons
│   │   ├── triage-panel.ts        # Redesigned Telemetry HUD and clinical question cards
│   │   ├── graph-panel.ts         # Graph controls toolbar with SVG icons
│   │   ├── export-modal.ts        # Accessible tabbed modal with syntax code blocks
│   │   └── tutorial-modal.ts      # Clinical onboarding diagram without emojis
│   └── graph/
│       └── renderer.ts            # Theme-aware SVG graph with grid pattern & directional arrows
```

---

## 6. Verification & Quality Gates

1. **Accessibility (WCAG 2.2 AA)**:
   - Verify contrast ratio of all text pairs (primary text, secondary text, status badges) $\ge 4.5:1$ in both light and dark modes.
   - Interactive focus-visible rings on all keyboard-navigable elements.
2. **Theme Switching Verification**:
   - Verify instant, seamless switching between Light and Dark mode across all panels, canvas, modals, and toasts.
   - Verify `localStorage` persistence survives page reloads.
3. **Responsive & Split-View Integrity**:
   - Verify Balanced (50/50), Extended Questionnaire (75/25), and Extended Graph (25/75) layouts across screen widths.
4. **Behavioral Smoke Tests**:
   - Loading sample presets (ARMS-MBON, EurOBIS, North Sea Sensor).
   - Answering triage questions and validating immediate graph updates.
   - Permalink copy and restore from compressed URI fragment.
   - Remediation export (IT ticket, headers, sitemap, YAML).
