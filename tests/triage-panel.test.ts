// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
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

  it('should render the Node Inspector card when a discovered link node is selected and allow closing it', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    store.answerQuestionWithProvenance('q1', 'profile', 'https://w3id.org/ro/crate/1.1', 'HUMAN', 'RO-Crate spec');
    const panel = createTriagePanel(store);

    // Initially questionnaire is shown
    expect(panel.querySelector('.node-inspector-card')).toBeNull();

    // Select the node
    store.setSelectedNode('https://w3id.org/ro/crate/1.1');
    expect(panel.querySelector('.node-inspector-card')).not.toBeNull();
    expect(panel.textContent).toContain('Inspected Node: rel="profile"');
    expect(panel.textContent).toContain('https://w3id.org/ro/crate/1.1');

    // Click Back to Questionnaire
    const backBtn = panel.querySelector('#btn-inspector-close') as HTMLElement;
    expect(backBtn).not.toBeNull();
    backBtn.click();

    expect(store.getState().ui.selectedNodeId).toBeNull();
    expect(panel.querySelector('.node-inspector-card')).toBeNull();
  });

  it('should allow skipping questions in the questionnaire queue without error', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    const panel = createTriagePanel(store);

    const initialIdx = store.getState().ui.activeQuestionIndex;
    const skipBtn = panel.querySelector('#btn-skip-q') as HTMLElement;
    expect(skipBtn).not.toBeNull();

    skipBtn.click();
    expect(store.getState().ui.activeQuestionIndex).toBe(initialIdx + 1);
  });

  it('should navigate to question without closing Provenance Review Matrix accordion and scroll down', () => {
    const scrollSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollSpy;

    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    store.setActivePatternId('PT-04');
    store.toggleIntakeReview(true);
    const panel = createTriagePanel(store);

    expect(panel.querySelector('.provenance-review-matrix')).not.toBeNull();
    const relBtn = panel.querySelector('.btn-goto-rel[data-rel="describedby"]') as HTMLElement;
    expect(relBtn).not.toBeNull();

    relBtn.click();
    // Accordion must NOT close; showIntakeReview remains true
    expect(store.getState().ui.showIntakeReview).toBe(true);
    expect(panel.querySelector('.provenance-review-matrix')).not.toBeNull();
    expect(store.getState().ui.selectedNodeId).toBe('ghost-describedby');

    const questionCard = panel.querySelector('#active-question-card, .question-card') as HTMLElement;
    expect(questionCard).not.toBeNull();
    expect(questionCard.getAttribute('data-question-rel')).toBe('describedby');
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    // Also test clicking interactive row directly for cite-as
    const citeRow = panel.querySelector('.provenance-row-interactive[data-rel="cite-as"]') as HTMLElement;
    expect(citeRow).not.toBeNull();
    citeRow.click();

    expect(store.getState().ui.showIntakeReview).toBe(true);
    expect(store.getState().ui.selectedNodeId).toBe('ghost-cite-as');
    const updatedCard = panel.querySelector('#active-question-card, .question-card') as HTMLElement;
    expect(updatedCard.getAttribute('data-question-rel')).toBe('cite-as');
    expect(scrollSpy).toHaveBeenCalledTimes(2);
  });
});
