// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { buildGraphModel, renderSvgGraph } from '../src/ui/graph/renderer';

describe('Graph Visualizer SVG Enhancements', () => {
  it('should render coordinate grid-dots pattern and relation arrow markers', () => {
    const container = document.createElement('div');
    const model = buildGraphModel('https://example.org/res', [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' }
    ]);
    const svg = renderSvgGraph(container, model);

    expect(svg.querySelector('defs pattern#grid-dots')).not.toBeNull();
    expect(svg.querySelector('defs marker#rel-arrow')).not.toBeNull();
    expect(svg.querySelector('line[marker-end="url(#rel-arrow)"]')).not.toBeNull();
    expect(svg.querySelector('.relation-capsule')).not.toBeNull();
  });
});
