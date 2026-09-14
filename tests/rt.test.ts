import { describe, it, expect } from 'vitest';
import { RT_PATTERNS, getPatternById } from '../src/core/rt/patterns';
import { SAMPLE_PRESETS } from '../src/core/rt/presets';

describe('RT Pattern Model & Presets', () => {
  it('should define all 8 RT patterns from PT-01 to PT-08', () => {
    expect(RT_PATTERNS).toHaveLength(8);
    const pt01 = getPatternById('PT-01');
    expect(pt01).toBeDefined();
    expect(pt01?.roles).toContain('resource');
    expect(pt01?.roles).toContain('profile');
    expect(pt01?.requiredRelations).toContain('profile');
  });

  it('should include real-world sample presets', () => {
    expect(SAMPLE_PRESETS.length).toBeGreaterThanOrEqual(3);
    const arms = SAMPLE_PRESETS.find(p => p.id === 'arms-mbon');
    expect(arms).toBeDefined();
    expect(arms?.uris.resource).toBeDefined();
  });
});
