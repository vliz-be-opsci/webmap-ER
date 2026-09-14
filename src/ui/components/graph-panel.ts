import { AppStore } from '../../core/state/store';
import { buildGraphModel, renderSvgGraph } from '../graph/renderer';
import { downloadGraphImage, downloadGraphSvg } from '../graph/exporter';

export function createGraphPanel(store: AppStore): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'graph-panel';

  panel.innerHTML = `
    <div class="graph-toolbar">
      <span class="graph-title" style="font-weight: 600; font-size: 0.9rem;">RT Network Topology</span>
      <div class="graph-actions" style="display: flex; gap: 0.5rem;">
        <button id="btn-export-svg" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">Export SVG</button>
        <button id="btn-export-png" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">Export PNG</button>
      </div>
    </div>
    <div class="graph-canvas-container" id="graph-container"></div>
  `;

  let currentSvg: SVGSVGElement | null = null;

  function render() {
    const container = panel.querySelector('#graph-container') as HTMLElement;
    if (!container) return;
    const state = store.getState();
    const model = buildGraphModel(state.seedUri, state.links);
    currentSvg = renderSvgGraph(container, model, (nodeId) => {
      console.log('Node clicked:', nodeId);
    });
  }

  panel.querySelector('#btn-export-png')?.addEventListener('click', () => {
    if (currentSvg) downloadGraphImage(currentSvg);
  });

  panel.querySelector('#btn-export-svg')?.addEventListener('click', () => {
    if (currentSvg) downloadGraphSvg(currentSvg);
  });

  store.subscribe(render);
  setTimeout(render, 50);
  return panel;
}
