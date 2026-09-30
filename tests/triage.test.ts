import { describe, it, expect } from 'vitest';
import { evaluateHealthAndGaps, evaluatePatternScore } from '../src/core/triage/diagnostics';
import { generateTriageQuestions } from '../src/core/triage/questions';

describe('Didactic Triage Engine', () => {
  it('should diagnose missing profile and cite-as as critical/warning gaps in global report', () => {
    const report = evaluateHealthAndGaps('https://example.org/data', [
      { target: 'https://example.org/meta.jsonld', rel: 'describedby', source: 'link-header' }
    ]);
    expect(report.score).toBeLessThan(60);
    expect(report.gaps.some(g => g.rel === 'profile')).toBe(true);
    expect(report.gaps.some(g => g.rel === 'cite-as')).toBe(true);
    expect(report.patterns.length).toBe(9);
  });

  it('should generate didactic questions with explanatory context', () => {
    const report = evaluateHealthAndGaps('https://example.org/data', []);
    const questions = generateTriageQuestions(report);
    expect(questions.length).toBeGreaterThan(0);
    const profileQ = questions.find(q => q.rel === 'profile');
    expect(profileQ).toBeDefined();
    expect(profileQ?.didacticText).toContain('harvesters');
  });

  it('should evaluate pattern-specific score and conformity precisely for PT-01', () => {
    // Missing required 'profile'
    const initial = evaluatePatternScore('PT-01', [], true);
    expect(initial.score).toBe(0);
    expect(initial.status).toBe('UNSATISFIED');
    expect(initial.missingRequired).toContain('profile');
    expect(initial.standards.length).toBeGreaterThan(0);

    // Satisfy required 'profile'
    const satisfied = evaluatePatternScore('PT-01', [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' }
    ], true);
    expect(satisfied.score).toBeGreaterThanOrEqual(75);
    expect(satisfied.status).toBe('SATISFIED');
    expect(satisfied.satisfiedRequired).toContain('profile');
    expect(satisfied.missingRequired.length).toBe(0);
  });

  it('should evaluate pattern score as 0 in standby mode when no seed URI is provided', () => {
    const standby = evaluatePatternScore('PT-01', [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' }
    ], false);
    expect(standby.score).toBe(0);
    expect(standby.standards[0].label).toContain('RFC 6906');
  });
});

