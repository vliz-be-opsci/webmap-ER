import { DiscoveredLink } from '../wrx/types';
import { RT_PATTERNS, RTPatternDef } from '../rt/patterns';
import { SmartInferenceResult } from '../wrx/smart-detector';

export interface RTGap {
  rel: string;
  patternId: string;
  severity: 'CRITICAL' | 'WARNING' | 'RECOMMENDED';
  message: string;
  didacticReason: string;
}

export interface PatternConformity {
  patternId: string;
  name: string;
  patternName: string;
  status: 'SATISFIED' | 'PARTIAL' | 'UNSATISFIED';
  presentRelations: string[];
  missingRequired: string[];
  missingRecommended: string[];
}

export interface DiagnosticReport {
  targetUrl: string;
  score: number; // 0 - 100 Baseline Vital Signs Score
  vitalStatus: 'CRITICAL' | 'UNSTABLE' | 'HEALTHY';
  presentRelations: string[];
  patterns: PatternConformity[];
  gaps: RTGap[];
  satisfiedPatterns: string[];
  smartInference?: SmartInferenceResult;
}

export function evaluateHealthAndGaps(
  url: string,
  links: DiscoveredLink[],
  smartInference?: SmartInferenceResult
): DiagnosticReport {
  const rels = new Set(links.map(l => l.rel.toLowerCase()));
  const gaps: RTGap[] = [];
  let score = 0;

  // 1. Evaluate individual pattern conformities
  const patterns: PatternConformity[] = RT_PATTERNS.map((def: RTPatternDef) => {
    const present = def.requiredRelations
      .concat(def.recommendedRelations)
      .filter(rel => rels.has(rel.toLowerCase()));

    const missingReq = def.requiredRelations.filter(rel => !rels.has(rel.toLowerCase()));
    const missingRec = def.recommendedRelations.filter(rel => !rels.has(rel.toLowerCase()));

    let status: PatternConformity['status'] = 'UNSATISFIED';
    if (missingReq.length === 0) {
      status = 'SATISFIED';
    } else if (present.length > 0) {
      status = 'PARTIAL';
    }

    return {
      patternId: def.id,
      name: def.name,
      patternName: def.name,
      status,
      presentRelations: present,
      missingRequired: missingReq,
      missingRecommended: missingRec
    };
  });

  // 2. Compute Baseline Vital Signs Score (0 - 100)
  // Profile conformance (PT-01)
  if (rels.has('profile')) {
    score += 30;
  } else {
    gaps.push({
      rel: 'profile',
      patternId: 'PT-01',
      severity: 'CRITICAL',
      message: 'No functional profile declaration (rel="profile") discovered.',
      didacticReason: 'Without a profile declaration, automated harvesters cannot determine what standard or schema constraints govern your data.'
    });
  }

  // Metadata description (PT-04)
  if (rels.has('describedby')) {
    score += 25;
  } else {
    gaps.push({
      rel: 'describedby',
      patternId: 'PT-04',
      severity: 'CRITICAL',
      message: 'No descriptive metadata link (rel="describedby") discovered.',
      didacticReason: 'Harvesters need direct links to structured RDF metadata (JSON-LD, Turtle) to ingest dataset attributes without parsing unpredictable HTML.'
    });
  }

  // Persistent Identifier Citation (PT-04)
  if (rels.has('cite-as')) {
    score += 20;
  } else {
    gaps.push({
      rel: 'cite-as',
      patternId: 'PT-04',
      severity: 'WARNING',
      message: 'No persistent identifier citation link (rel="cite-as") discovered.',
      didacticReason: 'Providing a permanent DOI or Handle via rel="cite-as" ensures persistent scholarly attribution and disambiguation in research catalogs.'
    });
  }

  // Subsetting API (PT-05)
  if (rels.has('service-desc')) {
    score += 10;
  } else if (smartInference?.recommendedPatternFocus === 'PT-05') {
    gaps.push({
      rel: 'service-desc',
      patternId: 'PT-05',
      severity: 'WARNING',
      message: 'API endpoint discovered but lacks machine-readable rel="service-desc" link.',
      didacticReason: 'Declaring OpenAPI or OGC API descriptions allows harvesters to query sub-collections without downloading entire archives.'
    });
  }

  // Hostwide Discovery & Sitemap (PT-06)
  gaps.push({
    rel: 'item',
    patternId: 'PT-06',
    severity: 'RECOMMENDED',
    message: 'Hostwide crawler discovery via sitemap.xml signposting is recommended.',
    didacticReason: 'Embedding <xhtml:link> relations inside sitemap.xml enables crawler harvesting across thousands of resources.'
  });

  // Linkset or Catalog Assistance (PT-07 / PT-08)
  if (rels.has('linkset') || rels.has('item') || rels.has('collection')) {
    score += 15;
  } else {
    gaps.push({
      rel: 'linkset',
      patternId: 'PT-08',
      severity: 'RECOMMENDED',
      message: 'No external linkset or catalog grouping relations discovered.',
      didacticReason: 'RFC 9264 Linksets allow publishing comprehensive machine-readable relationship graphs without cluttering HTTP response headers.'
    });
  }

  // Content negotiation alternate formats (PT-03)
  if (rels.has('alternate') || rels.has('type')) {
    score += 10;
  }

  // Proactive probe: If smart inference detects no linked data on seed URI
  if (smartInference && !smartInference.hasLinkedData && !rels.has('describedby')) {
    gaps.unshift({
      rel: 'describedby',
      patternId: 'PT-04',
      severity: 'CRITICAL',
      message: 'No machine-readable linked data found on seed URI.',
      didacticReason: 'Does a separate metadata endpoint (JSON-LD, Turtle, API feed) exist for this resource?'
    });
  }

  const scoreCapped = Math.min(score, 100);
  const vitalStatus = scoreCapped >= 75 ? 'HEALTHY' : scoreCapped >= 40 ? 'UNSTABLE' : 'CRITICAL';

  const satisfiedPatterns = patterns
    .filter(p => p.status === 'SATISFIED')
    .map(p => p.patternId);

  return {
    targetUrl: url,
    score: scoreCapped,
    vitalStatus,
    presentRelations: Array.from(rels),
    patterns,
    gaps,
    satisfiedPatterns,
    smartInference
  };
}
