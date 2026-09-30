import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('CSS Token System & Anti-AI Auditing', () => {
  const css = readFileSync(resolve(__dirname, '../src/style.css'), 'utf-8');

  it('should define dual themes [data-theme="light"] and [data-theme="dark"]', () => {
    expect(css).toContain('[data-theme="light"]');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('--surface-canvas');
    expect(css).toContain('--clinical-crimson');
    expect(css).toContain('--clinical-emerald');
  });

  it('should not contain banned AI tells like glowing mint teal (#a7f3d0)', () => {
    expect(css).not.toContain('#a7f3d0');
  });

  it('should enforce tabular numbers on metrics', () => {
    expect(css).toContain('tabular-nums');
  });

  it('should ensure high readability for code and markdown in light mode', () => {
    // In light mode, code blocks must use light surface (#f8fafc) and dark text (#0f172a), not dark-on-dark
    expect(css).toContain('--surface-code: #f8fafc;');
    expect(css).toContain('--text-code: #0f172a;');
    expect(css).toContain('.code-block code');
    expect(css).toContain('.badge-ticket');
  });
});
