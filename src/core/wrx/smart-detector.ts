import { ExtractionResult } from './types';

export interface DetectedItem {
  uri: string;
  label: string;
  source: string;
  confidence: 'high' | 'medium';
}

export interface DetectedApi {
  serviceDesc?: string;
  serviceDoc?: string;
  apiType: string;
  source: string;
}

export interface SmartInferenceResult {
  detectedProfiles: DetectedItem[];
  detectedPids: DetectedItem[];
  detectedApis: DetectedApi[];
  recommendedPatternFocus: 'PT-01' | 'PT-05' | 'PT-06' | 'PT-07' | 'ALL';
  hasLinkedData: boolean;
  didacticHint?: string;
}

const DOI_REGEX = /10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/;

export function detectSmartMetadata(result: ExtractionResult): SmartInferenceResult {
  const detectedProfiles: DetectedItem[] = [];
  const detectedPids: DetectedItem[] = [];
  const detectedApis: DetectedApi[] = [];

  let hasLinkedData = false;

  // 1. Check HTTP and HTML links for linked data and APIs
  for (const link of result.links) {
    const relLower = link.rel.toLowerCase();

    if (relLower === 'describedby') {
      hasLinkedData = true;
    }

    if (relLower === 'profile' && link.target) {
      hasLinkedData = true;
      addProfile(detectedProfiles, link.target, formatProfileLabel(link.target), 'http-link-header', 'high');
    }

    if (relLower === 'cite-as' && link.target) {
      addPid(detectedPids, link.target, 'HTTP cite-as header', 'http-link-header');
    }

    if (relLower === 'service-desc') {
      detectedApis.push({
        serviceDesc: link.target,
        apiType: link.type || 'OpenAPI / Machine API',
        source: 'http-link-header:service-desc'
      });
    }

    if (relLower === 'service-doc') {
      detectedApis.push({
        serviceDoc: link.target,
        apiType: 'HTML Documentation',
        source: 'http-link-header:service-doc'
      });
    }
  }

  // 2. Check Content-Type
  const ct = (result.contentType || '').toLowerCase();
  if (ct.includes('application/ld+json') || ct.includes('text/turtle') || ct.includes('application/rdf+xml')) {
    hasLinkedData = true;
  }

  // 3. Inspect RDF bodies (embedded JSON-LD or fetched RDF)
  if (result.rdfBodies && result.rdfBodies.length > 0) {
    hasLinkedData = true;

    for (const body of result.rdfBodies) {
      if (body.format.includes('json') || body.content.trim().startsWith('{') || body.content.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(body.content);
          traverseJsonLd(parsed, (obj) => {
            inspectJsonLdEntity(obj, detectedProfiles, detectedPids, detectedApis);
          });
        } catch {
          // Ignore parse errors on raw snippets
        }
      }
    }
  }

  // 4. Inspect Seed URL for API hints
  const urlLower = result.url.toLowerCase();
  if (urlLower.includes('openapi.json') || urlLower.includes('swagger.json') || urlLower.endsWith('/api') || urlLower.endsWith('/api/v1')) {
    if (!detectedApis.some(a => a.serviceDesc === result.url)) {
      detectedApis.push({
        serviceDesc: result.url,
        apiType: 'OpenAPI Specification Endpoint',
        source: 'url-heuristic'
      });
    }
  }

  // Determine recommended pattern focus
  let recommendedPatternFocus: SmartInferenceResult['recommendedPatternFocus'] = 'PT-01';
  let didacticHint = 'Baseline dataset profile and metadata triage recommended.';

  if (detectedApis.length > 0) {
    recommendedPatternFocus = 'PT-05';
    didacticHint = 'API endpoint discovered. We recommend focusing on PT-05 Subsetting API Integration.';
  } else if (!hasLinkedData) {
    didacticHint = 'No machine-readable linked data found on seed URI. Proactive metadata discovery recommended.';
  }

  return {
    detectedProfiles,
    detectedPids,
    detectedApis,
    recommendedPatternFocus,
    hasLinkedData,
    didacticHint
  };
}

function traverseJsonLd(node: any, visitor: (obj: Record<string, any>) => void) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach(item => traverseJsonLd(item, visitor));
  } else if (typeof node === 'object') {
    visitor(node);
    for (const key of Object.keys(node)) {
      if (typeof node[key] === 'object') {
        traverseJsonLd(node[key], visitor);
      }
    }
  }
}

function inspectJsonLdEntity(
  obj: Record<string, any>,
  profiles: DetectedItem[],
  pids: DetectedItem[],
  apis: DetectedApi[]
) {
  // Check @context for RO-Crate or known profiles
  if (obj['@context']) {
    const ctx = obj['@context'];
    if (typeof ctx === 'string') {
      if (ctx.includes('ro/crate/1.1')) {
        addProfile(profiles, 'https://w3id.org/ro/crate/1.1', 'RO-Crate 1.1', 'embedded-jsonld:@context', 'high');
      } else if (ctx.includes('ro/crate/1.0')) {
        addProfile(profiles, 'https://w3id.org/ro/crate/1.0', 'RO-Crate 1.0', 'embedded-jsonld:@context', 'high');
      }
    } else if (Array.isArray(ctx)) {
      ctx.forEach(item => {
        if (typeof item === 'string' && item.includes('ro/crate')) {
          addProfile(profiles, 'https://w3id.org/ro/crate/1.1', 'RO-Crate 1.1', 'embedded-jsonld:@context', 'high');
        }
      });
    }
  }

  // Check conformsTo / dcterms:conformsTo
  const conformsTo = obj['conformsTo'] || obj['dct:conformsTo'] || obj['dcterms:conformsTo'] || obj['schema:conformsTo'];
  if (conformsTo) {
    if (typeof conformsTo === 'string') {
      addProfile(profiles, conformsTo, formatProfileLabel(conformsTo), 'embedded-jsonld:conformsTo', 'high');
    } else if (conformsTo['@id']) {
      addProfile(profiles, conformsTo['@id'], formatProfileLabel(conformsTo['@id']), 'embedded-jsonld:conformsTo', 'high');
    } else if (Array.isArray(conformsTo)) {
      conformsTo.forEach(item => {
        const uri = typeof item === 'string' ? item : item['@id'];
        if (uri) addProfile(profiles, uri, formatProfileLabel(uri), 'embedded-jsonld:conformsTo', 'high');
      });
    }
  }

  // Check @type for DataService
  const typeVal = obj['@type'];
  const types = Array.isArray(typeVal) ? typeVal : [typeVal];
  if (types.some(t => t === 'DataService' || t === 'dcat:DataService' || t === 'APIReference')) {
    const endpoint = obj['endpointURL'] || obj['url'] || obj['@id'];
    if (endpoint && typeof endpoint === 'string') {
      apis.push({
        serviceDesc: endpoint,
        apiType: 'DataService / API',
        source: 'embedded-jsonld:@type'
      });
    }
  }

  // Check identifier and sameAs for DOIs
  const idCandidates = [obj['identifier'], obj['@id'], obj['sameAs']];
  for (const candidate of idCandidates) {
    if (typeof candidate === 'string') {
      const match = candidate.match(DOI_REGEX);
      if (match) {
        const doiUri = candidate.startsWith('http') ? candidate : `https://doi.org/${match[0]}`;
        addPid(pids, doiUri, `DOI: ${match[0]}`, 'embedded-jsonld:identifier');
      }
    }
  }
}

function addProfile(list: DetectedItem[], uri: string, label: string, source: string, confidence: 'high' | 'medium') {
  if (!list.some(p => p.uri === uri)) {
    list.push({ uri, label, source, confidence });
  }
}

function addPid(list: DetectedItem[], uri: string, label: string, source: string) {
  if (!list.some(p => p.uri === uri)) {
    list.push({ uri, label, source, confidence: 'high' });
  }
}

function formatProfileLabel(uri: string): string {
  if (uri.includes('ro/crate')) return 'RO-Crate Profile';
  if (uri.includes('data.europa.eu/r5r')) return 'DCAT-AP 2.1';
  if (uri.includes('dwc.tdwg.org')) return 'Darwin Core (DwC)';
  try {
    const u = new URL(uri);
    return u.pathname.split('/').filter(Boolean).pop() || u.hostname;
  } catch {
    return uri.slice(-20);
  }
}
