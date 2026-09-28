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
  implementationGuidance?: string;
  quickOptions: QuestionOption[];
  inputPlaceholder: string;
}

const COMMON_PROFILES: QuestionOption[] = [
  { label: 'RO-Crate 1.1', uri: 'https://w3id.org/ro/crate/1.1', description: 'Research Object Crate metadata specification' },
  { label: 'DCAT-AP 2.1', uri: 'http://data.europa.eu/r5r/', description: 'DCAT Application Profile for European data portals' },
  { label: 'Darwin Core (DwC)', uri: 'https://dwc.tdwg.org/terms/', description: 'Biodiversity occurrence and taxonomic standard' }
];

function safeUrl(base: string, path: string): string {
  try {
    return new URL(path, base).href;
  } catch {
    return `https://example.org${path}`;
  }
}

export function generateTriageQuestions(
  report: DiagnosticReport,
  activePatternFilter?: string
): TriageQuestion[] {
  const questions: TriageQuestion[] = [];
  const inference = report.smartInference;

  // Proactive probe: missing linked data on seed URI
  if (inference && !inference.hasLinkedData && !report.presentRelations.includes('describedby')) {
    questions.push({
      id: 'q-proactive-missing-ld',
      rel: 'describedby',
      patternId: 'PT-01',
      severity: 'CRITICAL',
      title: 'Proactive Inquiry: External Linked Data Availability',
      prompt: 'The seed resource at this URI did not return any embedded or linked RDF/JSON-LD data. Does an external metadata endpoint, catalog record, or landing page exist for this resource?',
      didacticText: 'Radical Transparency requires harvesters to discover machine-actionable metadata. If this URI serves binary data or plain HTML, signpost its JSON-LD description or crawl the external catalog record directly.',
      implementationGuidance: 'To implement: Publish a JSON-LD description (or RO-Crate) and attach it to your resource using HTTP Header `Link: <https://example.org/metadata.jsonld>; rel="describedby"; type="application/ld+json"` or in HTML `<link rel="describedby" href="...">`.',
      quickOptions: [
        { label: 'Crawl Potential Catalog URL', uri: `${report.targetUrl}/metadata` },
        { label: 'Crawl OGC Records / CSW API', uri: safeUrl(report.targetUrl, '/api/records') }
      ],
      inputPlaceholder: 'https://catalog.example.org/records/123'
    });
  }

  // If a specific pattern filter is requested
  if (activePatternFilter && activePatternFilter !== 'ALL') {
    return getPatternSpecificQuestions(activePatternFilter, report);
  }

  // General gap-driven questions
  report.gaps.forEach((gap, index) => {
    // Avoid duplicate if proactive missing ld question already added
    if (gap.rel === 'describedby' && questions.some(q => q.id === 'q-proactive-missing-ld')) {
      return;
    }

    const q = buildQuestionForRel(gap.rel, gap.patternId, gap.severity, gap.didacticReason, report, index);
    if (q) {
      questions.push(q);
    }
  });

  return questions;
}

function getPatternSpecificQuestions(patternId: string, report: DiagnosticReport): TriageQuestion[] {
  const inference = report.smartInference;
  const questions: TriageQuestion[] = [];
  const satisfiedRels = new Set(report.presentRelations.map(r => r.toLowerCase()));

  switch (patternId) {
    case 'PT-01': {
      if (!satisfiedRels.has('profile')) {
        const profileOptions: QuestionOption[] = [];
        if (inference?.detectedProfiles && inference.detectedProfiles.length > 0) {
          inference.detectedProfiles.forEach(p => {
            profileOptions.push({
              label: `${p.label} (Auto-detected)`,
              uri: p.uri,
              description: `Auto-detected from ${p.source} (${p.confidence} confidence)`
            });
          });
        }
        profileOptions.push(...COMMON_PROFILES);

        questions.push({
          id: 'q-pt01-profile',
          rel: 'profile',
          patternId: 'PT-01',
          severity: 'CRITICAL',
          title: 'Prescribe Functional Profile Conformance (PT-01)',
          prompt: 'Does this resource adhere to an established domain profile or specification?',
          didacticText: 'Signposting a functional profile allows automated harvesters to determine what schema rules and semantic constraints apply.',
          implementationGuidance: 'To implement: Configure your web server to return `Link: <https://w3id.org/ro/crate/1.1>; rel="profile"` in the HTTP response headers, or embed `<link rel="profile" href="https://w3id.org/ro/crate/1.1">` inside your HTML <head>.',
          quickOptions: profileOptions,
          inputPlaceholder: 'https://example.org/my-profile'
        });
      }
      break;
    }

    case 'PT-02': {
      if (!satisfiedRels.has('http://schema.org/haspart')) {
        questions.push({
          id: 'q-pt02-haspart',
          rel: 'http://schema.org/hasPart',
          patternId: 'PT-02',
          severity: 'RECOMMENDED',
          title: 'Declare Profile Composition Sub-parts (PT-02)',
          prompt: 'Are child profiles, constituent vocabularies, or sub-specifications composed within this parent profile?',
          didacticText: 'PT-02 Profile Composition allows composite standards to express component modularity via schema:hasPart.',
          implementationGuidance: 'To implement: In your composite profile metadata, declare constituent sub-profiles using `schema:hasPart` in JSON-LD, or send `Link: <https://example.org/sub-part>; rel="http://schema.org/hasPart"` in HTTP headers.',
          quickOptions: [
            { label: 'Vocabulary Sub-part', uri: safeUrl(report.targetUrl, '#terms') },
            { label: 'Shapes Sub-part (SHACL)', uri: safeUrl(report.targetUrl, '#shapes') }
          ],
          inputPlaceholder: 'https://example.org/profile/sub-part'
        });
      }
      break;
    }

    case 'PT-03': {
      if (!satisfiedRels.has('alternate')) {
        questions.push({
          id: 'q-pt03-alternate',
          rel: 'alternate',
          patternId: 'PT-03',
          severity: 'WARNING',
          title: 'Proactive Inquiry: Alternate Data Representations & Distributions (PT-03)',
          prompt: 'Does this resource have other format variants (CSV, NetCDF, GeoJSON, Parquet, or RDF) at alternate URIs?',
          didacticText: 'Pattern 3 (Content Negotiation Menu) advertises all available data representations so clients can negotiate format without guessing extensions.',
          implementationGuidance: 'To implement: Advertise format variants via RFC 8288 Link headers: `Link: <https://example.org/data.csv>; rel="alternate"; type="text/csv"`, `Link: <https://example.org/data.jsonld>; rel="alternate"; type="application/ld+json"`.',
          quickOptions: [
            { label: 'CSV Distribution', uri: `${report.targetUrl}.csv` },
            { label: 'GeoJSON Distribution', uri: `${report.targetUrl}.geojson` },
            { label: 'NetCDF / HDF5 Distribution', uri: `${report.targetUrl}.nc` },
            { label: 'Parquet Distribution', uri: `${report.targetUrl}.parquet` },
            { label: 'Turtle (RDF) Distribution', uri: `${report.targetUrl}.ttl` }
          ],
          inputPlaceholder: 'https://example.org/dataset.nc'
        });
      }
      break;
    }

    case 'PT-04': {
      if (!satisfiedRels.has('describedby')) {
        questions.push({
          id: 'q-pt04-describedby',
          rel: 'describedby',
          patternId: 'PT-04',
          severity: 'CRITICAL',
          title: 'Attach Direct Descriptive Metadata Document (PT-04)',
          prompt: 'Where is the machine-readable metadata (JSON-LD, Turtle, RDF/XML) located?',
          didacticText: 'Harvesters need direct links to structured RDF metadata to ingest dataset attributes without parsing unpredictable HTML.',
          implementationGuidance: 'To implement: Generate a machine-actionable RDF file (JSON-LD or Turtle) and expose it via HTTP Header: `Link: <https://example.org/dataset.jsonld>; rel="describedby"; type="application/ld+json"`.',
          quickOptions: [
            { label: 'Auto JSON-LD Endpoint', uri: `${report.targetUrl}.jsonld` },
            { label: 'Auto Turtle Endpoint', uri: `${report.targetUrl}.ttl` }
          ],
          inputPlaceholder: 'https://example.org/dataset.jsonld'
        });
      }

      if (!satisfiedRels.has('cite-as')) {
        const citeOptions: QuestionOption[] = [];
        if (inference?.detectedPids && inference.detectedPids.length > 0) {
          inference.detectedPids.forEach(p => {
            citeOptions.push({
              label: `${p.label} (Auto-detected)`,
              uri: p.uri,
              description: `Auto-detected ${(p.scheme || 'PID').toUpperCase()} identifier`
            });
          });
        }

        questions.push({
          id: 'q-pt04-cite-as',
          rel: 'cite-as',
          patternId: 'PT-04',
          severity: 'WARNING',
          title: 'Assign Persistent Citation Identifier (PID) (PT-04)',
          prompt: 'What permanent identifier (DOI, Handle, or URN) should machines cite this dataset with?',
          didacticText: 'Providing a permanent DOI or Handle via rel="cite-as" ensures persistent scholarly attribution and disambiguation in research catalogs.',
          implementationGuidance: 'To implement: Register your DOI/Handle with DataCite or your institution and declare it using `Link: <https://doi.org/10.1234/example>; rel="cite-as"`.',
          quickOptions: citeOptions,
          inputPlaceholder: 'https://doi.org/10.1234/example-dataset'
        });
      }
      break;
    }

    case 'PT-05': {
      if (!satisfiedRels.has('service-desc')) {
        const apiOptions: QuestionOption[] = [];
        if (inference?.detectedApis && inference.detectedApis.length > 0) {
          inference.detectedApis.forEach(a => {
            const ep = a.endpoint || a.serviceDesc || safeUrl(report.targetUrl, '/api');
            apiOptions.push({
              label: `${a.label || 'API'} (Auto-detected)`,
              uri: ep,
              description: `Auto-detected API (${a.type || a.apiType})`
            });
          });
        }
        apiOptions.push(
          { label: 'OpenAPI Specification', uri: safeUrl(report.targetUrl, '/openapi.json') },
          { label: 'OGC API Features Collections', uri: safeUrl(report.targetUrl, '/api/collections') }
        );

        questions.push({
          id: 'q-pt05-service-desc',
          rel: 'service-desc',
          patternId: 'PT-05',
          severity: 'WARNING',
          title: 'Link Machine-Readable API Contract (PT-05)',
          prompt: 'Where is the machine-actionable API specification (OpenAPI, OGC API Features/Records) located?',
          didacticText: 'Declaring OpenAPI or OGC API descriptions allows harvesters to query sub-collections without downloading entire archives.',
          implementationGuidance: 'To implement: Publish your OpenAPI schema or OGC API endpoint and link it via `Link: <https://example.org/api/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"`.',
          quickOptions: apiOptions,
          inputPlaceholder: 'https://example.org/api/openapi.json'
        });
      }
      break;
    }

    case 'PT-06': {
      if (!satisfiedRels.has('item')) {
        questions.push({
          id: 'q-pt06-sitemap',
          rel: 'item',
          patternId: 'PT-06',
          severity: 'RECOMMENDED',
          title: 'Declare Hostwide Discovery Endpoint (PT-06)',
          prompt: 'Where is the root sitemap.xml providing hostwide catalog traversal with <xhtml:link> signposting?',
          didacticText: 'Embedding signposting links inside sitemap.xml enables crawler harvesting across thousands of resources in a single pass.',
          implementationGuidance: 'To implement: Add `<xhtml:link rel="describedby" href="https://example.org/item.jsonld"/>` inside each `<url>` block in `/sitemap.xml`, and add `Sitemap: https://example.org/sitemap.xml` to `/robots.txt`.',
          quickOptions: [
            { label: 'Root Sitemap XML', uri: safeUrl(report.targetUrl, '/sitemap.xml') },
            { label: 'Well-Known Sitemap', uri: safeUrl(report.targetUrl, '/.well-known/sitemap.xml') }
          ],
          inputPlaceholder: 'https://example.org/sitemap.xml'
        });
      }
      break;
    }

    case 'PT-07': {
      if (!satisfiedRels.has('item')) {
        questions.push({
          id: 'q-pt07-item',
          rel: 'item',
          patternId: 'PT-07',
          severity: 'RECOMMENDED',
          title: 'Link Catalog Member Resources (PT-07)',
          prompt: 'Does this catalog or collection link to its member resources via rel="item"?',
          didacticText: 'PT-07 Catalog Assistance enables bidirectional item-collection navigation between datasets and repositories.',
          implementationGuidance: 'To implement: Expose member items from your catalog page via `Link: <https://example.org/items/item-01>; rel="item"`. On the item itself, link back via `rel="collection"`.',
          quickOptions: [
            { label: 'Member Resource List', uri: safeUrl(report.targetUrl, '/items') }
          ],
          inputPlaceholder: 'https://example.org/catalog/item-01'
        });
      }
      break;
    }

    case 'PT-08': {
      if (!satisfiedRels.has('linkset')) {
        questions.push({
          id: 'q-pt08-linkset',
          rel: 'linkset',
          patternId: 'PT-08',
          severity: 'RECOMMENDED',
          title: 'Attach RFC 9264 External Linkset (PT-08)',
          prompt: 'Would you like to advertise an external or decoupled linkset document for this resource?',
          didacticText: 'RFC 9264 Linksets offload extensive relationship graphs to dedicated discovery documents without overloading HTTP headers.',
          implementationGuidance: 'To implement: Generate a JSON linkset document at `/.well-known/linkset` and announce it using `Link: <https://example.org/.well-known/linkset>; rel="linkset"; type="application/linkset+json"`.',
          quickOptions: [
            { label: 'Well-Known Linkset', uri: safeUrl(report.targetUrl, '/.well-known/linkset') },
            { label: 'Linkset JSON Document', uri: safeUrl(report.targetUrl, '/linkset.json') }
          ],
          inputPlaceholder: 'https://example.org/.well-known/linkset'
        });
      }
      break;
    }

    default:
      break;
  }

  return questions;
}

function buildQuestionForRel(
  rel: string,
  patternId: string,
  severity: RTGap['severity'],
  didacticReason: string,
  report: DiagnosticReport,
  index: number
): TriageQuestion | null {
  const inference = report.smartInference;

  switch (rel) {
    case 'profile': {
      const profileOptions: QuestionOption[] = [];
      if (inference?.detectedProfiles && inference.detectedProfiles.length > 0) {
        inference.detectedProfiles.forEach(p => {
          profileOptions.push({
            label: `${p.label} (Auto-detected)`,
            uri: p.uri,
            description: `Auto-detected from ${p.source} (${p.confidence} confidence)`
          });
        });
      }
      profileOptions.push(...COMMON_PROFILES);

      return {
        id: `q-${rel}-${index}`,
        rel,
        patternId,
        severity,
        title: 'Prescribe Functional Profile Conformance (PT-01)',
        prompt: 'Does this resource adhere to an established domain profile or specification?',
        didacticText: didacticReason,
        implementationGuidance: 'To implement: Configure your server response headers: `Link: <https://w3id.org/ro/crate/1.1>; rel="profile"`, or embed `<link rel="profile" href="...">` in HTML.',
        quickOptions: profileOptions,
        inputPlaceholder: 'https://example.org/my-profile'
      };
    }

    case 'describedby':
      return {
        id: `q-${rel}-${index}`,
        rel,
        patternId,
        severity,
        title: 'Attach Descriptive Metadata Document',
        prompt: 'Where is the machine-readable metadata (JSON-LD, Turtle, RDF/XML) located?',
        didacticText: didacticReason,
        implementationGuidance: 'To implement: Host machine-actionable metadata and send `Link: <https://example.org/meta.jsonld>; rel="describedby"; type="application/ld+json"`.',
        quickOptions: [
          { label: 'Auto JSON-LD Endpoint', uri: `${report.targetUrl}.jsonld` },
          { label: 'Auto Turtle Endpoint', uri: `${report.targetUrl}.ttl` }
        ],
        inputPlaceholder: 'https://example.org/dataset.jsonld'
      };

    case 'cite-as': {
      const citeOptions: QuestionOption[] = [];
      if (inference?.detectedPids && inference.detectedPids.length > 0) {
        inference.detectedPids.forEach(p => {
          citeOptions.push({
            label: `${p.label} (Auto-detected)`,
            uri: p.uri,
            description: `Auto-detected ${(p.scheme || 'PID').toUpperCase()} identifier`
          });
        });
      }

      return {
        id: `q-${rel}-${index}`,
        rel,
        patternId,
        severity,
        title: 'Assign Persistent Citation Identifier (PID)',
        prompt: 'What permanent identifier (DOI, Handle, or URN) should machines cite this dataset with?',
        didacticText: didacticReason,
        implementationGuidance: 'To implement: Send `Link: <https://doi.org/10.1234/example>; rel="cite-as"` in your HTTP response headers.',
        quickOptions: citeOptions,
        inputPlaceholder: 'https://doi.org/10.1234/example-dataset'
      };
    }

    case 'service-desc':
      return {
        id: `q-${rel}-${index}`,
        rel,
        patternId,
        severity,
        title: 'Link Machine-Readable API Contract (PT-05)',
        prompt: 'Where is the machine-actionable API specification (OpenAPI, OGC API Features/Records) located?',
        didacticText: didacticReason,
        implementationGuidance: 'To implement: Link your OpenAPI or OGC API specification using `Link: <https://example.org/api/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"`.',
        quickOptions: [
          { label: 'OpenAPI Specification', uri: safeUrl(report.targetUrl, '/openapi.json') },
          { label: 'OGC API Features Collections', uri: safeUrl(report.targetUrl, '/api/collections') }
        ],
        inputPlaceholder: 'https://example.org/api/openapi.json'
      };

    case 'item':
      return {
        id: `q-${rel}-${index}`,
        rel,
        patternId,
        severity,
        title: 'Link Catalog Member Resources (PT-07)',
        prompt: 'Does this catalog or collection link to its member resources via rel="item"?',
        didacticText: didacticReason,
        implementationGuidance: 'To implement: Link member items from your collection or catalog using `Link: <https://example.org/catalog/item-01>; rel="item"`.',
        quickOptions: [
          { label: 'Member Resource List', uri: safeUrl(report.targetUrl, '/items') }
        ],
        inputPlaceholder: 'https://example.org/catalog/item-01'
      };

    case 'linkset':
      return {
        id: `q-${rel}-${index}`,
        rel,
        patternId,
        severity,
        title: 'Attach RFC 9264 External Linkset (PT-08)',
        prompt: 'Would you like to advertise an external or decoupled linkset document for this resource?',
        didacticText: didacticReason,
        implementationGuidance: 'To implement: Host an RFC 9264 JSON Linkset and send `Link: <https://example.org/.well-known/linkset>; rel="linkset"; type="application/linkset+json"`.',
        quickOptions: [
          { label: 'Well-Known Linkset', uri: safeUrl(report.targetUrl, '/.well-known/linkset') },
          { label: 'Linkset JSON Document', uri: safeUrl(report.targetUrl, '/linkset.json') }
        ],
        inputPlaceholder: 'https://example.org/.well-known/linkset'
      };

    default:
      return null;
  }
}
