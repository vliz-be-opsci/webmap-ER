import { AppStore } from '../../core/state/store';
import { SAMPLE_PRESETS } from '../../core/rt/presets';
import { encodeStateToFragment } from '../../core/state/fragment';

export function createHeader(store: AppStore, onOpenTutorial: () => void, onOpenExport: () => void): HTMLElement {
  const header = document.createElement('header');
  header.className = 'app-header';

  header.innerHTML = `
    <div class="header-brand">
      <span class="er-cross">✚</span>
      <span class="brand-title">webmap-ER</span>
      <span class="badge-tag">Radical Transparency Triage</span>
    </div>
    <div class="header-actions">
      <select id="preset-select" class="btn btn-select">
        <option value="">-- Load Sample Preset --</option>
        ${SAMPLE_PRESETS.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </select>
      <div class="view-toggles">
        <button id="btn-view-triage" class="btn btn-toggle" title="Extended Questionnaire">📋 Questionnaire</button>
        <button id="btn-view-balanced" class="btn btn-toggle active" title="Balanced View">⚖️ Balanced</button>
        <button id="btn-view-graph" class="btn btn-toggle" title="Extended Graph">🕸️ Graph</button>
      </div>
      <button id="btn-export" class="btn btn-primary">Export & IT Ticket</button>
      <button id="btn-share" class="btn btn-secondary">🔗 Copy Permalink</button>
      <button id="btn-tutorial" class="btn btn-icon" title="Onboarding Tutorial">❓</button>
    </div>
  `;

  // Preset selector
  header.querySelector('#preset-select')?.addEventListener('change', (e) => {
    const id = (e.target as HTMLSelectElement).value;
    const preset = SAMPLE_PRESETS.find(p => p.id === id);
    if (preset) {
      store.setSeedUri(preset.uris.resource);
      const links = Object.entries(preset.uris)
        .filter(([key]) => key !== 'resource')
        .map(([key, uri]) => ({
          target: uri,
          rel: key === 'metadata' ? 'describedby' : key === 'cite_as' ? 'cite-as' : key,
          source: 'link-header' as const
        }));
      store.setLinks(links);
    }
  });

  // View toggles
  header.querySelector('#btn-view-triage')?.addEventListener('click', () => {
    store.setViewMode('extended-triage');
    updateActiveToggle('btn-view-triage');
  });
  header.querySelector('#btn-view-balanced')?.addEventListener('click', () => {
    store.setViewMode('balanced');
    updateActiveToggle('btn-view-balanced');
  });
  header.querySelector('#btn-view-graph')?.addEventListener('click', () => {
    store.setViewMode('extended-graph');
    updateActiveToggle('btn-view-graph');
  });

  function updateActiveToggle(btnId: string) {
    header.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
    header.querySelector(`#${btnId}`)?.classList.add('active');
  }

  // Export and share
  header.querySelector('#btn-export')?.addEventListener('click', onOpenExport);
  header.querySelector('#btn-tutorial')?.addEventListener('click', onOpenTutorial);
  header.querySelector('#btn-share')?.addEventListener('click', async () => {
    const hash = await encodeStateToFragment(store.getState());
    window.location.hash = hash;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    alert('Shareable permalink copied to clipboard!');
  });

  return header;
}
