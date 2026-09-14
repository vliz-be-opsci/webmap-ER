import { DiscoveredLink } from '../../core/wrx/types';

export interface GraphNode {
  id: string;
  label: string;
  type: 'resource' | 'profile' | 'metadata' | 'pid' | 'other';
  color: string;
  x: number;
  y: number;
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

export function buildGraphModel(seedUri: string, links: DiscoveredLink[]): GraphModel {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const rootId = seedUri || 'https://example.org/resource';

  nodes.push({
    id: rootId,
    label: formatLabel(rootId),
    type: 'resource',
    color: '#3b82f6',
    x: 250,
    y: 200
  });

  links.forEach((link, idx) => {
    let nodeType: GraphNode['type'] = 'other';
    let color = '#9ca3af';

    if (link.rel === 'profile') {
      nodeType = 'profile';
      color = '#8b5cf6';
    } else if (link.rel === 'describedby') {
      nodeType = 'metadata';
      color = '#10b981';
    } else if (link.rel === 'cite-as') {
      nodeType = 'pid';
      color = '#f59e0b';
    }

    if (!nodes.some(n => n.id === link.target)) {
      const angle = (idx / Math.max(links.length, 1)) * 2 * Math.PI;
      const radius = 140;
      nodes.push({
        id: link.target,
        label: formatLabel(link.target),
        type: nodeType,
        color,
        x: 250 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle)
      });
    }

    edges.push({
      source: rootId,
      target: link.target,
      rel: link.rel,
      color: 'var(--er-vital-green)',
      dashed: false
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
  onNodeClick?: (id: string) => void
): SVGSVGElement {
  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 500 400');
  svg.style.cursor = 'grab';

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
    line.setAttribute('stroke', edge.color === 'var(--er-vital-green)' ? '#10b981' : edge.color);
    line.setAttribute('stroke-width', '2');
    if (edge.dashed) line.setAttribute('stroke-dasharray', '4');
    svg.appendChild(line);

    // Edge Label
    const midX = (srcNode.x + tgtNode.x) / 2;
    const midY = (srcNode.y + tgtNode.y) / 2;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', midX.toString());
    text.setAttribute('y', (midY - 6).toString());
    text.setAttribute('fill', '#9ca3af');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-family', 'sans-serif');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = `rel="${edge.rel}"`;
    svg.appendChild(text);
  });

  // Render Nodes
  model.nodes.forEach(node => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    g.onclick = () => onNodeClick?.(node.id);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x.toString());
    circle.setAttribute('cy', node.y.toString());
    circle.setAttribute('r', node.type === 'resource' ? '22' : '16');
    circle.setAttribute('fill', node.color);
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x.toString());
    text.setAttribute('y', (node.y + 30).toString());
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-family', 'sans-serif');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = node.label;
    g.appendChild(text);

    svg.appendChild(g);
  });

  container.appendChild(svg);
  return svg;
}
