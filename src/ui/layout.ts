import { AppStore } from '../core/state/store';
import { createHeader } from './components/header';
import { createTriagePanel } from './components/triage-panel';
import { createGraphPanel } from './components/graph-panel';
import { createExportModal } from './components/export-modal';
import { createTutorialModal } from './components/tutorial-modal';
import { createToastContainer } from './components/toast';

export function initLayout(container: HTMLElement, store: AppStore): void {
  container.innerHTML = '';
  container.appendChild(createToastContainer());

  const header = createHeader(
    store,
    () => openModal(createTutorialModal(() => closeModal())),
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
