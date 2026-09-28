// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createTriagePanel } from '../src/ui/components/triage-panel';

describe('Triage Panel Telemetry HUD & Questionnaire', () => {
  it('should render the Telemetry HUD with score meter and no emojis when seed URI is provided', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    const panel = createTriagePanel(store);

    expect(panel.querySelector('.telemetry-hud')).not.toBeNull();
    expect(panel.querySelector('.hud-score-value')).not.toBeNull();
    expect(panel.querySelector('.hud-meter-bar')).not.toBeNull();
    
    // Check no emojis in panel
    expect(panel.innerHTML).not.toContain('💡');
    expect(panel.innerHTML).not.toContain('🎉');
    expect(panel.innerHTML).not.toContain('←');
    expect(panel.innerHTML).not.toContain('Next →');
    expect(panel.innerHTML).not.toContain('↶');
  });

  it('should highlight seed URI on top and hide Telemetry HUD and Pattern Matrix when no seed URI is provided', () => {
    const store = new AppStore();
    const panel = createTriagePanel(store);

    // Target Seed Resource URI input must be on top and highlighted
    const highlightedSeedCard = panel.querySelector('.seed-card.highlighted');
    expect(highlightedSeedCard).not.toBeNull();
    expect(panel.firstElementChild?.classList.contains('seed-card')).toBe(true);

    // Global vital sign score HUD and pattern strip must be hidden
    expect(panel.querySelector('.telemetry-hud')).toBeNull();
    expect(panel.querySelector('.pattern-matrix-strip')).toBeNull();

    // No questionnaire card because there is no URI yet
    expect(panel.querySelector('.question-card')).toBeNull();

    // Intake Hero card should be rendered directly below with sample presets
    const heroCard = panel.querySelector('.intake-hero-card');
    expect(heroCard).not.toBeNull();
    expect(heroCard?.textContent).toContain('Target Seed Resource Required');

    const presetButtons = heroCard?.querySelectorAll('.btn-preset-card');
    expect(presetButtons?.length).toBeGreaterThanOrEqual(3);
  });

  it('should render clickable standards specifications for the active pattern when seed URI is provided', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    store.setActivePatternId('PT-01');
    const panel = createTriagePanel(store);

    const standardLinks = panel.querySelectorAll('a.hud-standard-link');
    expect(standardLinks.length).toBeGreaterThan(0);
    const rfc6906 = Array.from(standardLinks).find(l => l.textContent?.includes('RFC 6906'));
    expect(rfc6906).toBeDefined();
    expect(rfc6906?.getAttribute('href')).toContain('datatracker.ietf.org');
    expect(rfc6906?.getAttribute('target')).toBe('_blank');
  });

  it('should render clinical guidance and question card when seed URI is provided', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    const panel = createTriagePanel(store);

    expect(panel.querySelector('.question-card')).not.toBeNull();
    expect(panel.querySelector('.clinical-guidance-panel')).not.toBeNull();
    expect(panel.querySelector('.guidance-icon svg')).not.toBeNull();
  });

  it('should display concrete missing relation chips with pattern attribution', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    store.setActivePatternId('PT-01');
    const panel = createTriagePanel(store);

    // In PT-01, profile is required and missing
    const missingReqChips = panel.querySelectorAll('.hud-rel-chip.missing-req');
    expect(missingReqChips.length).toBeGreaterThan(0);
    expect(panel.textContent).toContain('profile');
    expect(panel.textContent).toContain('REQUIRED');
  });
});
