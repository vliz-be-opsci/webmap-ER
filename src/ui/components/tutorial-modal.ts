export function createTutorialModal(onClose: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-header">
        <h2 style="font-size: 1.15rem; font-weight: 700;">Welcome to webmap-ER</h2>
        <button id="tutorial-close-btn" class="btn btn-icon" style="background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-primary);">✕</button>
      </div>
      <div class="modal-body tutorial-content" style="padding: 1.5rem; line-height: 1.6; font-size: 0.9rem; color: var(--text-primary);">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
          <span style="font-size: 2rem; color: var(--er-vital-red);">✚</span>
          <h3 style="font-size: 1.1rem; color: #f9fafb;">The Radical Transparency Emergency Room</h3>
        </div>
        <p style="margin-bottom: 1rem; color: var(--text-secondary);">
          Radical Transparency (RT) enables search engines, scientific aggregators (like EOSC and OpenAIRE), and AI agents to discover what standards, metadata, and persistent identifiers govern a resource <strong>without needing to parse unstructured HTML pages</strong>.
        </p>

        <h4 style="color: var(--er-vital-blue); margin-top: 1rem; margin-bottom: 0.25rem;">Step 1: Patient Triage & Extraction</h4>
        <p style="color: var(--text-secondary); margin-bottom: 0.75rem;">
          Enter any dataset or catalog URL, or choose a sample preset from the header. <code>wrx</code> inspects HTTP Link headers, linkset documents, and embedded metadata.
        </p>

        <h4 style="color: var(--er-vital-amber); margin-top: 1rem; margin-bottom: 0.25rem;">Step 2: Diagnosis & Guided Prescription</h4>
        <p style="color: var(--text-secondary); margin-bottom: 0.75rem;">
          If essential relations like <code>rel="profile"</code> or <code>rel="cite-as"</code> are missing, the ER Doctor asks you targeted questions to choose the right standards.
        </p>

        <h4 style="color: var(--er-vital-green); margin-top: 1rem; margin-bottom: 0.25rem;">Step 3: Systemic IT Remediation</h4>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
          Click <strong>Export & IT Ticket</strong> to copy an issue formulated for your sysadmin / DevOps team to deploy these headers across your entire webserver infrastructure.
        </p>

        <div style="text-align: right; margin-top: 1.5rem;">
          <button id="btn-got-it" class="btn btn-primary" style="padding: 0.5rem 1.25rem;">Got it, let's begin!</button>
        </div>
      </div>
    </div>
  `;

  modal.querySelector('#tutorial-close-btn')?.addEventListener('click', onClose);
  modal.querySelector('#btn-got-it')?.addEventListener('click', onClose);
  return modal;
}
