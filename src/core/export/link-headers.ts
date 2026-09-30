import { DiscoveredLink } from '../wrx/types';

export interface HttpHeadersExport {
  raw: string;
  nginx: string;
  apache: string;
  caddy: string;
}

export function generateHttpHeaders(links: DiscoveredLink[]): HttpHeadersExport {
  if (links.length === 0) {
    return { raw: '', nginx: '', apache: '', caddy: '' };
  }

  const parts = links.map(l => {
    let s = `<${l.target}>; rel="${l.rel}"`;
    if (l.type) s += `; type="${l.type}"`;
    if (l.profile) s += `; profile="${l.profile}"`;
    return s;
  });

  const raw = `Link: ${parts.join(', ')}`;
  const nginx = `add_header Link "${parts.join(', ')}";`;
  const apache = `Header add Link "${parts.join(', ')}"`;
  const caddy = `header Link "${parts.join(', ')}"`;

  return { raw, nginx, apache, caddy };
}
