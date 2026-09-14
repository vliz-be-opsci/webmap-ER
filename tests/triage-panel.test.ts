// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { createTriagePanel } from '../src/ui/components/triage-panel';

describe('Triage Panel Telemetry HUD & Questionnaire', () => {
  it('should render the Telemetry HUD with score meter and no emojis', () => {
    const store = new AppStore();
    const panel = createTriagePanel(store);

    expect(panel.querySelector('.telemetry-hud')).toBeDefined();
    expect(panel.querySelector('.hud-score-value')).toBeDefined();
    expect(panel.querySelector('.hud-meter-bar')).toBeDefined();
    
    // Check no emojis in panel
    expect(panel.innerHTML).not.toContain('💡');
    expect(panel.innerHTML).not.toContain('🎉');
    expect(panel.innerHTML).not.toContain('←');
    expect(panel.innerHTML).not.toContain('Next →');
    expect(panel.innerHTML).not.toContain('↶');
  });

  it('should render clinical guidance callout with SVG info icon', () => {
    const store = new AppStore();
    const panel = createTriagePanel(store);

    expect(panel.querySelector('.clinical-guidance-panel')).toBeDefined();
    expect(panel.querySelector('.guidance-icon svg')).toBeDefined();
  });
});
