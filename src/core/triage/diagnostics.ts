import { DiscoveredLink } from '../wrx/types';

export interface RTGap {
  rel: string;
  patternId: string;
  severity: 'CRITICAL' | 'WARNING' | 'RECOMMENDED';
  message: string;
  didacticReason: string;
}

export interface DiagnosticReport {
  targetUrl: string;
  score: number; // 0 - 100
  vitalStatus: 'CRITICAL' | 'UNSTABLE' | 'HEALTHY';
  presentRelations: string[];
  gaps: RTGap[];
  satisfiedPatterns: string[];
}

export function evaluateHealthAndGaps(url: string, links: DiscoveredLink[]): DiagnosticReport {
  const rels = new Set(links.map(l => l.rel.toLowerCase()));
  const gaps: RTGap[] = [];
  let score = 0;

  // 1. Profile conformance (PT-01 / RT-P01)
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

  // 2. Metadata description (PT-04 / RT-P04)
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

  // 3. Persistent Identifier / Citation (PT-04 / RT-P04)
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

  // 4. Linkset or Catalog Assistance (PT-07 / PT-08)
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

  // 5. Alternate formats or types (PT-03 / PT-04)
  if (rels.has('alternate') || rels.has('type')) {
    score += 10;
  }

  const vitalStatus = score >= 75 ? 'HEALTHY' : score >= 40 ? 'UNSTABLE' : 'CRITICAL';

  const satisfiedPatterns: string[] = [];
  if (rels.has('profile')) satisfiedPatterns.push('PT-01');
  if (rels.has('describedby')) satisfiedPatterns.push('PT-04');
  if (rels.has('linkset')) satisfiedPatterns.push('PT-08');

  return {
    targetUrl: url,
    score,
    vitalStatus,
    presentRelations: Array.from(rels),
    gaps,
    satisfiedPatterns
  };
}
