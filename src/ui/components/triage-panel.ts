import { AppStore } from '../../core/state/store';
import { evaluateHealthAndGaps } from '../../core/triage/diagnostics';
import { generateTriageQuestions } from '../../core/triage/questions';
import { extractResourceLinks } from '../../core/wrx/extractor';

export function createTriagePanel(store: AppStore): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'triage-panel';

  function render() {
    const state = store.getState();
    const report = evaluateHealthAndGaps(state.seedUri, state.links);
    const questions = generateTriageQuestions(report);
    const activeIdx = Math.min(state.ui.activeQuestionIndex, Math.max(0, questions.length - 1));
    const currentQ = questions[activeIdx];

    panel.innerHTML = `
      <div class="vital-signs-bar">
        <div class="vital-metric">
          <span class="metric-label">RT HEALTH SCORE</span>
          <span class="metric-value vital-${report.vitalStatus.toLowerCase()}">${report.score}%</span>
        </div>
        <div class="vital-metric">
          <span class="metric-label">STATUS</span>
          <span class="metric-badge badge-${report.vitalStatus.toLowerCase()}">${report.vitalStatus}</span>
        </div>
        <div class="vital-metric">
          <span class="metric-label">DETECTED RELS</span>
          <span class="metric-value">${report.presentRelations.length}</span>
        </div>
      </div>

      <div class="seed-input-card">
        <label class="form-label" style="font-weight: 600; font-size: 0.85rem;">Seed Resource URI</label>
        <div class="input-row">
          <input type="text" id="seed-uri-input" class="form-control" placeholder="https://example.org/dataset" value="${state.seedUri}" />
          <button id="btn-extract" class="btn btn-primary">Diagnose (wrx)</button>
        </div>
      </div>

      ${currentQ ? `
        <div class="question-card severity-${currentQ.severity.toLowerCase()}">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <span class="card-step" style="font-size: 0.8rem; color: var(--text-secondary);">Question ${activeIdx + 1} of ${questions.length}</span>
            <span class="severity-tag badge-${currentQ.severity.toLowerCase()}" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: rgba(239, 68, 68, 0.2); color: #f87171;">${currentQ.severity} GAP</span>
          </div>
          <h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 0.5rem;">${currentQ.title}</h3>
          <p class="card-prompt" style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 0.75rem;">${currentQ.prompt}</p>
          
          <div class="didactic-pill">
            <span class="didactic-icon">💡</span>
            <span class="didactic-text"><strong>Why This Matters:</strong> ${currentQ.didacticText}</span>
          </div>

          ${currentQ.quickOptions.length > 0 ? `
            <div class="quick-options">
              <span style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Recommended Prescriptions:</span>
              ${currentQ.quickOptions.map(opt => `
                <button class="btn btn-quick-opt" data-uri="${opt.uri}">
                  <div style="font-weight: 600;">${opt.label}</div>
                  ${opt.description ? `<small style="color: var(--text-secondary); font-size: 0.75rem;">${opt.description}</small>` : ''}
                </button>
              `).join('')}
            </div>
          ` : ''}

          <div class="custom-input-group" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <input type="text" id="custom-uri-input" class="form-control" placeholder="${currentQ.inputPlaceholder}" />
            <button id="btn-save-answer" class="btn btn-primary">Prescribe</button>
          </div>

          <div class="card-nav" style="display: flex; justify-content: space-between; margin-top: 1.25rem;">
            <button id="btn-prev-q" class="btn btn-secondary" ${activeIdx === 0 ? 'disabled' : ''}>← Previous</button>
            <button id="btn-undo" class="btn btn-secondary" ${state.history.length === 0 ? 'disabled' : ''}>↶ Undo</button>
            <button id="btn-next-q" class="btn btn-secondary" ${activeIdx >= questions.length - 1 ? 'disabled' : ''}>Next →</button>
          </div>
        </div>
      ` : `
        <div class="healthy-state-card" style="text-align: center; padding: 2rem;">
          <span class="healthy-icon" style="font-size: 2.5rem;">🎉</span>
          <h3 style="margin-top: 0.5rem;">All Vital Relations Prescribed!</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">Your resource conforms to basic Radical Transparency standards. Open the Export dialog to grab your HTTP headers, sitemap, and IT ticket.</p>
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
        alert('Notice: Endpoint blocked direct browser inspection (missing CORS headers). Proceeding with manual ER triage.');
      } else {
        store.setLinks(res.links);
      }
    });

    panel.querySelectorAll('.btn-quick-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const uri = btn.getAttribute('data-uri');
        if (uri && currentQ) {
          store.answerQuestion(currentQ.id, currentQ.rel, uri);
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
        if (activeIdx < questions.length - 1) {
          store.setQuestionIndex(activeIdx + 1);
        }
      }
    });

    panel.querySelector('#btn-prev-q')?.addEventListener('click', () => store.setQuestionIndex(activeIdx - 1));
    panel.querySelector('#btn-next-q')?.addEventListener('click', () => store.setQuestionIndex(activeIdx + 1));
    panel.querySelector('#btn-undo')?.addEventListener('click', () => store.undo());
  }

  store.subscribe(render);
  render();
  return panel;
}
