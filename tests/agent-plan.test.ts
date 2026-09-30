import { describe, it, expect } from 'vitest';
import { generateAgentImplementationPlan } from '../src/core/export/agent-plan';
import { DiagnosticReport } from '../src/core/triage/diagnostics';
import { DiscoveredLink } from '../src/core/wrx/types';
import { RelationProvenance } from '../src/core/state/store';

describe('generateAgentImplementationPlan', () => {
  const mockReport: DiagnosticReport = {
    targetUrl: 'https://example.org/dataset/42',
    score: 45,
    vitalStatus: 'UNSTABLE',
    presentRelations: ['describedby'],
    satisfiedPatterns: [],
    gaps: [
      {
        rel: 'cite-as',
        severity: 'CRITICAL',
        message: 'Missing persistent identifier (rel="cite-as")',
        didacticReason: 'Harvesters require persistent identifiers (DOI/Handle) to index datasets.',
        patternId: 'PT-04'
      },
      {
        rel: 'type',
        severity: 'WARNING',
        message: 'Missing dataset semantic type (rel="type")',
        didacticReason: 'Semantic type declares the resource profile class.',
        patternId: 'PT-04'
      }
    ],
    patterns: []
  };

  const mockLinks: DiscoveredLink[] = [
    { rel: 'describedby', target: 'https://example.org/dataset/42.jsonld', source: 'link-header' },
    { rel: 'cite-as', target: 'https://doi.org/10.5061/dryad.example', source: 'link-header' }
  ];

  const mockProvenance: RelationProvenance[] = [
    {
      rel: 'cite-as',
      targetUri: 'https://doi.org/10.5061/dryad.example',
      source: 'DELEGATED_IT_TICKET',
      evidence: 'Delegated during triage review',
      timestamp: Date.now()
    }
  ];

  it('should generate a comprehensive, structured implementation plan with execution phases', () => {
    const plan = generateAgentImplementationPlan(mockReport, mockLinks, mockProvenance, 'PT-04');

    expect(plan).toContain('# [Agent Task Plan]');
    expect(plan).toContain('https://example.org/dataset/42');
    expect(plan).toContain('PT-04');
    expect(plan).toContain('45%');
    expect(plan).toContain('UNSTABLE');

    // Phased execution checklists
    expect(plan).toContain('**Phase 1: Environment & Architecture Discovery**');
    expect(plan).toContain('**Phase 2: Signposting HTTP Header Implementation**');
    expect(plan).toContain('**Phase 3: Hostwide Sitemap Conformance (PT-06)**');
    expect(plan).toContain('**Phase 4: Automated Verification & Acceptance Testing**');

    // Checkbox items for autonomous LLM agents
    expect(plan).toContain('- [ ]');

    // Invariant wire-level deliverables
    expect(plan).toContain('Access-Control-Expose-Headers: Link');
    expect(plan).toContain('rel="describedby"');
    expect(plan).toContain('rel="cite-as"');

    // Delegated triage requirements
    expect(plan).toContain('DELEGATED_IT_TICKET');
    expect(plan).toContain('Prioritized Curator Directives');

    // Multi-framework recipes
    expect(plan).toContain('Nginx');
    expect(plan).toContain('Node.js');
    expect(plan).toContain('FastAPI');
    expect(plan).toContain('Apache');

    // Verification commands
    expect(plan).toContain('curl -s -I');
    expect(plan).toContain('ghcr.io/vliz-be-opsci/rt-test');
  });

  it('should handle empty links and default to PT-04 when active pattern not provided', () => {
    const emptyReport: DiagnosticReport = {
      targetUrl: '',
      score: 0,
      vitalStatus: 'CRITICAL',
      presentRelations: [],
      satisfiedPatterns: [],
      gaps: [],
      patterns: []
    };

    const plan = generateAgentImplementationPlan(emptyReport, []);
    expect(plan).toBeDefined();
    expect(plan).toContain('https://example.org/resource');
    expect(plan).toContain('PT-04');
    expect(plan).toContain('- [ ]');
  });
});
