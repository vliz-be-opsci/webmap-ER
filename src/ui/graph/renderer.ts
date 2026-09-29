import { DiscoveredLink } from '../../core/wrx/types';
import { DiagnosticReport } from '../../core/triage/diagnostics';

export interface GraphNode {
  id: string;
  label: string;
  type: 'resource' | 'profile' | 'metadata' | 'pid' | 'api' | 'item' | 'linkset' | 'ghost' | 'other';
  color: string;
  x: number;
  y: number;
  isGhost?: boolean;
  rel?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  rel: string;
  color: string;
  dashed: boolean;
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphBuildOptions {
  showMissingLinks?: boolean;
  report?: DiagnosticReport;
  activePatternId?: string;
}

export const RT_RELS = new Set([
  'profile',
  'describedby',
  'cite-as',
  'item',
  'collection',
  'alternate',
  'canonical',
  'service-desc',
  'service-doc',
  'linkset',
  'type',
  'author',
  'license',
  'status',
  'predecessor-version',
  'successor-version',
  'http://schema.org/haspart',
  'http://schema.org/ispartof',
  'haspart',
  'ispartof',
  'index',
  'search'
]);

export function isRtRelation(rel: string): boolean {
  if (!rel) return false;
  return RT_RELS.has(rel.toLowerCase().trim());
}

export function buildGraphModel(
  seedUri: string,
  links: DiscoveredLink[],
  options?: GraphBuildOptions
): GraphModel {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const rootId = seedUri || 'https://example.org/resource';

  nodes.push({
    id: rootId,
    label: formatLabel(rootId),
    type: 'resource',
    color: 'var(--clinical-cobalt)',
    x: 250,
    y: 200
  });

  // Filter out irrelevant links (e.g. stylesheet, icons, fonts)
  const rtLinks = links.filter(l => isRtRelation(l.rel));

  // Identify missing links if showMissingLinks is requested
  const missingRels: string[] = [];
  if (options?.showMissingLinks && options.report) {
    const activePattern = options.activePatternId && options.activePatternId !== 'ALL'
      ? options.report.patterns.find(p => p.patternId === options.activePatternId)
      : null;

    if (activePattern) {
      activePattern.missingRequired.forEach(r => {
        if (!missingRels.includes(r) && !rtLinks.some(l => l.rel.toLowerCase() === r.toLowerCase())) {
          missingRels.push(r);
        }
      });
      activePattern.missingRecommended.forEach(r => {
        if (!missingRels.includes(r) && !rtLinks.some(l => l.rel.toLowerCase() === r.toLowerCase())) {
          missingRels.push(r);
        }
      });
    } else {
      // Top unresolved gaps across patterns
      options.report.gaps.forEach(g => {
        if (!missingRels.includes(g.rel) && !rtLinks.some(l => l.rel.toLowerCase() === g.rel.toLowerCase())) {
          missingRels.push(g.rel);
        }
      });
    }
  }

  const totalItems = Math.max(rtLinks.length + missingRels.length, 1);

  // Render Discovered RT Links
  rtLinks.forEach((link, idx) => {
    let nodeType: GraphNode['type'] = 'other';
    let color = 'var(--text-secondary)';

    if (link.rel === 'profile') {
      nodeType = 'profile';
      color = 'var(--clinical-indigo)';
    } else if (link.rel === 'describedby') {
      nodeType = 'metadata';
      color = 'var(--clinical-emerald)';
    } else if (link.rel === 'cite-as') {
      nodeType = 'pid';
      color = 'var(--clinical-amber)';
    } else if (link.rel === 'service-desc' || link.rel === 'service-doc') {
      nodeType = 'api';
      color = 'var(--clinical-cobalt)';
    } else if (link.rel === 'item' || link.rel === 'collection') {
      nodeType = 'item';
      color = 'var(--clinical-emerald)';
    } else if (link.rel === 'linkset') {
      nodeType = 'linkset';
      color = 'var(--clinical-indigo)';
    }

    if (!nodes.some(n => n.id === link.target)) {
      const angle = (idx / totalItems) * 2 * Math.PI;
      const radius = 140;
      nodes.push({
        id: link.target,
        label: formatLabel(link.target),
        type: nodeType,
        color,
        x: 250 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle),
        rel: link.rel
      });
    }

    edges.push({
      source: rootId,
      target: link.target,
      rel: link.rel,
      color: 'var(--clinical-emerald)',
      dashed: false
    });
  });

  // Render Projected Ghost Nodes for Missing Pattern Relations
  missingRels.forEach((rel, mIdx) => {
    const idx = rtLinks.length + mIdx;
    const angle = (idx / totalItems) * 2 * Math.PI;
    const radius = 140;
    const ghostId = `ghost-${rel}`;

    nodes.push({
      id: ghostId,
      label: `Missing: rel="${rel}"`,
      type: 'ghost',
      color: 'var(--clinical-amber)',
      x: 250 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
      isGhost: true,
      rel
    });

    edges.push({
      source: rootId,
      target: ghostId,
      rel: rel,
      color: 'var(--clinical-amber)',
      dashed: true
    });
  });

  return { nodes, edges };
}

function formatLabel(uri: string): string {
  try {
    const u = new URL(uri);
    const lastPart = u.pathname.split('/').filter(Boolean).pop();
    return lastPart || u.hostname;
  } catch {
    return uri.slice(-15);
  }
}

export function renderSvgGraph(
  container: HTMLElement,
  model: GraphModel,
  onNodeClick?: (id: string) => void,
  selectedNodeId?: string | null
): SVGSVGElement {
  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 500 400');
  svg.style.cursor = 'grab';

  // SVG Definitions: Coordinate Grid Pattern & Directional Markers
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  // Coordinate Dot-Grid Pattern
  const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
  pattern.setAttribute('id', 'grid-dots');
  pattern.setAttribute('width', '20');
  pattern.setAttribute('height', '20');
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');

  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', '2');
  dot.setAttribute('cy', '2');
  dot.setAttribute('r', '1.2');
  dot.setAttribute('fill', 'var(--canvas-grid-dot)');
  pattern.appendChild(dot);
  defs.appendChild(pattern);

  // Directional Relation Arrow Markers
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'rel-arrow');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '28');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('orient', 'auto-start-reverse');

  const markerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  markerPath.setAttribute('d', 'M 0 1.5 L 8 5 L 0 8.5 z');
  markerPath.setAttribute('fill', 'var(--clinical-emerald)');
  marker.appendChild(markerPath);
  defs.appendChild(marker);

  // Missing Relation Arrow Marker (Amber)
  const markerMissing = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  markerMissing.setAttribute('id', 'rel-arrow-missing');
  markerMissing.setAttribute('viewBox', '0 0 10 10');
  markerMissing.setAttribute('refX', '28');
  markerMissing.setAttribute('refY', '5');
  markerMissing.setAttribute('markerWidth', '6');
  markerMissing.setAttribute('markerHeight', '6');
  markerMissing.setAttribute('orient', 'auto-start-reverse');

  const markerMissingPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  markerMissingPath.setAttribute('d', 'M 0 1.5 L 8 5 L 0 8.5 z');
  markerMissingPath.setAttribute('fill', 'var(--clinical-amber)');
  markerMissing.appendChild(markerMissingPath);
  defs.appendChild(markerMissing);

  svg.appendChild(defs);

  // Canvas Coordinate Background
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', 'url(#grid-dots)');
  bgRect.setAttribute('pointer-events', 'none');
  svg.appendChild(bgRect);

  // Render Edges
  model.edges.forEach(edge => {
    const srcNode = model.nodes.find(n => n.id === edge.source);
    const tgtNode = model.nodes.find(n => n.id === edge.target);
    if (!srcNode || !tgtNode) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', srcNode.x.toString());
    line.setAttribute('y1', srcNode.y.toString());
    line.setAttribute('x2', tgtNode.x.toString());
    line.setAttribute('y2', tgtNode.y.toString());
    line.setAttribute('stroke', edge.color || 'var(--clinical-emerald)');
    line.setAttribute('stroke-width', '1.75');
    if (edge.dashed) {
      line.setAttribute('stroke-dasharray', '4 3');
      line.setAttribute('marker-end', 'url(#rel-arrow-missing)');
    } else {
      line.setAttribute('marker-end', 'url(#rel-arrow)');
    }
    svg.appendChild(line);

    // Relation Micro-Capsule Badge
    const midX = (srcNode.x + tgtNode.x) / 2;
    const midY = (srcNode.y + tgtNode.y) / 2;

    const capsuleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    capsuleGroup.setAttribute('class', 'relation-capsule');
    capsuleGroup.setAttribute('transform', `translate(${midX}, ${midY})`);

    const labelRel = edge.rel.startsWith('http') ? formatLabel(edge.rel) : edge.rel;
    const badgeWidth = labelRel.length * 6.5 + 16;
    const badgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    badgeRect.setAttribute('x', (-badgeWidth / 2).toString());
    badgeRect.setAttribute('y', '-9');
    badgeRect.setAttribute('width', badgeWidth.toString());
    badgeRect.setAttribute('height', '18');
    badgeRect.setAttribute('rx', '4');
    badgeRect.setAttribute('fill', 'var(--surface-panel)');
    badgeRect.setAttribute('stroke', edge.dashed ? 'var(--clinical-amber-border)' : 'var(--border-subtle)');
    badgeRect.setAttribute('stroke-width', '1');
    capsuleGroup.appendChild(badgeRect);

    const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    badgeText.setAttribute('x', '0');
    badgeText.setAttribute('y', '3.5');
    badgeText.setAttribute('fill', edge.dashed ? 'var(--clinical-amber)' : 'var(--text-secondary)');
    badgeText.setAttribute('font-size', '9.5');
    badgeText.setAttribute('font-family', 'var(--font-mono)');
    badgeText.setAttribute('font-weight', '500');
    badgeText.setAttribute('text-anchor', 'middle');
    badgeText.textContent = `rel="${labelRel}"`;
    capsuleGroup.appendChild(badgeText);

    svg.appendChild(capsuleGroup);
  });

  // Render Nodes
  model.nodes.forEach(node => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    g.setAttribute('data-node-id', node.id);
    g.onclick = () => onNodeClick?.(node.id);

    const isResource = node.type === 'resource';
    const isGhost = !!node.isGhost;
    const isSelected = !!selectedNodeId && (node.id === selectedNodeId || (isGhost && selectedNodeId === `ghost-${node.rel}`));

    g.setAttribute('class', `graph-node ${isSelected ? 'selected' : ''}`);

    if (isSelected) {
      const selectedHalo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      selectedHalo.setAttribute('cx', node.x.toString());
      selectedHalo.setAttribute('cy', node.y.toString());
      selectedHalo.setAttribute('r', isResource ? '32' : '22');
      selectedHalo.setAttribute('fill', 'none');
      selectedHalo.setAttribute('stroke', isGhost ? 'var(--clinical-amber)' : 'var(--clinical-cobalt)');
      selectedHalo.setAttribute('stroke-width', '2.5');
      selectedHalo.setAttribute('stroke-dasharray', '4 2');
      selectedHalo.setAttribute('class', 'node-selected-halo');
      g.appendChild(selectedHalo);
    }

    if (isResource) {
      // Outer subtle ring for focal lead
      const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outerRing.setAttribute('cx', node.x.toString());
      outerRing.setAttribute('cy', node.y.toString());
      outerRing.setAttribute('r', '26');
      outerRing.setAttribute('fill', 'var(--clinical-cobalt-bg)');
      outerRing.setAttribute('stroke', 'var(--clinical-cobalt-border)');
      outerRing.setAttribute('stroke-width', '1.5');
      g.appendChild(outerRing);
    }

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x.toString());
    circle.setAttribute('cy', node.y.toString());
    circle.setAttribute('r', isResource ? '18' : '14');
    circle.setAttribute('fill', isGhost ? 'var(--clinical-amber-bg)' : node.color);
    circle.setAttribute('stroke', isGhost ? 'var(--clinical-amber)' : 'var(--surface-panel)');
    circle.setAttribute('stroke-width', isGhost ? '2' : '2.5');
    if (isGhost) {
      circle.setAttribute('stroke-dasharray', '3 3');
    }
    g.appendChild(circle);

    // Node Label with Background Pill for Contrast
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.setAttribute('transform', `translate(${node.x}, ${node.y + 28})`);

    const labelWidth = Math.min(node.label.length * 6.5 + 14, 150);
    const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    labelBg.setAttribute('x', (-labelWidth / 2).toString());
    labelBg.setAttribute('y', '-8');
    labelBg.setAttribute('width', labelWidth.toString());
    labelBg.setAttribute('height', '16');
    labelBg.setAttribute('rx', '3');
    labelBg.setAttribute('fill', 'var(--surface-panel)');
    labelBg.setAttribute('stroke', isGhost ? 'var(--clinical-amber-border)' : 'var(--border-subtle)');
    labelBg.setAttribute('stroke-width', '1');
    labelGroup.appendChild(labelBg);

    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelText.setAttribute('x', '0');
    labelText.setAttribute('y', '3');
    labelText.setAttribute('fill', isGhost ? 'var(--clinical-amber)' : 'var(--text-primary)');
    labelText.setAttribute('font-size', '10.5');
    labelText.setAttribute('font-family', isGhost ? 'var(--font-mono)' : 'var(--font-sans)');
    labelText.setAttribute('font-weight', isResource ? '600' : '500');
    labelText.setAttribute('text-anchor', 'middle');
    labelText.textContent = node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label;
    labelGroup.appendChild(labelText);

    g.appendChild(labelGroup);
    svg.appendChild(g);
  });

  container.appendChild(svg);
  return svg;
}
