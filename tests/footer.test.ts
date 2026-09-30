// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { createFooter } from '../src/ui/components/footer';

describe('Drawer Footer Component', () => {
  let footerContainer: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    footerContainer = createFooter();
    document.body.appendChild(footerContainer);
  });

  it('should render the proximity trigger button and the drawer footer', () => {
    const triggerBtn = footerContainer.querySelector('#drawer-footer-peek-btn');
    const drawer = footerContainer.querySelector('#app-footer-drawer');

    expect(triggerBtn).not.toBeNull();
    expect(drawer).not.toBeNull();
    expect(triggerBtn?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should contain the app title, clinical emblem, VLIZ logo, and links', () => {
    const drawer = footerContainer.querySelector('#app-footer-drawer')!;
    
    // Check title & emblem
    expect(drawer.querySelector('.footer-brand-title')?.textContent).toBe('webmap-ER');
    expect(drawer.querySelector('.brand-emblem-small')).not.toBeNull();

    // Check VLIZ logo and links
    const vlizWebsiteLink = drawer.querySelector('a[href="https://www.vliz.be/en"]');
    const privacyLink = drawer.querySelector('a[href="https://www.vliz.be/en/privacy"]');
    
    expect(vlizWebsiteLink).not.toBeNull();
    expect(vlizWebsiteLink?.getAttribute('target')).toBe('_blank');
    expect(vlizWebsiteLink?.getAttribute('rel')).toContain('noopener');

    expect(privacyLink).not.toBeNull();
    expect(privacyLink?.getAttribute('target')).toBe('_blank');
    expect(privacyLink?.getAttribute('rel')).toContain('noopener');

    const vlizSvg = drawer.querySelector('.vliz-logo-svg');
    expect(vlizSvg).not.toBeNull();
    expect(vlizSvg?.querySelector('.vliz-letters')).not.toBeNull();
    expect(vlizSvg?.querySelectorAll('.vliz-swoosh').length).toBe(2);
    expect(drawer.textContent).toContain('© 2026 VLIZ.');
  });

  it('should adhere strictly to zero-emoji design mandate', () => {
    expect(footerContainer.innerHTML).not.toContain('⚓');
    expect(footerContainer.innerHTML).not.toContain('🌊');
    expect(footerContainer.innerHTML).not.toContain('🏥');
    expect(footerContainer.innerHTML).not.toContain('🛡️');
  });

  it('should toggle drawer open and closed when clicking trigger button', () => {
    const triggerBtn = footerContainer.querySelector('#drawer-footer-peek-btn') as HTMLButtonElement;
    expect(footerContainer.classList.contains('is-open')).toBe(false);

    triggerBtn.click();
    expect(footerContainer.classList.contains('is-open')).toBe(true);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');

    triggerBtn.click();
    expect(footerContainer.classList.contains('is-open')).toBe(false);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should close drawer when clicking collapse button', () => {
    const triggerBtn = footerContainer.querySelector('#drawer-footer-peek-btn') as HTMLButtonElement;
    const collapseBtn = footerContainer.querySelector('#drawer-collapse-btn') as HTMLButtonElement;

    triggerBtn.click();
    expect(footerContainer.classList.contains('is-open')).toBe(true);

    collapseBtn.click();
    expect(footerContainer.classList.contains('is-open')).toBe(false);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should activate proximity is-near class when mouse moves close to bottom center', () => {
    // Simulate window size
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

    // Far away: x=200, y=200
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
    expect(footerContainer.classList.contains('is-near')).toBe(false);

    // Near bottom center: x=600, y=770 (within 60px of bottom, near center)
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 600, clientY: 770 }));
    expect(footerContainer.classList.contains('is-near')).toBe(true);

    // Moves away again: x=600, y=400
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 600, clientY: 400 }));
    expect(footerContainer.classList.contains('is-near')).toBe(false);
  });
});
