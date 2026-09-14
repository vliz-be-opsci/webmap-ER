// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { showToast, createToastContainer } from '../src/ui/components/toast';

describe('Clinical Toast Manager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const container = createToastContainer();
    document.body.appendChild(container);
  });

  it('should render a toast item when showToast is dispatched', () => {
    showToast('Diagnostic Complete', 'Score updated to 85%', 'success');
    const toast = document.querySelector('.clinical-toast');
    expect(toast).toBeDefined();
    expect(toast?.textContent).toContain('Diagnostic Complete');
    expect(toast?.textContent).toContain('Score updated to 85%');
    expect(toast?.classList.contains('toast-success')).toBe(true);
  });

  it('should support manual dismissal of toast', () => {
    showToast('Warning', 'Check CORS headers', 'warning');
    const dismissBtn = document.querySelector('.toast-dismiss') as HTMLButtonElement;
    expect(dismissBtn).toBeDefined();
    dismissBtn.click();
    expect(document.querySelector('.clinical-toast')).toBeNull();
  });
});
