import { AggregatedHostExtraction } from './host-prober';

export interface PatternClassificationResult {
  recommendedPattern: string;
  confidence: 'high' | 'medium' | 'low';
  scorePercent: number;
  rationale: string;
  detectedSignals: string[];
}

export function classifyResourcePattern(extraction: AggregatedHostExtraction): PatternClassificationResult {
  const signals: string[] = [];
  const seedLinks = extraction.seedExtraction.links;
  const rels = new Set(seedLinks.map(l => l.rel.toLowerCase()));

  // 1. PT-06 Hostwide Sitemaps Evaluation
  if (extraction.sitemap && extraction.sitemap.signpostingLinks.length > 0) {
    signals.push(`Sitemap contains ${extraction.sitemap.signpostingLinks.length} embedded signposting links`);
    return {
      recommendedPattern: 'PT-06',
      confidence: 'high',
      scorePercent: 95,
      rationale: 'Hostwide discovery active: XML sitemap with <xhtml:link> signposting relations discovered.',
      detectedSignals: signals
    };
  }

  // 2. PT-05 Subsetting API Evaluation
  const hasServiceDesc = rels.has('service-desc') || rels.has('service-doc');
  const urlLower = extraction.seedUrl.toLowerCase();
  const isApiUrl = urlLower.includes('/api') || urlLower.includes('openapi.json') || urlLower.includes('swagger.json');
  if (hasServiceDesc) {
    signals.push('Explicit service-desc or service-doc link relation present in seed headers');
    return {
      recommendedPattern: 'PT-05',
      confidence: 'high',
      scorePercent: 90,
      rationale: 'Subsetting API detected via explicit machine-readable service description.',
      detectedSignals: signals
    };
  }
  if (isApiUrl) {
    signals.push('Seed URI path heuristics match web API conventions (/api)');
    return {
      recommendedPattern: 'PT-05',
      confidence: 'medium',
      scorePercent: 70,
      rationale: 'URL structure indicates an API endpoint; PT-05 Subsetting API Integration recommended.',
      detectedSignals: signals
    };
  }

  // 3. PT-07 Catalog Assistance Evaluation
  if (rels.has('item') || rels.has('collection') || urlLower.includes('/catalog') || urlLower.includes('/records')) {
    signals.push('Catalog navigation links (item/collection) or catalog URL paths detected');
    return {
      recommendedPattern: 'PT-07',
      confidence: rels.has('item') ? 'high' : 'medium',
      scorePercent: rels.has('item') ? 88 : 68,
      rationale: 'Catalog collection or member resource structure identified; PT-07 recommended.',
      detectedSignals: signals
    };
  }

  // 4. PT-01 Profile Conformity Evaluation
  if (rels.has('profile')) {
    signals.push('rel="profile" header declared on seed resource');
    return {
      recommendedPattern: 'PT-01',
      confidence: 'high',
      scorePercent: 92,
      rationale: 'Resource explicitly declares functional profile conformance via rel="profile".',
      detectedSignals: signals
    };
  }

  // 5. PT-04 Direct Metadata Evaluation
  if (rels.has('describedby')) {
    signals.push('rel="describedby" metadata link discovered on seed');
    return {
      recommendedPattern: 'PT-04',
      confidence: 'high',
      scorePercent: 86,
      rationale: 'Direct machine-readable metadata linked without separate landing page.',
      detectedSignals: signals
    };
  }

  // Fallback: PT-01 Baseline
  signals.push('Standard web resource without specialized API or catalog indicators');
  return {
    recommendedPattern: 'PT-01',
    confidence: 'low',
    scorePercent: 45,
    rationale: 'Baseline dataset triage: recommend establishing functional profile conformance (PT-01).',
    detectedSignals: signals
  };
}
