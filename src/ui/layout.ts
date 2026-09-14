import { AppStore } from '../core/state/store';
import { createHeader } from './components/header';
import { createTriagePanel } from './components/triage-panel';
import { createGraphPanel } from './components/graph-panel';
import { createExportModal } from './components/export-modal';
import { createSpotlightTour } from './components/spotlight-tour';
import { createToastContainer, showToast } from './components/toast';
import { SAMPLE_PRESETS } from '../core/rt/presets';

export function initLayout(container: HTMLElement, store: AppStore): void {
  container.innerHTML = '';
  container.appendChild(createToastContainer());

  const header = createHeader(
    store,
    () => openModal(createSpotlightTour(
      () => closeModal(),
      () => {
        const preset = SAMPLE_PRESETS[0];
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
          showToast('Preset Jumpstart', `Launched ${preset.name} into clinical triage.`, 'success');
        }
      }
    )),
    () => openModal(createExportModal(store, () => closeModal()))
  );

  const splitContainer = document.createElement('main');
  splitContainer.className = 'split-container mode-balanced';

  const leftPane = createTriagePanel(store);
  const rightPane = createGraphPanel(store);

  splitContainer.appendChild(leftPane);
  splitContainer.appendChild(rightPane);

  container.appendChild(header);
  container.appendChild(splitContainer);

  // Sync view modes
  store.subscribe(state => {
    splitContainer.className = `split-container mode-${state.ui.viewMode}`;
  });

  function openModal(modalEl: HTMLElement) {
    closeModal();
    modalEl.id = 'active-modal';
    container.appendChild(modalEl);
  }

  function closeModal() {
    container.querySelector('#active-modal')?.remove();
  }
}
