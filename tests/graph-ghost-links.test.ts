import { describe, it, expect } from 'vitest';
import { buildGraphModel } from '../src/ui/graph/renderer';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { DiscoveredLink } from '../src/core/wrx/types';

describe('Graph Visualizer Ghost Nodes for Missing Pattern Links', () => {
  it('should not include ghost nodes when showMissingLinks is false or omitted', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/meta.jsonld', rel: 'describedby', source: 'link-header' }
    ];
    const report = evaluateHealthAndGaps('https://example.org/dataset', links);
    const model = buildGraphModel('https://example.org/dataset', links, {
      showMissingLinks: false,
      report,
      activePatternId: 'PT-01'
    });

    expect(model.nodes.some(n => n.isGhost)).toBe(false);
    expect(model.edges.some(e => e.dashed)).toBe(false);
  });

  it('should project ghost nodes and dashed edges for missing required pattern relations when enabled', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/meta.jsonld', rel: 'describedby', source: 'link-header' }
    ];
    const report = evaluateHealthAndGaps('https://example.org/dataset', links);

    // PT-01 requires rel="profile"
    const model = buildGraphModel('https://example.org/dataset', links, {
      showMissingLinks: true,
      report,
      activePatternId: 'PT-01'
    });

    const ghostProfile = model.nodes.find(n => n.isGhost && n.rel === 'profile');
    expect(ghostProfile).toBeDefined();
    expect(ghostProfile?.label).toContain('profile');
    expect(ghostProfile?.type).toBe('ghost');

    const ghostEdge = model.edges.find(e => e.target === ghostProfile?.id);
    expect(ghostEdge).toBeDefined();
    expect(ghostEdge?.dashed).toBe(true);
  });

  it('should project missing API relations when PT-05 is active', () => {
    const links: DiscoveredLink[] = [];
    const report = evaluateHealthAndGaps('https://example.org/api-dataset', links);

    const model = buildGraphModel('https://example.org/api-dataset', links, {
      showMissingLinks: true,
      report,
      activePatternId: 'PT-05'
    });

    const ghostServiceDesc = model.nodes.find(n => n.isGhost && n.rel === 'service-desc');
    expect(ghostServiceDesc).toBeDefined();
  });
});
