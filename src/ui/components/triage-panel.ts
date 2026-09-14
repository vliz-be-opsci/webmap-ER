import { AppStore } from '../../core/state/store';
import { evaluateHealthAndGaps } from '../../core/triage/diagnostics';
import { generateTriageQuestions } from '../../core/triage/questions';
import { extractResourceLinks } from '../../core/wrx/extractor';
import { showToast } from './toast';
import {
  iconInfo,
  iconShieldCheck,
  iconChevronLeft,
  iconChevronRight,
  iconRotateCcw
} from '../icons';

export function createTriagePanel(store: AppStore): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'triage-panel';

  function render() {
    const state = store.getState();
    const report = evaluateHealthAndGaps(state.seedUri, state.links);
    const questions = generateTriageQuestions(report);
    const activeIdx = Math.min(state.ui.activeQuestionIndex, Math.max(0, questions.length - 1));
    const currentQ = questions[activeIdx];

    const statusClass = `status-${report.vitalStatus.toLowerCase()}`;
    const statusLabel = report.vitalStatus === 'HEALTHY' 
      ? 'VITAL CONFORMITY' 
      : report.vitalStatus === 'UNSTABLE' 
        ? 'UNSTABLE CONDITION' 
        : 'CRITICAL TRAUMA';

    const meterBg = report.vitalStatus === 'HEALTHY'
      ? 'var(--clinical-emerald)'
      : report.vitalStatus === 'UNSTABLE'
        ? 'var(--clinical-amber)'
        : 'var(--clinical-crimson)';

    panel.innerHTML = `
      <!-- Clinical Telemetry HUD -->
      <section class="telemetry-hud" aria-label="RT Health Diagnostic Telemetry">
        <div class="hud-top-row">
          <div class="hud-lead">
            <span class="hud-label">RT VITAL SIGNS SCORE</span>
            <div class="hud-score-display">
              <span class="hud-score-value tabular-numbers">${report.score}</span>
              <span class="hud-score-unit">%</span>
            </div>
          </div>
          <div class="hud-condition-badge ${statusClass}">
            <span class="status-pulse-dot"></span>
            <span>${statusLabel}</span>
          </div>
        </div>
        <div class="hud-progress-track">
          <div class="hud-meter-bar" style="width: ${Math.max(report.score, 4)}%; background: ${meterBg};"></div>
        </div>
        <div class="hud-secondary-strip">
          <div class="hud-meta-item">
            <span>DETECTED RELS:</span>
            <strong class="tabular-numbers">${report.presentRelations.length}</strong>
          </div>
          <div class="hud-meta-item">
            <span>UNRESOLVED GAPS:</span>
            <strong class="tabular-numbers">${report.gaps.length}</strong>
          </div>
          <div class="hud-meta-item">
            <span>STANDARD:</span>
            <strong>RFC 8288 / 9264</strong>
          </div>
        </div>
      </section>

      <!-- Seed Resource Input Bar -->
      <section class="seed-card" aria-label="Seed Resource Diagnostic Input">
        <div class="seed-header">
          <label for="seed-uri-input" class="hud-label" style="margin-bottom: 0;">TARGET SEED RESOURCE URI</label>
        </div>
        <div class="terminal-input-group">
          <span class="protocol-badge">HTTPS</span>
          <input 
            type="text" 
            id="seed-uri-input" 
            class="form-control-bare" 
            placeholder="https://example.org/dataset" 
            value="${state.seedUri}" 
            aria-label="Seed Resource URI"
          />
          <button id="btn-extract" class="btn btn-primary" style="border-radius: 0; padding: 0.5rem 1rem;">
            Diagnose (wrx)
          </button>
        </div>
      </section>

      <!-- Active Questionnaire or Healthy State -->
      ${currentQ ? `
        <div class="question-card severity-${currentQ.severity.toLowerCase()}">
          <div class="card-header-meta">
            <span class="card-step-badge">QUESTION ${activeIdx + 1} OF ${questions.length}</span>
            <span class="hud-condition-badge status-${currentQ.severity.toLowerCase()}">
              ${currentQ.severity} GAP
            </span>
          </div>
          <h3 class="card-title">${currentQ.title}</h3>
          <p class="card-prompt">${currentQ.prompt}</p>
          
          <div class="clinical-guidance-panel">
            <div class="guidance-icon">${iconInfo('', 18)}</div>
            <div class="guidance-body">
              <strong>Why This Matters:</strong> ${currentQ.didacticText}
            </div>
          </div>

          ${currentQ.quickOptions.length > 0 ? `
            <div class="prescription-options">
              <span class="hud-label">RECOMMENDED PRESCRIPTIONS</span>
              ${currentQ.quickOptions.map(opt => `
                <button class="btn-prescription-opt" data-uri="${opt.uri}">
                  <span class="prescription-opt-title">${opt.label}</span>
                  <span class="prescription-opt-uri">${opt.uri}</span>
                  ${opt.description ? `<span class="prescription-opt-desc">${opt.description}</span>` : ''}
                </button>
              `).join('')}
            </div>
          ` : ''}

          <div class="terminal-input-group" style="margin-top: 1rem;">
            <input 
              type="text" 
              id="custom-uri-input" 
              class="form-control-bare" 
              placeholder="${currentQ.inputPlaceholder}" 
              aria-label="Custom target URI"
            />
            <button id="btn-save-answer" class="btn btn-primary" style="border-radius: 0; padding: 0.5rem 1rem;">
              Prescribe
            </button>
          </div>

          <div class="card-nav" style="display: flex; justify-content: space-between; margin-top: 1.25rem;">
            <button id="btn-prev-q" class="btn btn-secondary" ${activeIdx === 0 ? 'disabled' : ''}>
              ${iconChevronLeft('', 14)}
              <span>Previous</span>
            </button>
            <button id="btn-undo" class="btn btn-secondary" ${state.history.length === 0 ? 'disabled' : ''}>
              ${iconRotateCcw('', 14)}
              <span>Undo</span>
            </button>
            <button id="btn-next-q" class="btn btn-secondary" ${activeIdx >= questions.length - 1 ? 'disabled' : ''}>
              <span>Next</span>
              ${iconChevronRight('', 14)}
            </button>
          </div>
        </div>
      ` : `
        <div class="healthy-state-card" style="text-align: center; padding: 2.5rem 1.5rem;">
          <div style="color: var(--clinical-emerald); margin-bottom: 0.75rem;">
            ${iconShieldCheck('', 44)}
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
            All Vital Relations Prescribed!
          </h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem; max-width: 440px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
            Your digital asset conforms to basic Radical Transparency specifications. Open the Export dialog to inspect generated HTTP Link headers, sitemaps, and the systemic IT ticket.
          </p>
        </div>
      `}
    `;

    // Wire events
    panel.querySelector('#btn-extract')?.addEventListener('click', async () => {
      const input = (panel.querySelector('#seed-uri-input') as HTMLInputElement)?.value.trim();
      if (!input) return;
      store.setSeedUri(input);
      const res = await extractResourceLinks(input);
      if (res.corsBlocked) {
        showToast(
          'CORS Inspection Notice',
          'Endpoint blocked direct browser inspection (missing CORS headers). Proceeding with manual ER triage.',
          'warning',
          5000
        );
      } else {
        store.setLinks(res.links);
        showToast('Diagnosis Complete', `Extracted ${res.links.length} relations via wrx.`, 'success');
      }
    });

    panel.querySelectorAll('.btn-prescription-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const uri = btn.getAttribute('data-uri');
        if (uri && currentQ) {
          store.answerQuestion(currentQ.id, currentQ.rel, uri);
          showToast('Prescription Saved', `Assigned ${currentQ.rel} -> ${uri}`, 'info');
          if (activeIdx < questions.length - 1) {
            store.setQuestionIndex(activeIdx + 1);
          }
        }
      });
    });

    panel.querySelector('#btn-save-answer')?.addEventListener('click', () => {
      const val = (panel.querySelector('#custom-uri-input') as HTMLInputElement)?.value.trim();
      if (val && currentQ) {
        store.answerQuestion(currentQ.id, currentQ.rel, val);
        showToast('Prescription Saved', `Assigned ${currentQ.rel} -> ${val}`, 'info');
        if (activeIdx < questions.length - 1) {
          store.setQuestionIndex(activeIdx + 1);
        }
      }
    });

    panel.querySelector('#btn-prev-q')?.addEventListener('click', () => store.setQuestionIndex(activeIdx - 1));
    panel.querySelector('#btn-next-q')?.addEventListener('click', () => store.setQuestionIndex(activeIdx + 1));
    panel.querySelector('#btn-undo')?.addEventListener('click', () => {
      store.undo();
      showToast('Action Reverted', 'Reverted previous triage answer.', 'info');
    });
  }

  store.subscribe(render);
  render();
  return panel;
}
