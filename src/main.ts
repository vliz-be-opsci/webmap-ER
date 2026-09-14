import './style.css';
import { AppStore } from './core/state/store';
import { decodeStateFromFragment } from './core/state/fragment';
import { getInitialTheme } from './core/theme/theme';
import { initLayout } from './ui/layout';

async function bootstrap() {
  getInitialTheme();

  const root = document.getElementById('app');
  if (!root) return;

  let initialStore = new AppStore();

  if (window.location.hash) {
    const restored = await decodeStateFromFragment(window.location.hash);
    if (restored) {
      initialStore = new AppStore(restored);
    }
  }

  initLayout(root, initialStore);
}

bootstrap();
