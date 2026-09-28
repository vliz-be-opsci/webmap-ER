import { AggregatedHostExtraction } from '../wrx/host-prober';
import { PatternClassificationResult } from '../wrx/pattern-classifier';

export type ResolutionSource =
  | 'AUTO_ROBOTS'
  | 'AUTO_SITEMAP'
  | 'AUTO_LINK_HEADER'
  | 'AUTO_JSONLD'
  | 'AUTO_HEURISTIC'
  | 'HUMAN'
  | 'UNRESOLVED';

export interface IntakeQuestionItem {
  id: string;
  tier: 1 | 2;
  patternId: string;
  rel?: string;
  title: string;
  prompt: string;
  didacticText: string;
  currentValue: string;
  source: ResolutionSource;
  confidence: 'high' | 'medium' | 'low';
  skipped: boolean;
  evidence?: string;
  quickOptions: Array<{ label: string; value: string }>;
}

export function buildIntakeQuestions(
  extraction: AggregatedHostExtraction,
  classification: PatternClassificationResult
): IntakeQuestionItem[] {
  const items: IntakeQuestionItem[] = [];
  const seedUrl = extraction.seedUrl;
  const seedLinks = extraction.seedExtraction.links;

  let origin = 'https://example.org';
  try {
    origin = new URL(seedUrl).origin;
  } catch {}

  // Tier 1: Archetype Classification
  const patternId = classification.recommendedPattern;
  const isHighConfidenceArchetype = classification.confidence === 'high';

  items.push({
    id: 'q-intake-archetype',
    tier: 1,
    patternId,
    title: 'Resource Archetype & RT Pattern Focus',
    prompt: `Based on automated inspection, this resource conforms best to ${patternId}. Is this classification accurate?`,
    didacticText: classification.rationale,
    currentValue: patternId,
    source: isHighConfidenceArchetype ? 'AUTO_LINK_HEADER' : 'AUTO_HEURISTIC',
    confidence: classification.confidence,
    skipped: isHighConfidenceArchetype,
    evidence: classification.detectedSignals.join('; '),
    quickOptions: [
      { label: 'PT-01: Profile Conformity Declaration', value: 'PT-01' },
      { label: 'PT-04: Direct Metadata / No Landing Page', value: 'PT-04' },
      { label: 'PT-05: Subsetting API Integration', value: 'PT-05' },
      { label: 'PT-06: Hostwide Resource Discovery (Sitemaps)', value: 'PT-06' },
      { label: 'PT-07: Catalog Assistance', value: 'PT-07' }
    ]
  });

  // Tier 2: Key pattern-specific endpoints
  if (patternId === 'PT-06') {
    const sitemapUrl = extraction.sitemapUrl || (extraction.robotsTxt?.sitemaps[0]);
    const hasSitemapFromRobots = !!(extraction.robotsTxt?.sitemaps && extraction.robotsTxt.sitemaps.length > 0);
    const hasSitemapDoc = !!extraction.sitemap;

    items.push({
      id: 'q-intake-sitemap',
      tier: 2,
      patternId: 'PT-06',
      rel: 'item',
      title: 'Hostwide XML Sitemap Location',
      prompt: 'Where is the machine-harvestable XML sitemap located for this host?',
      didacticText: 'Pattern 06 embeds signposting links directly into sitemap.xml to enable bulk harvesting.',
      currentValue: sitemapUrl || `${origin}/sitemap.xml`,
      source: hasSitemapFromRobots ? 'AUTO_ROBOTS' : hasSitemapDoc ? 'AUTO_SITEMAP' : 'AUTO_HEURISTIC',
      confidence: (hasSitemapFromRobots || hasSitemapDoc) ? 'high' : 'medium',
      skipped: hasSitemapFromRobots || hasSitemapDoc,
      evidence: hasSitemapFromRobots ? 'Discovered in /robots.txt' : 'Probed default /sitemap.xml',
      quickOptions: [
        { label: 'Root Sitemap XML', value: `${origin}/sitemap.xml` },
        { label: 'Well-Known Sitemap', value: `${origin}/.well-known/sitemap.xml` }
      ]
    });
  } else if (patternId === 'PT-05') {
    const serviceDescLink = seedLinks.find(l => l.rel === 'service-desc');
    const isHighDesc = !!serviceDescLink;
    const descUrl = serviceDescLink?.target || `${seedUrl}/openapi.json`;

    items.push({
      id: 'q-intake-service-desc',
      tier: 2,
      patternId: 'PT-05',
      rel: 'service-desc',
      title: 'Machine-Readable Service Description (OpenAPI / OGC API)',
      prompt: 'Where is the OpenAPI / service description contract located?',
      didacticText: 'PT-05 enables automated harvesters to query sub-collections without scraping HTML.',
      currentValue: descUrl,
      source: isHighDesc ? 'AUTO_LINK_HEADER' : 'AUTO_HEURISTIC',
      confidence: isHighDesc ? 'high' : 'medium',
      skipped: isHighDesc,
      evidence: isHighDesc ? 'Found rel="service-desc" in HTTP headers' : 'Derived from API URL heuristic',
      quickOptions: [
        { label: 'OpenAPI JSON', value: `${seedUrl}/openapi.json` },
        { label: 'OGC API Features Collections', value: `${seedUrl}/collections` }
      ]
    });
  } else if (patternId === 'PT-01') {
    const profileLink = seedLinks.find(l => l.rel === 'profile');
    const hasProfile = !!profileLink;
    const profileVal = profileLink?.target || 'https://w3id.org/ro/crate/1.1';

    items.push({
      id: 'q-intake-profile',
      tier: 2,
      patternId: 'PT-01',
      rel: 'profile',
      title: 'Functional Profile Conformance Specification',
      prompt: 'Which profile or metadata schema specification does this resource adhere to?',
      didacticText: 'Signposting functional profiles tells crawlers which semantic rules govern this asset.',
      currentValue: profileVal,
      source: hasProfile ? 'AUTO_LINK_HEADER' : 'AUTO_HEURISTIC',
      confidence: hasProfile ? 'high' : 'medium',
      skipped: hasProfile,
      evidence: hasProfile ? 'Extracted from HTTP Link profile header' : 'Preset default profile',
      quickOptions: [
        { label: 'RO-Crate 1.1', value: 'https://w3id.org/ro/crate/1.1' },
        { label: 'DCAT-AP 2.1', value: 'http://data.europa.eu/r5r/' },
        { label: 'Darwin Core (DwC)', value: 'https://dwc.tdwg.org/terms/' }
      ]
    });
  } else if (patternId === 'PT-04') {
    const descLink = seedLinks.find(l => l.rel === 'describedby');
    const hasDesc = !!descLink;
    items.push({
      id: 'q-intake-describedby',
      tier: 2,
      patternId: 'PT-04',
      rel: 'describedby',
      title: 'Direct Descriptive Metadata URI',
      prompt: 'Where is the direct JSON-LD or Turtle metadata representation located?',
      didacticText: 'PT-04 provides direct access to machine-readable metadata without intermediate HTML wrappers.',
      currentValue: descLink?.target || `${seedUrl}.jsonld`,
      source: hasDesc ? 'AUTO_LINK_HEADER' : 'AUTO_HEURISTIC',
      confidence: hasDesc ? 'high' : 'medium',
      skipped: hasDesc,
      evidence: hasDesc ? 'Found rel="describedby" header' : 'Generated default JSON-LD path',
      quickOptions: [
        { label: 'JSON-LD Endpoint', value: `${seedUrl}.jsonld` },
        { label: 'Turtle Endpoint', value: `${seedUrl}.ttl` }
      ]
    });
  }

  return items;
}
