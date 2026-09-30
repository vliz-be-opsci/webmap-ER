import { describe, it, expect } from 'vitest';
import * as icons from '../src/ui/icons';

describe('SVG Iconography Registry', () => {
  it('should export all required clinical and navigation icons as valid SVG strings', () => {
    const requiredIcons = [
      'iconCross', 'iconListChecks', 'iconColumns2', 'iconNetwork',
      'iconLink', 'iconFileCode', 'iconHelpCircle', 'iconInfo',
      'iconRotateCcw', 'iconChevronLeft', 'iconChevronRight',
      'iconShieldCheck', 'iconSun', 'iconMoon', 'iconCopy',
      'iconCheck', 'iconClose'
    ];

    requiredIcons.forEach(name => {
      const fn = (icons as any)[name];
      expect(typeof fn).toBe('function');
      const svg = fn();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('stroke="currentColor"');
    });
  });

  it('should support custom CSS classes', () => {
    const svg = icons.iconCross('custom-class');
    expect(svg).toContain('class="custom-class"');
  });
});
