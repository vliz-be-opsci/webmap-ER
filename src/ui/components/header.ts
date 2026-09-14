import { AppStore } from '../../core/state/store';
import { SAMPLE_PRESETS } from '../../core/rt/presets';
import { encodeStateToFragment } from '../../core/state/fragment';
import { toggleTheme, subscribeTheme } from '../../core/theme/theme';
import { showToast } from './toast';
import {
  iconCross,
  iconListChecks,
  iconColumns2,
  iconNetwork,
  iconLink,
  iconFileCode,
  iconHelpCircle,
  iconSun,
  iconMoon
} from '../icons';

export function createHeader(store: AppStore, onOpenTutorial: () => void, onOpenExport: () => void): HTMLElement {
  const header = document.createElement('header');
  header.className = 'app-header';

  function getThemeIcon(): string {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? iconSun('theme-icon', 16) : iconMoon('theme-icon', 16);
  }

  header.innerHTML = `
    <div class="header-brand">
      <div class="brand-emblem" title="Radical Transparency Emergency Room">
        ${iconCross('brand-cross', 20)}
      </div>
      <span class="brand-title">webmap-ER</span>
      <span class="badge-tag">Radical Transparency Triage</span>
    </div>
    <div class="header-actions">
      <select id="preset-select" class="btn btn-select" aria-label="Load Sample Preset">
        <option value="">-- Load Sample Preset --</option>
        ${SAMPLE_PRESETS.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </select>
      <div class="view-toggles" role="group" aria-label="Layout View Modes">
        <button id="btn-view-triage" class="btn-segment" title="Extended Questionnaire">
          ${iconListChecks('', 15)}
          <span>Questionnaire</span>
        </button>
        <button id="btn-view-balanced" class="btn-segment active" title="Balanced View">
          ${iconColumns2('', 15)}
          <span>Balanced</span>
        </button>
        <button id="btn-view-graph" class="btn-segment" title="Extended Graph">
          ${iconNetwork('', 15)}
          <span>Graph</span>
        </button>
      </div>
      <button id="btn-export" class="btn btn-primary" title="Export Remediations and Systemic IT Ticket">
        ${iconFileCode('', 15)}
        <span>Export & IT Ticket</span>
      </button>
      <button id="btn-share" class="btn btn-secondary" title="Copy Shareable Permalink">
        ${iconLink('', 15)}
        <span>Copy Permalink</span>
      </button>
      <button id="btn-theme-toggle" class="btn btn-icon" title="Toggle Light / Dark Theme" aria-label="Toggle theme">
        ${getThemeIcon()}
      </button>
      <button id="btn-tutorial" class="btn btn-icon" title="Onboarding Tutorial" aria-label="Open onboarding tutorial">
        ${iconHelpCircle('', 16)}
      </button>
    </div>
  `;

  // Update theme toggle icon on theme change
  subscribeTheme(() => {
    const themeBtn = header.querySelector('#btn-theme-toggle');
    if (themeBtn) {
      themeBtn.innerHTML = getThemeIcon();
    }
  });

  header.querySelector('#btn-theme-toggle')?.addEventListener('click', () => {
    toggleTheme();
  });

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
      showToast('Preset Loaded', `Loaded ${preset.name}`, 'info');
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
    header.querySelectorAll('.btn-segment').forEach(b => b.classList.remove('active'));
    header.querySelector(`#${btnId}`)?.classList.add('active');
  }

  // Export and share
  header.querySelector('#btn-export')?.addEventListener('click', onOpenExport);
  header.querySelector('#btn-tutorial')?.addEventListener('click', onOpenTutorial);
  header.querySelector('#btn-share')?.addEventListener('click', async () => {
    const hash = await encodeStateToFragment(store.getState());
    window.location.hash = hash;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {}
    }
    showToast('Permalink Copied', 'State URL copied to clipboard.', 'success');
  });

  return header;
}
