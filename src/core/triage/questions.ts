import { DiagnosticReport, RTGap } from './diagnostics';

export interface QuestionOption {
  label: string;
  uri: string;
  description?: string;
}

export interface TriageQuestion {
  id: string;
  rel: string;
  patternId: string;
  severity: RTGap['severity'];
  title: string;
  prompt: string;
  didacticText: string;
  quickOptions: QuestionOption[];
  inputPlaceholder: string;
}

const COMMON_PROFILES: QuestionOption[] = [
  { label: 'RO-Crate 1.1', uri: 'https://w3id.org/ro/crate/1.1', description: 'Research Object Crate metadata specification' },
  { label: 'DCAT-AP 2.1', uri: 'http://data.europa.eu/r5r/', description: 'DCAT Application Profile for European data portals' },
  { label: 'Darwin Core (DwC)', uri: 'https://dwc.tdwg.org/terms/', description: 'Biodiversity occurrence and taxonomic standard' }
];

export function generateTriageQuestions(report: DiagnosticReport): TriageQuestion[] {
  return report.gaps.map((gap, index) => {
    switch (gap.rel) {
      case 'profile':
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: 'Prescribe Functional Profile Conformance',
          prompt: 'Does this resource adhere to an established domain profile or specification?',
          didacticText: gap.didacticReason,
          quickOptions: COMMON_PROFILES,
          inputPlaceholder: 'https://example.org/my-profile'
        };
      case 'describedby':
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: 'Attach Descriptive Metadata Document',
          prompt: 'Where is the machine-readable metadata (JSON-LD, Turtle, RDF/XML) located?',
          didacticText: gap.didacticReason,
          quickOptions: [
            { label: 'Auto JSON-LD Endpoint', uri: `${report.targetUrl}.jsonld` },
            { label: 'Auto Turtle Endpoint', uri: `${report.targetUrl}.ttl` }
          ],
          inputPlaceholder: 'https://example.org/dataset.jsonld'
        };
      case 'cite-as':
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: 'Assign Persistent Citation Identifier (PID)',
          prompt: 'What permanent identifier (DOI, Handle, or URN) should machines cite this dataset with?',
          didacticText: gap.didacticReason,
          quickOptions: [],
          inputPlaceholder: 'https://doi.org/10.1234/example-dataset'
        };
      case 'linkset':
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: 'Attach RFC 9264 Linkset',
          prompt: 'Would you like to advertise an external linkset document for this resource?',
          didacticText: gap.didacticReason,
          quickOptions: [
            { label: 'Well-Known Linkset', uri: safeUrl(report.targetUrl, '/.well-known/linkset') }
          ],
          inputPlaceholder: 'https://example.org/.well-known/linkset'
        };
      default:
        return {
          id: `q-${gap.rel}-${index}`,
          rel: gap.rel,
          patternId: gap.patternId,
          severity: gap.severity,
          title: `Resolve missing rel="${gap.rel}"`,
          prompt: `Specify target URI for rel="${gap.rel}"`,
          didacticText: gap.didacticReason,
          quickOptions: [],
          inputPlaceholder: 'https://...'
        };
    }
  });
}

function safeUrl(base: string, path: string): string {
  try {
    return new URL(path, base).href;
  } catch {
    return `https://example.org${path}`;
  }
}
