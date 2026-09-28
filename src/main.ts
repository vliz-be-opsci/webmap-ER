import './style.css';
import { AppStore } from './core/state/store';
import { decodeFragmentToState, encodeSessionToFragment } from './core/state/fragment';
import { getInitialTheme } from './core/theme/theme';
import { initLayout } from './ui/layout';

async function bootstrap() {
  getInitialTheme();

  const root = document.getElementById('app');
  if (!root) return;

  let initialStore = new AppStore();

  if (window.location.hash) {
    const restored = await decodeFragmentToState(window.location.hash);
    if (restored) {
      initialStore = new AppStore(restored);
    }
  }

  initLayout(root, initialStore);

  // Set up Live URL Fragment Synchronization (via history.replaceState)
  let isUpdatingFromHash = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function syncStateToUrl() {
    if (isUpdatingFromHash) return;
    try {
      const state = initialStore.getState();
      if (state.seedUri || (state.links && state.links.length > 0)) {
        const fragment = await encodeSessionToFragment(state);
        if (window.location.hash !== fragment) {
          const newUrl = `${window.location.pathname}${window.location.search}${fragment}`;
          window.history.replaceState(null, '', newUrl);
        }
      } else if (window.location.hash) {
        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(null, '', cleanUrl);
      }
    } catch (err) {
      console.warn('Failed to sync state to URL fragment', err);
    }
  }

  initialStore.subscribe(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(syncStateToUrl, 150);
  });

  // Dereference session if URL fragment changes dynamically
  window.addEventListener('hashchange', async () => {
    if (!window.location.hash) return;
    const restored = await decodeFragmentToState(window.location.hash);
    if (restored) {
      isUpdatingFromHash = true;
      initialStore.restoreSession(restored);
      isUpdatingFromHash = false;
    }
  });
}

bootstrap();
