// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { AppStore } from '../src/core/state/store';
import { encodeSessionToFragment, decodeFragmentToState } from '../src/core/state/fragment';

describe('main.ts sync simulation', () => {
  it('updates window.location.hash via history.replaceState when store changes', async () => {
    const store = new AppStore();
    let isUpdatingFromHash = false;
    let debounceTimer: any = null;

    async function syncStateToUrl() {
      if (isUpdatingFromHash) return;
      const state = store.getState();
      if (state.seedUri || (state.links && state.links.length > 0)) {
        const fragment = await encodeSessionToFragment(state);
        if (window.location.hash !== fragment) {
          const newUrl = `${window.location.pathname}${window.location.search}${fragment}`;
          window.history.replaceState(null, '', newUrl);
        }
      }
    }

    store.subscribe(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(syncStateToUrl, 50);
    });

    store.setSeedUri('https://example.org/dataset');

    await new Promise(r => setTimeout(r, 100));

    expect(window.location.hash).toContain('s1=');
  });
});
