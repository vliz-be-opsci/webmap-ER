import { describe, it, expect } from 'vitest';
import { buildGraphModel } from '../src/ui/graph/renderer';

describe('Graph Visualizer Model', () => {
  it('should transform app state links into graph nodes and colored edges', () => {
    const links = [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' as const }
    ];
    const graph = buildGraphModel('https://example.org/data', links);
    expect(graph.nodes.length).toBeGreaterThanOrEqual(2);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges[0].color).toBe('var(--clinical-emerald)');
  });
});
