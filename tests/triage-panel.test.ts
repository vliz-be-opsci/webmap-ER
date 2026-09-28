// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createTriagePanel } from '../src/ui/components/triage-panel';

describe('Triage Panel Telemetry HUD & Questionnaire', () => {
  it('should render the Telemetry HUD with score meter and no emojis', () => {
    const store = new AppStore();
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

  it('should render Intake Hero Card and no questionnaire when no seed URI is provided', () => {
    const store = new AppStore();
    const panel = createTriagePanel(store);

    // No questionnaire card because there is no URI yet
    expect(panel.querySelector('.question-card')).toBeNull();

    // Intake Hero card should be rendered with sample presets
    const heroCard = panel.querySelector('.intake-hero-card');
    expect(heroCard).not.toBeNull();
    expect(heroCard?.textContent).toContain('Target Seed Resource Required');

    const presetButtons = heroCard?.querySelectorAll('.btn-preset-card');
    expect(presetButtons?.length).toBeGreaterThanOrEqual(3);

    // Standby status in HUD
    expect(panel.textContent).toContain('AWAITING RESOURCE (STANDBY)');
  });

  it('should render clickable standards specifications for the active pattern', () => {
    const store = new AppStore();
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
