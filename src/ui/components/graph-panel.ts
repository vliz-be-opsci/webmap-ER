import { AppStore } from '../../core/state/store';
import { buildGraphModel, renderSvgGraph } from '../graph/renderer';
import { downloadGraphImage, downloadGraphSvg } from '../graph/exporter';
import { iconFileCode } from '../icons';
import { showToast } from './toast';

export function createGraphPanel(store: AppStore): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'graph-panel';

  panel.innerHTML = `
    <div class="graph-toolbar">
      <span class="graph-title">RT Network Topology</span>
      <div class="graph-actions" style="display: flex; gap: 0.5rem;">
        <button id="btn-export-svg" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" title="Download vector SVG snapshot">
          ${iconFileCode('', 14)}
          <span>Export SVG</span>
        </button>
        <button id="btn-export-png" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" title="Download raster PNG snapshot">
          ${iconFileCode('', 14)}
          <span>Export PNG</span>
        </button>
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
      showToast('Node Inspected', nodeId, 'info');
    });
  }

  panel.querySelector('#btn-export-png')?.addEventListener('click', () => {
    if (currentSvg) {
      downloadGraphImage(currentSvg);
      showToast('Snapshot Downloaded', 'Graph topology PNG exported.', 'success');
    }
  });

  panel.querySelector('#btn-export-svg')?.addEventListener('click', () => {
    if (currentSvg) {
      downloadGraphSvg(currentSvg);
      showToast('Snapshot Downloaded', 'Graph topology SVG exported.', 'success');
    }
  });

  store.subscribe(render);
  render();
  return panel;
}
