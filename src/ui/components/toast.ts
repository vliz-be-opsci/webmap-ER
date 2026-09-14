import { iconInfo, iconShieldCheck, iconClose } from '../icons';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

let containerEl: HTMLElement | null = null;

export function createToastContainer(): HTMLElement {
  let existing = document.getElementById('toast-root');
  if (existing) {
    containerEl = existing;
    return existing;
  }

  const container = document.createElement('div');
  container.id = 'toast-root';
  container.className = 'clinical-toast-container';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'true');
  containerEl = container;
  return container;
}

export function showToast(
  title: string,
  description?: string,
  type: ToastType = 'info',
  duration = 3500
): HTMLElement {
  if (!containerEl || !document.body.contains(containerEl)) {
    containerEl = createToastContainer();
    document.body.appendChild(containerEl);
  }

  const toast = document.createElement('div');
  toast.className = `clinical-toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const iconSvg = type === 'success' 
    ? iconShieldCheck('toast-icon', 20)
    : iconInfo('toast-icon', 20);

  toast.innerHTML = `
    <div class="toast-icon-wrap">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${description ? `<div class="toast-desc">${description}</div>` : ''}
    </div>
    <button class="toast-dismiss" aria-label="Dismiss notification">
      ${iconClose('', 16)}
    </button>
  `;

  let timeoutId: number | null = null;

  function dismiss() {
    if (timeoutId) clearTimeout(timeoutId);
    toast.remove();
  }

  toast.querySelector('.toast-dismiss')?.addEventListener('click', dismiss);

  if (duration > 0) {
    timeoutId = window.setTimeout(dismiss, duration);
  }

  containerEl.appendChild(toast);
  return toast;
}
