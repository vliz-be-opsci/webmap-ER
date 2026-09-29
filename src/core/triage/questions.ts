import { DiagnosticReport, RTGap } from './diagnostics';
import { getPatternById } from '../rt/patterns';

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
  currentValue?: string;
}

const COMMON_PROFILES: QuestionOption[] = [
  { label: 'RO-Crate 1.1', uri: 'https://w3id.org/ro/crate/1.1', description: 'Research Object Crate metadata specification' },
  { label: 'DCAT-AP 2.1', uri: 'http://data.europa.eu/r5r/', description: 'DCAT Application Profile for European data portals' },
  { label: 'Darwin Core (DwC)', uri: 'https://dwc.tdwg.org/terms/', description: 'Biodiversity occurrence and taxonomic standard' }
];

const COMMON_TYPES: QuestionOption[] = [
  { label: 'Schema.org Dataset', uri: 'http://schema.org/Dataset', description: 'Standard Schema.org structured dataset class' },
  { label: 'DCAT-3 Dataset', uri: 'http://www.w3.org/ns/dcat#Dataset', description: 'W3C Data Catalog vocabulary dataset entity' },
  { label: 'Schema.org DataCatalog', uri: 'http://schema.org/DataCatalog', description: 'Collection or catalog of multiple datasets' },
  { label: 'Schema.org WebAPI', uri: 'http://schema.org/WebAPI', description: 'Web API or service interface entity' }
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
  const def = getPatternById(patternId);
  if (!def) return [];

  const questions: TriageQuestion[] = [];
  const satisfiedRels = new Set(report.presentRelations.map(r => r.toLowerCase()));

  // 1. Check Required Relations first (CRITICAL / WARNING)
  for (const rel of def.requiredRelations) {
    if (!satisfiedRels.has(rel.toLowerCase())) {
      const severity = (rel === 'alternate' || rel === 'service-desc') ? 'WARNING' : 'CRITICAL';
      questions.push(buildQuestionForRelation(rel, patternId, report, severity));
    }
  }

  // 2. Check Recommended Relations next (RECOMMENDED / WARNING)
  for (const rel of def.recommendedRelations) {
    if (!satisfiedRels.has(rel.toLowerCase())) {
      const severity = rel === 'cite-as' ? 'WARNING' : 'RECOMMENDED';
      questions.push(buildQuestionForRelation(rel, patternId, report, severity));
    }
  }

  return questions;
}

function buildQuestionForRel(
  rel: string,
  patternId: string,
  severity: RTGap['severity'],
  didacticReason: string,
  report: DiagnosticReport,
  _index: number
): TriageQuestion | null {
  return buildQuestionForRelation(rel, patternId, report, severity, undefined, didacticReason);
}

export function buildQuestionForRelation(
  rel: string,
  patternId: string,
  report: DiagnosticReport,
  severity?: RTGap['severity'],
  currentValue?: string,
  customDidactic?: string
): TriageQuestion {
  const normRel = rel.toLowerCase();
  const inference = report.smartInference;
  const qId = `q-${patternId.toLowerCase()}-${normRel.replace(/[^a-z0-9]/g, '-')}`;

  switch (normRel) {
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
        id: qId,
        rel: 'profile',
        patternId,
        severity: severity || 'CRITICAL',
        title: `Prescribe Functional Profile Conformance (${patternId})`,
        prompt: 'Does this resource adhere to an established domain profile or specification?',
        didacticText: customDidactic || 'Signposting a functional profile allows automated harvesters to determine what schema rules and semantic constraints apply.',
        implementationGuidance: 'To implement: Configure your web server to return `Link: <https://w3id.org/ro/crate/1.1>; rel="profile"` in the HTTP response headers, or embed `<link rel="profile" href="https://w3id.org/ro/crate/1.1">` inside your HTML <head>.',
        quickOptions: profileOptions,
        inputPlaceholder: 'https://example.org/my-profile',
        currentValue
      };
    }

    case 'describedby':
      return {
        id: qId,
        rel: 'describedby',
        patternId,
        severity: severity || 'CRITICAL',
        title: `Attach Descriptive Metadata Document (${patternId})`,
        prompt: 'Where is the machine-readable metadata (JSON-LD, Turtle, RDF/XML) located?',
        didacticText: customDidactic || 'Harvesters need direct links to structured RDF metadata to ingest dataset attributes without parsing unpredictable HTML.',
        implementationGuidance: 'To implement: Host machine-actionable metadata and send `Link: <https://example.org/dataset.jsonld>; rel="describedby"; type="application/ld+json"`.',
        quickOptions: [
          { label: 'Auto JSON-LD Endpoint', uri: `${report.targetUrl}.jsonld` },
          { label: 'Auto Turtle Endpoint', uri: `${report.targetUrl}.ttl` }
        ],
        inputPlaceholder: 'https://example.org/dataset.jsonld',
        currentValue
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
        id: qId,
        rel: 'cite-as',
        patternId,
        severity: severity || 'WARNING',
        title: `Assign Persistent Citation Identifier (PID) (${patternId})`,
        prompt: 'What permanent identifier (DOI, Handle, or URN) should machines cite this dataset with?',
        didacticText: customDidactic || 'Providing a permanent DOI or Handle via rel="cite-as" ensures persistent scholarly attribution and disambiguation in research catalogs.',
        implementationGuidance: 'To implement: Register your DOI/Handle with DataCite or your institution and declare it using `Link: <https://doi.org/10.1234/example>; rel="cite-as"`.',
        quickOptions: citeOptions,
        inputPlaceholder: 'https://doi.org/10.1234/example-dataset',
        currentValue
      };
    }

    case 'type':
      return {
        id: qId,
        rel: 'type',
        patternId,
        severity: severity || 'RECOMMENDED',
        title: `Declare Resource Conceptual Type (${patternId})`,
        prompt: 'What machine-readable entity type or class represents this resource (e.g. Dataset, DataCatalog, WebAPI)?',
        didacticText: customDidactic || 'Declaring rel="type" (RFC 6906) provides explicit semantic typing, enabling harvesters to classify resources without analyzing payload schemas.',
        implementationGuidance: 'To implement: Send `Link: <http://schema.org/Dataset>; rel="type"` in HTTP headers or `<link rel="type" href="http://schema.org/Dataset">` in HTML.',
        quickOptions: COMMON_TYPES,
        inputPlaceholder: 'http://schema.org/Dataset',
        currentValue
      };

    case 'alternate':
      return {
        id: qId,
        rel: 'alternate',
        patternId,
        severity: severity || 'WARNING',
        title: `Advertise Alternate Representations & Formats (${patternId})`,
        prompt: 'Does this resource have other format variants (CSV, NetCDF, GeoJSON, Parquet, or RDF) at alternate URIs?',
        didacticText: customDidactic || 'Pattern 3 (Content Negotiation Menu) advertises all available data representations so clients can negotiate format without guessing extensions.',
        implementationGuidance: 'To implement: Advertise format variants via RFC 8288 Link headers: `Link: <https://example.org/data.csv>; rel="alternate"; type="text/csv"`, `Link: <https://example.org/data.jsonld>; rel="alternate"; type="application/ld+json"`.',
        quickOptions: [
          { label: 'CSV Distribution', uri: `${report.targetUrl}.csv` },
          { label: 'GeoJSON Distribution', uri: `${report.targetUrl}.geojson` },
          { label: 'NetCDF / HDF5 Distribution', uri: `${report.targetUrl}.nc` },
          { label: 'Parquet Distribution', uri: `${report.targetUrl}.parquet` },
          { label: 'Turtle (RDF) Distribution', uri: `${report.targetUrl}.ttl` }
        ],
        inputPlaceholder: 'https://example.org/dataset.nc',
        currentValue
      };

    case 'http://schema.org/haspart':
    case 'haspart':
      return {
        id: qId,
        rel: 'http://schema.org/hasPart',
        patternId,
        severity: severity || 'RECOMMENDED',
        title: `Declare Profile Composition Sub-parts (${patternId})`,
        prompt: 'Are child profiles, constituent vocabularies, or sub-specifications composed within this parent profile?',
        didacticText: customDidactic || 'PT-02 Profile Composition allows composite standards to express component modularity via schema:hasPart.',
        implementationGuidance: 'To implement: In your composite profile metadata, declare constituent sub-profiles using schema:hasPart in JSON-LD, or send `Link: <https://example.org/sub-part>; rel="http://schema.org/hasPart"` in HTTP headers.',
        quickOptions: [
          { label: 'Vocabulary Sub-part', uri: safeUrl(report.targetUrl, '#terms') },
          { label: 'Shapes Sub-part (SHACL)', uri: safeUrl(report.targetUrl, '#shapes') }
        ],
        inputPlaceholder: 'https://example.org/profile/sub-part',
        currentValue
      };

    case 'http://schema.org/ispartof':
    case 'ispartof':
      return {
        id: qId,
        rel: 'http://schema.org/isPartOf',
        patternId,
        severity: severity || 'RECOMMENDED',
        title: `Link to Parent Composite Profile (${patternId})`,
        prompt: 'What parent composite standard or profile is this specification a constituent part of?',
        didacticText: customDidactic || 'Declaring schema:isPartOf establishes upstream traceability to parent standards or umbrella profiles.',
        implementationGuidance: 'To implement: Declare the parent profile via `Link: <https://example.org/parent-profile>; rel="http://schema.org/isPartOf"` in HTTP headers.',
        quickOptions: [
          { label: 'Parent Specification', uri: safeUrl(report.targetUrl, '/profile') }
        ],
        inputPlaceholder: 'https://example.org/parent-profile',
        currentValue
      };

    case 'service-desc': {
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

      return {
        id: qId,
        rel: 'service-desc',
        patternId,
        severity: severity || 'WARNING',
        title: `Link Machine-Readable API Contract (${patternId})`,
        prompt: 'Where is the machine-actionable API specification (OpenAPI, OGC API Features/Records) located?',
        didacticText: customDidactic || 'Declaring OpenAPI or OGC API descriptions allows harvesters to query sub-collections without downloading entire archives.',
        implementationGuidance: 'To implement: Link your OpenAPI or OGC API specification using `Link: <https://example.org/api/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"`.',
        quickOptions: apiOptions,
        inputPlaceholder: 'https://example.org/api/openapi.json',
        currentValue
      };
    }

    case 'service-doc':
      return {
        id: qId,
        rel: 'service-doc',
        patternId,
        severity: severity || 'RECOMMENDED',
        title: `Attach Human-Readable API Documentation (${patternId})`,
        prompt: 'Where can developers find human-readable documentation or interactive console (Swagger UI, ReDoc) for this API?',
        didacticText: customDidactic || 'Linking human-readable developer documentation via rel="service-doc" enables researchers to explore endpoints before integrating machine clients.',
        implementationGuidance: 'To implement: Link documentation using `Link: <https://example.org/docs>; rel="service-doc"; type="text/html"`.',
        quickOptions: [
          { label: 'Interactive API Docs (Swagger/Docs)', uri: safeUrl(report.targetUrl, '/api/docs') },
          { label: 'Developer Portal', uri: safeUrl(report.targetUrl, '/docs') }
        ],
        inputPlaceholder: 'https://example.org/api/docs',
        currentValue
      };

    case 'item':
      return {
        id: qId,
        rel: 'item',
        patternId,
        severity: severity || 'RECOMMENDED',
        title: patternId === 'PT-06' ? 'Declare Hostwide Discovery Endpoint (PT-06)' : `Link Catalog Member Resources (${patternId})`,
        prompt: patternId === 'PT-06'
          ? 'Where is the root sitemap.xml providing hostwide catalog traversal with <xhtml:link> signposting?'
          : 'Does this catalog or collection link to its member resources via rel="item"?',
        didacticText: customDidactic || (patternId === 'PT-06'
          ? 'Embedding signposting links inside sitemap.xml enables crawler harvesting across thousands of resources in a single pass.'
          : 'PT-07 Catalog Assistance enables bidirectional item-collection navigation between datasets and repositories.'),
        implementationGuidance: patternId === 'PT-06'
          ? 'To implement: Add `<xhtml:link rel="describedby" href="https://example.org/item.jsonld"/>` inside each `<url>` block in `/sitemap.xml`, and add `Sitemap: https://example.org/sitemap.xml` to `/robots.txt`.'
          : 'To implement: Expose member items from your catalog page via `Link: <https://example.org/items/item-01>; rel="item"`.',
        quickOptions: patternId === 'PT-06'
          ? [
              { label: 'Root Sitemap XML', uri: safeUrl(report.targetUrl, '/sitemap.xml') },
              { label: 'Well-Known Sitemap', uri: safeUrl(report.targetUrl, '/.well-known/sitemap.xml') }
            ]
          : [
              { label: 'Member Resource List', uri: safeUrl(report.targetUrl, '/items') }
            ],
        inputPlaceholder: patternId === 'PT-06' ? 'https://example.org/sitemap.xml' : 'https://example.org/catalog/item-01',
        currentValue
      };

    case 'collection':
      return {
        id: qId,
        rel: 'collection',
        patternId,
        severity: severity || 'RECOMMENDED',
        title: `Link to Parent Catalog / Collection (${patternId})`,
        prompt: 'What catalog, repository, or collection holds or aggregates this dataset?',
        didacticText: customDidactic || 'Linking to the parent collection via rel="collection" enables bidirectional navigation from dataset to catalog.',
        implementationGuidance: 'To implement: Expose parent collection link via `Link: <https://example.org/catalog>; rel="collection"`.',
        quickOptions: [
          { label: 'Parent Catalog Landing Page', uri: safeUrl(report.targetUrl, '/catalog') },
          { label: 'Repository Root', uri: safeUrl(report.targetUrl, '/') }
        ],
        inputPlaceholder: 'https://example.org/catalog',
        currentValue
      };

    case 'linkset':
      return {
        id: qId,
        rel: 'linkset',
        patternId,
        severity: severity || 'RECOMMENDED',
        title: `Attach RFC 9264 External Linkset (${patternId})`,
        prompt: 'Would you like to advertise an external or decoupled linkset document for this resource?',
        didacticText: customDidactic || 'RFC 9264 Linksets offload extensive relationship graphs to dedicated discovery documents without overloading HTTP headers.',
        implementationGuidance: 'To implement: Generate a JSON linkset document at `/.well-known/linkset` and announce it using `Link: <https://example.org/.well-known/linkset>; rel="linkset"; type="application/linkset+json"`.',
        quickOptions: [
          { label: 'Well-Known Linkset', uri: safeUrl(report.targetUrl, '/.well-known/linkset') },
          { label: 'Linkset JSON Document', uri: safeUrl(report.targetUrl, '/linkset.json') }
        ],
        inputPlaceholder: 'https://example.org/.well-known/linkset',
        currentValue
      };

    default:
      return {
        id: qId,
        rel,
        patternId,
        severity: severity || 'RECOMMENDED',
        title: `Prescribe Relation rel="${rel}" (${patternId})`,
        prompt: `What resource or document should be linked with relation "${rel}"?`,
        didacticText: customDidactic || `Specifying rel="${rel}" ensures compliance with pattern requirements.`,
        implementationGuidance: `To implement: Provide a valid target URI for rel="${rel}".`,
        quickOptions: [],
        inputPlaceholder: 'https://example.org/resource',
        currentValue
      };
  }
}
