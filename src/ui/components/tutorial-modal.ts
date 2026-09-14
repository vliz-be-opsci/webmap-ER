import { iconCross, iconClose, iconListChecks, iconInfo, iconFileCode } from '../icons';

export function createTutorialModal(onClose: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" style="max-width: 680px;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.625rem;">
          <div class="brand-emblem" style="width: 28px; height: 28px;">
            ${iconCross('brand-cross', 18)}
          </div>
          <h2 id="tutorial-title" style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
            Radical Transparency Clinical Triage
          </h2>
        </div>
        <button id="tutorial-close-btn" class="btn btn-icon" aria-label="Close tutorial">
          ${iconClose('', 18)}
        </button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; line-height: 1.55; font-size: 0.875rem; color: var(--text-primary);">
        <p style="margin-bottom: 1.25rem; color: var(--text-secondary);">
          Radical Transparency (RT) enables search engines, scientific harvesters (EOSC, OpenAIRE), and AI agents to discover what standards, metadata, and persistent identifiers govern a resource <strong>without needing to parse unstructured HTML pages</strong>.
        </p>

        <div class="tutorial-steps" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
          <div style="display: flex; gap: 0.75rem; padding: 0.875rem; background: var(--surface-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="color: var(--clinical-cobalt); flex-shrink: 0; margin-top: 2px;">
              ${iconListChecks('', 20)}
            </div>
            <div>
              <h4 style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                Phase 1: Patient Triage & Extraction
              </h4>
              <p style="font-size: 0.8125rem; color: var(--text-secondary);">
                Enter any digital asset URL or pick a sample dataset from the header. <code>wrx</code> automatically crawls HTTP Link headers, linkset documents, and alternate formats.
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; padding: 0.875rem; background: var(--surface-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="color: var(--clinical-amber); flex-shrink: 0; margin-top: 2px;">
              ${iconInfo('', 20)}
            </div>
            <div>
              <h4 style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                Phase 2: Diagnosis & Guided Prescription
              </h4>
              <p style="font-size: 0.8125rem; color: var(--text-secondary);">
                The Diagnostic Engine assesses adherence to Radical Transparency patterns (PT-01 to PT-08). If vital relations like <code>rel="profile"</code> or <code>rel="cite-as"</code> are absent, answer guided triage questions to prescribe appropriate standards.
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; padding: 0.875rem; background: var(--surface-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div style="color: var(--clinical-emerald); flex-shrink: 0; margin-top: 2px;">
              ${iconFileCode('', 20)}
            </div>
            <div>
              <h4 style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                Phase 3: Systemic IT Remediation
              </h4>
              <p style="font-size: 0.8125rem; color: var(--text-secondary);">
                Click <strong>Export & IT Ticket</strong> to copy ready-to-deploy reverse-proxy configs (Nginx/Apache), XML sitemaps with <code>&lt;xhtml:link&gt;</code>, and a comprehensive systemic issue ticket for infrastructure teams.
              </p>
            </div>
          </div>
        </div>

        <div style="text-align: right;">
          <button id="btn-got-it" class="btn btn-primary" style="padding: 0.5rem 1.25rem;">
            Begin Triage
          </button>
        </div>
      </div>
    </div>
  `;

  modal.querySelector('#tutorial-close-btn')?.addEventListener('click', onClose);
  modal.querySelector('#btn-got-it')?.addEventListener('click', onClose);
  return modal;
}
