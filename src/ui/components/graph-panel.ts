import { AppStore } from '../../core/state/store';
import { buildGraphModel, renderSvgGraph } from '../graph/renderer';
import { downloadGraphImage, downloadGraphSvg } from '../graph/exporter';
import { evaluateHealthAndGaps } from '../../core/triage/diagnostics';
import { generateTriageQuestions } from '../../core/triage/questions';
import { iconFileCode, iconNetwork } from '../icons';
import { showToast } from './toast';

export function createGraphPanel(store: AppStore): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'graph-panel';

  let currentSvg: SVGSVGElement | null = null;

  function render() {
    const state = store.getState();
    const showMissingLinks = state.ui.showMissingLinks !== false;
    const report = evaluateHealthAndGaps(state.seedUri, state.links, state.smartInference);

    panel.innerHTML = `
      <div class="graph-toolbar">
        <span class="graph-title">RT Network Topology</span>
        <div class="graph-actions" style="display: flex; gap: 0.5rem; align-items: center;">
          <button id="btn-toggle-ghost-links" class="btn btn-secondary ${showMissingLinks ? 'active' : ''}" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" title="Project missing pattern links as ghost nodes">
            ${iconNetwork('', 14)}
            <span>${showMissingLinks ? 'Hide Missing' : 'Show Missing'}</span>
          </button>
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

    const container = panel.querySelector('#graph-container') as HTMLElement;
    if (!container) return;

    const model = buildGraphModel(state.seedUri, state.links, {
      showMissingLinks,
      report,
      activePatternId: state.activePatternId
    });

    currentSvg = renderSvgGraph(container, model, (nodeId) => {
      store.setSelectedNode(nodeId);
      if (nodeId.startsWith('ghost-')) {
        const rel = nodeId.replace('ghost-', '');
        const activeFilter = state.activePatternId && state.activePatternId !== 'ALL' ? state.activePatternId : undefined;
        const questions = generateTriageQuestions(report, activeFilter);
        const qIdx = questions.findIndex(q => q.rel.toLowerCase() === rel.toLowerCase());
        if (qIdx >= 0) {
          store.setQuestionIndex(qIdx);
          showToast('Prescription Focused', `Navigated to question for rel="${rel}"`, 'info');
        } else {
          showToast('Missing Relation', `Prescription card opened for rel="${rel}"`, 'info');
        }
      } else if (nodeId === state.seedUri) {
        showToast('Seed Inspected', 'Inspecting root target seed resource.', 'info');
      } else {
        const link = state.links.find(l => l.target === nodeId);
        showToast('Node Inspected', `Inspecting rel="${link?.rel || 'node'}" in left panel.`, 'info');
      }
    }, state.ui.selectedNodeId);

    // Wire Toolbar Controls
    panel.querySelector('#btn-toggle-ghost-links')?.addEventListener('click', () => {
      const next = !showMissingLinks;
      store.setShowMissingLinks(next);
      showToast(
        'Topology Projections',
        next ? 'Projecting missing pattern relations as ghost nodes.' : 'Showing discovered relations only.',
        'info'
      );
    });

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
  }

  store.subscribe(render);
  render();
  return panel;
}
