export interface DiscoveredLink {
  target: string;
  rel: string;
  type?: string;
  profile?: string;
  anchor?: string;
  source: 'link-header' | 'html-link' | 'linkset' | 'script-rdf' | 'conneg' | 'sitemap-xml';
}

export interface ExtractionResult {
  url: string;
  status: number;
  contentType: string;
  links: DiscoveredLink[];
  rdfBodies: Array<{ format: string; content: string; source: string }>;
  trace: Array<{ strategy: string; success: boolean; message: string }>;
  corsBlocked: boolean;
}
