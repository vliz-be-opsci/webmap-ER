import { AppStore } from '../../core/state/store';
import { evaluateHealthAndGaps } from '../../core/triage/diagnostics';
import { generateHttpHeaders } from '../../core/export/link-headers';
import { generateSitemapXml } from '../../core/export/sitemap';
import { generateRtTestYaml } from '../../core/export/yaml-test';
import { generateSystemicItTicket } from '../../core/export/it-ticket';

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
    <div class="modal-dialog">
      <div class="modal-header">
        <h2 style="font-size: 1.15rem; font-weight: 700;">Remediation Artifacts & Systemic IT Ticket</h2>
        <button id="modal-close-btn" class="btn btn-icon" style="background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-primary);">✕</button>
      </div>
      <div class="modal-tabs" style="display: flex; border-bottom: 1px solid var(--border-color); background: var(--bg-primary);">
        <button class="tab-btn active" data-target="#tab-ticket" style="padding: 0.75rem 1rem; border: none; background: transparent; color: var(--text-primary); cursor: pointer; border-bottom: 2px solid var(--er-vital-blue); font-weight: 600;">IT Ticket (Systemic)</button>
        <button class="tab-btn" data-target="#tab-headers" style="padding: 0.75rem 1rem; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; font-weight: 500;">HTTP Link Headers</button>
        <button class="tab-btn" data-target="#tab-sitemap" style="padding: 0.75rem 1rem; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; font-weight: 500;">sitemap.xml</button>
        <button class="tab-btn" data-target="#tab-yaml" style="padding: 0.75rem 1rem; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; font-weight: 500;">rt-test YAML</button>
      </div>
      <div class="modal-body" style="padding: 1.5rem; overflow-y: auto; max-height: 60vh;">
        <div id="tab-ticket" class="tab-pane active">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">This issue is formatted to address server-wide policy across all published dataset endpoints rather than a single page.</p>
          <pre class="code-block"><code>${escapeHtml(itTicket)}</code></pre>
          <button class="btn btn-primary btn-copy" data-text="${encodeURIComponent(itTicket)}">📋 Copy IT Ticket Markdown</button>
        </div>
        <div id="tab-headers" class="tab-pane" style="display: none;">
          <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem;">Raw RFC 8288 Header</h4>
          <pre class="code-block"><code>${escapeHtml(headers.raw || 'No links yet.')}</code></pre>
          <h4 style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 0.9rem;">Apache Configuration</h4>
          <pre class="code-block"><code>${escapeHtml(headers.apache || '# No links')}</code></pre>
          <h4 style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 0.9rem;">Nginx Configuration</h4>
          <pre class="code-block"><code>${escapeHtml(headers.nginx || '# No links')}</code></pre>
          <button class="btn btn-primary btn-copy" data-text="${encodeURIComponent(headers.raw)}">📋 Copy Raw Header</button>
        </div>
        <div id="tab-sitemap" class="tab-pane" style="display: none;">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">Sitemap conforming to PT-06 Hostwide Discovery with embedded &lt;xhtml:link&gt; signposting.</p>
          <pre class="code-block"><code>${escapeHtml(sitemap)}</code></pre>
          <button class="btn btn-primary btn-copy" data-text="${encodeURIComponent(sitemap)}">📋 Copy sitemap.xml</button>
        </div>
        <div id="tab-yaml" class="tab-pane" style="display: none;">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">Drop-in YAML test suite for the GRMP containerized rt-test runner.</p>
          <pre class="code-block"><code>${escapeHtml(yaml)}</code></pre>
          <button class="btn btn-primary btn-copy" data-text="${encodeURIComponent(yaml)}">📋 Copy rt-test.yaml</button>
        </div>
      </div>
    </div>
  `;

  modal.querySelector('#modal-close-btn')?.addEventListener('click', onClose);
  modal.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      modal.querySelectorAll('.tab-btn').forEach(b => {
        (b as HTMLElement).style.borderBottom = 'none';
        (b as HTMLElement).style.color = 'var(--text-secondary)';
      });
      modal.querySelectorAll('.tab-pane').forEach(p => ((p as HTMLElement).style.display = 'none'));
      
      const target = (e.currentTarget as HTMLElement).getAttribute('data-target');
      (e.currentTarget as HTMLElement).style.borderBottom = '2px solid var(--er-vital-blue)';
      (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
      if (target) {
        const pane = modal.querySelector(target) as HTMLElement;
        if (pane) pane.style.display = 'block';
      }
    });
  });

  modal.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = decodeURIComponent((e.currentTarget as HTMLElement).getAttribute('data-text') || '');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
      alert('Copied to clipboard!');
    });
  });

  return modal;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
