import { AppStore } from '../../core/state/store';
import { evaluateHealthAndGaps } from '../../core/triage/diagnostics';
import { generateHttpHeaders } from '../../core/export/link-headers';
import { generateSitemapXml } from '../../core/export/sitemap';
import { generateRtTestYaml } from '../../core/export/yaml-test';
import { generateSystemicItTicket } from '../../core/export/it-ticket';
import { iconCopy, iconClose } from '../icons';
import { showToast } from './toast';

export function createExportModal(store: AppStore, onClose: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  const state = store.getState();
  const report = evaluateHealthAndGaps(state.seedUri, state.links);
  const headers = generateHttpHeaders(state.links);
  const sitemap = generateSitemapXml(state.seedUri, state.links);
  const yaml = generateRtTestYaml(state.seedUri, state.links);
  const itTicket = generateSystemicItTicket(report, state.links);

  modal.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <h2 id="modal-title" style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
          Remediation Artifacts & Systemic IT Ticket
        </h2>
        <button id="modal-close-btn" class="btn btn-icon" aria-label="Close dialog">
          ${iconClose('', 18)}
        </button>
      </div>

      <div class="modal-tabs" role="tablist" aria-label="Export Formats">
        <button class="tab-btn is-active" role="tab" id="tab-btn-ticket" aria-controls="tab-ticket" aria-selected="true" data-target="#tab-ticket">
          IT Ticket (Systemic)
        </button>
        <button class="tab-btn" role="tab" id="tab-btn-headers" aria-controls="tab-headers" aria-selected="false" data-target="#tab-headers">
          HTTP Link Headers
        </button>
        <button class="tab-btn" role="tab" id="tab-btn-sitemap" aria-controls="tab-sitemap" aria-selected="false" data-target="#tab-sitemap">
          sitemap.xml
        </button>
        <button class="tab-btn" role="tab" id="tab-btn-yaml" aria-controls="tab-yaml" aria-selected="false" data-target="#tab-yaml">
          rt-test YAML
        </button>
      </div>

      <div class="modal-body">
        <div id="tab-ticket" class="tab-pane active" role="tabpanel" aria-labelledby="tab-btn-ticket">
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
            This issue is formulated to address server-wide policy across all published dataset endpoints rather than a single page.
          </p>
          <pre class="code-block"><code>${escapeHtml(itTicket)}</code></pre>
          <button class="btn btn-primary btn-copy" data-text="${encodeURIComponent(itTicket)}">
            ${iconCopy('', 15)}
            <span>Copy IT Ticket Markdown</span>
          </button>
        </div>

        <div id="tab-headers" class="tab-pane" role="tabpanel" aria-labelledby="tab-btn-headers" style="display: none;">
          <h4 style="margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-primary);">Raw RFC 8288 Header</h4>
          <pre class="code-block"><code>${escapeHtml(headers.raw || 'No links yet.')}</code></pre>
          
          <h4 style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-primary);">Apache Configuration</h4>
          <pre class="code-block"><code>${escapeHtml(headers.apache || '# No links')}</code></pre>
          
          <h4 style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-primary);">Nginx Configuration</h4>
          <pre class="code-block"><code>${escapeHtml(headers.nginx || '# No links')}</code></pre>
          
          <button class="btn btn-primary btn-copy" data-text="${encodeURIComponent(headers.raw)}">
            ${iconCopy('', 15)}
            <span>Copy Raw Header</span>
          </button>
        </div>

        <div id="tab-sitemap" class="tab-pane" role="tabpanel" aria-labelledby="tab-btn-sitemap" style="display: none;">
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
            Sitemap conforming to PT-06 Hostwide Discovery with embedded &lt;xhtml:link&gt; signposting.
          </p>
          <pre class="code-block"><code>${escapeHtml(sitemap)}</code></pre>
          <button class="btn btn-primary btn-copy" data-text="${encodeURIComponent(sitemap)}">
            ${iconCopy('', 15)}
            <span>Copy sitemap.xml</span>
          </button>
        </div>

        <div id="tab-yaml" class="tab-pane" role="tabpanel" aria-labelledby="tab-btn-yaml" style="display: none;">
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
            Drop-in YAML test suite for the GRMP containerized rt-test runner.
          </p>
          <pre class="code-block"><code>${escapeHtml(yaml)}</code></pre>
          <button class="btn btn-primary btn-copy" data-text="${encodeURIComponent(yaml)}">
            ${iconCopy('', 15)}
            <span>Copy rt-test.yaml</span>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.querySelector('#modal-close-btn')?.addEventListener('click', onClose);

  modal.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      modal.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      modal.querySelectorAll('.tab-pane').forEach(p => ((p as HTMLElement).style.display = 'none'));
      
      const current = e.currentTarget as HTMLElement;
      current.classList.add('is-active');
      current.setAttribute('aria-selected', 'true');
      
      const target = current.getAttribute('data-target');
      if (target) {
        const pane = modal.querySelector(target) as HTMLElement;
        if (pane) pane.style.display = 'block';
      }
    });
  });

  modal.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const text = decodeURIComponent((e.currentTarget as HTMLElement).getAttribute('data-text') || '');
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(text);
        } catch {}
      }
      showToast('Copied to Clipboard', 'Remediation snippet ready to deploy.', 'success');
    });
  });

  return modal;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
