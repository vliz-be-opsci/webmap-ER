// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { buildGraphModel } from '../src/ui/graph/renderer';
import { AppStore } from '../src/core/state/store';
import { createGraphPanel } from '../src/ui/components/graph-panel';

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

  it('should default to showMissingLinks = true in AppStore and graph panel', () => {
    const store = new AppStore();
    expect(store.getState().ui.showMissingLinks).toBe(true);

    const panel = createGraphPanel(store);
    const toggleBtn = panel.querySelector('#btn-toggle-ghost-links');
    expect(toggleBtn).not.toBeNull();
    // In default state, button allows hiding missing links
    expect(toggleBtn?.textContent).toContain('Hide Missing');

    (toggleBtn as HTMLElement)?.click();
    expect(store.getState().ui.showMissingLinks).toBe(false);
    const updatedBtn = panel.querySelector('#btn-toggle-ghost-links');
    expect(updatedBtn?.textContent).toContain('Show Missing');
  });

  it('should select a graph node on click and render Node Inspector in the triage panel', () => {
    const store = new AppStore();
    store.setSeedUri('https://example.org/dataset');
    store.answerQuestionWithProvenance('q1', 'profile', 'https://w3id.org/ro/crate/1.1', 'HUMAN', 'Research Object Crate');

    const graphPanel = createGraphPanel(store);
    const nodeEl = graphPanel.querySelector('[data-node-id="https://w3id.org/ro/crate/1.1"]') as HTMLElement;
    expect(nodeEl).not.toBeNull();

    nodeEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(store.getState().ui.selectedNodeId).toBe('https://w3id.org/ro/crate/1.1');
  });
});
