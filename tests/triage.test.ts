import { describe, it, expect } from 'vitest';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { generateTriageQuestions } from '../src/core/triage/questions';

describe('Didactic Triage Engine', () => {
  it('should diagnose missing profile and cite-as as critical/warning gaps', () => {
    const report = evaluateHealthAndGaps('https://example.org/data', [
      { target: 'https://example.org/meta.jsonld', rel: 'describedby', source: 'link-header' }
    ]);
    expect(report.score).toBeLessThan(60);
    expect(report.gaps.some(g => g.rel === 'profile')).toBe(true);
    expect(report.gaps.some(g => g.rel === 'cite-as')).toBe(true);
  });

  it('should generate didactic questions with explanatory context', () => {
    const report = evaluateHealthAndGaps('https://example.org/data', []);
    const questions = generateTriageQuestions(report);
    expect(questions.length).toBeGreaterThan(0);
    const profileQ = questions.find(q => q.rel === 'profile');
    expect(profileQ).toBeDefined();
    expect(profileQ?.didacticText).toContain('harvesters');
  });
});
