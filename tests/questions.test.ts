import { describe, it, expect } from 'vitest';
import { generateTriageQuestions } from '../src/core/triage/questions';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { SmartInferenceResult } from '../src/core/wrx/smart-detector';

describe('Multi-Pattern Questionnaire Generator', () => {
  it('should generate questions for unresolved gaps and support filtering by pattern', () => {
    const report = evaluateHealthAndGaps('https://example.org/dataset', []);
    const allQuestions = generateTriageQuestions(report);
    expect(allQuestions.length).toBeGreaterThanOrEqual(4);

    const apiQuestions = generateTriageQuestions(report, 'PT-05');
    expect(apiQuestions.length).toBeGreaterThan(0);
    expect(apiQuestions.every(q => q.patternId === 'PT-05')).toBe(true);

    const pt01Questions = generateTriageQuestions(report, 'PT-01');
    expect(pt01Questions.length).toBeGreaterThan(0);
    expect(pt01Questions.every(q => q.patternId === 'PT-01')).toBe(true);
  });

  it('should inject auto-detected profiles into quick options when smart inference is provided', () => {
    const smartInference: SmartInferenceResult = {
      detectedProfiles: [
        { uri: 'https://w3id.org/ro/crate/1.1', label: 'RO-Crate 1.1', source: 'jsonld', confidence: 'high' }
      ],
      detectedPids: [
        { uri: 'https://doi.org/10.1234/sample-pid', label: 'DOI 10.1234/sample-pid', source: 'jsonld', confidence: 'high', scheme: 'doi' }
      ],
      detectedApis: [],
      recommendedPatternFocus: 'PT-01',
      hasLinkedData: true
    };

    const report = evaluateHealthAndGaps('https://example.org/dataset', []);
    report.smartInference = smartInference;

    const questions = generateTriageQuestions(report);
    const profileQ = questions.find(q => q.rel === 'profile');
    expect(profileQ).toBeDefined();
    expect(profileQ?.quickOptions.some(opt => opt.description?.includes('Auto-detected'))).toBe(true);

    const citeQ = questions.find(q => q.rel === 'cite-as');
    expect(citeQ).toBeDefined();
    expect(citeQ?.quickOptions.some(opt => opt.uri === 'https://doi.org/10.1234/sample-pid')).toBe(true);
  });

  it('should generate proactive inquiries when no linked data is detected', () => {
    const smartInference: SmartInferenceResult = {
      detectedProfiles: [],
      detectedPids: [],
      detectedApis: [],
      recommendedPatternFocus: 'PT-01',
      hasLinkedData: false
    };

    const report = evaluateHealthAndGaps('https://example.org/plain-page', []);
    report.smartInference = smartInference;

    const questions = generateTriageQuestions(report);
    const proactiveQ = questions.find(q => q.id.includes('proactive-missing-ld'));
    expect(proactiveQ).toBeDefined();
    expect(proactiveQ?.prompt).toContain('external metadata');
  });

  it('should generate questions covering PT-02 through PT-08 patterns', () => {
    const report = evaluateHealthAndGaps('https://example.org/dataset', []);
    const patterns = ['PT-01', 'PT-02', 'PT-03', 'PT-04', 'PT-05', 'PT-06', 'PT-07', 'PT-08'];
    for (const pid of patterns) {
      const qs = generateTriageQuestions(report, pid);
      expect(qs.length).toBeGreaterThan(0);
      expect(qs.every(q => q.patternId === pid)).toBe(true);
    }
  });

  it('should omit questions for relations already satisfied when filtering by pattern', () => {
    // When profile relation is already present
    const reportWithProfile = evaluateHealthAndGaps('https://example.org/dataset', [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' }
    ]);
    const pt01Questions = generateTriageQuestions(reportWithProfile, 'PT-01');
    expect(pt01Questions.some(q => q.rel === 'profile')).toBe(false);
  });

  it('should provide concrete implementation guidance on questions', () => {
    const report = evaluateHealthAndGaps('https://example.org/dataset', []);
    const pt01Questions = generateTriageQuestions(report, 'PT-01');
    expect(pt01Questions[0].implementationGuidance).toBeDefined();
    expect(pt01Questions[0].implementationGuidance?.length).toBeGreaterThan(20);
  });
});
