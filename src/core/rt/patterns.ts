export interface RTPatternDef {
  id: string; // e.g. "PT-01"
  rtCode: string; // e.g. "RT-P01"
  name: string;
  summary: string;
  roles: string[];
  requiredRelations: string[];
  recommendedRelations: string[];
  standards: Array<{ label: string; url: string }>;
  docUrl: string;
  grmpTestType: string;
}

export const RT_PATTERNS: RTPatternDef[] = [
  {
    id: 'PT-01',
    rtCode: 'RT-P01',
    name: 'Profile Conformity Declaration',
    summary: 'Declares that a resource conforms to a specific functional profile and links to profile documentation.',
    roles: ['resource', 'profile', 'profile_description', 'profile_type'],
    requiredRelations: ['profile'],
    recommendedRelations: ['describedby', 'type'],
    standards: [
      { label: 'RFC 6906 (Profile Rel)', url: 'https://datatracker.ietf.org/doc/html/rfc6906' },
      { label: 'W3C DX-PROF', url: 'https://www.w3.org/TR/dx-prof/' }
    ],
    docUrl: 'https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-01-profile-conformity',
    grmpTestType: 'PT-01'
  },
  {
    id: 'PT-02',
    rtCode: 'RT-P02',
    name: 'Profile Composition',
    summary: 'Declares member sub-profiles composed inside a parent composite profile.',
    roles: ['parent_profile', 'part_profile'],
    requiredRelations: ['http://schema.org/hasPart'],
    recommendedRelations: ['http://schema.org/isPartOf'],
    standards: [
      { label: 'Schema.org hasPart', url: 'https://schema.org/hasPart' },
      { label: 'RFC 8288 (Web Linking)', url: 'https://datatracker.ietf.org/doc/html/rfc8288' }
    ],
    docUrl: 'https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-02-profile-composition',
    grmpTestType: 'PT-02'
  },
  {
    id: 'PT-03',
    rtCode: 'RT-P03',
    name: 'Content Negotiation Menu',
    summary: 'Advertises alternate representations and profile-specific formats available for a resource.',
    roles: ['resource', 'alternate'],
    requiredRelations: ['alternate'],
    recommendedRelations: ['profile', 'type'],
    standards: [
      { label: 'RFC 8288 (alternate)', url: 'https://datatracker.ietf.org/doc/html/rfc8288' },
      { label: 'W3C Conneg by Profile', url: 'https://www.w3.org/TR/dx-prof-conneg/' }
    ],
    docUrl: 'https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-03-content-negotiation',
    grmpTestType: 'PT-03'
  },
  {
    id: 'PT-04',
    rtCode: 'RT-P04',
    name: 'No Landing Page / Direct Metadata',
    summary: 'Directly links resources to machine-readable metadata, persistent identifier, and conceptual type.',
    roles: ['resource', 'metadata', 'cite_as', 'type'],
    requiredRelations: ['describedby'],
    recommendedRelations: ['cite-as', 'type'],
    standards: [
      { label: 'RFC 8288 (describedby)', url: 'https://datatracker.ietf.org/doc/html/rfc8288' },
      { label: 'RFC 9264 (cite-as)', url: 'https://datatracker.ietf.org/doc/html/rfc9264' }
    ],
    docUrl: 'https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-04-direct-metadata',
    grmpTestType: 'PT-04'
  },
  {
    id: 'PT-05',
    rtCode: 'RT-P05',
    name: 'Subsetting API Integration',
    summary: 'Links a resource to machine-readable subsetting and query APIs (e.g. OGC API, OpenAPI).',
    roles: ['resource', 'service_desc', 'service_doc'],
    requiredRelations: ['service-desc'],
    recommendedRelations: ['service-doc'],
    standards: [
      { label: 'RFC 8631 (service-desc)', url: 'https://datatracker.ietf.org/doc/html/rfc8631' },
      { label: 'OpenAPI 3.1 Spec', url: 'https://spec.openapis.org/oas/v3.1.0' },
      { label: 'OGC API Common', url: 'https://ogcapi.ogc.org/common/' }
    ],
    docUrl: 'https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-05-subsetting-apis',
    grmpTestType: 'PT-05'
  },
  {
    id: 'PT-06',
    rtCode: 'RT-P06',
    name: 'Hostwide Resource Discovery (Sitemaps)',
    summary: 'Enables sitemap.xml and robots.txt automated harvesting with embedded signposting links.',
    roles: ['robots', 'sitemap', 'resource'],
    requiredRelations: ['item'],
    recommendedRelations: ['profile', 'describedby', 'cite-as'],
    standards: [
      { label: 'Sitemaps.org Protocol', url: 'https://www.sitemaps.org/protocol.html' },
      { label: 'RFC 9309 (Robots Exclusion)', url: 'https://datatracker.ietf.org/doc/html/rfc9309' },
      { label: 'RFC 8288 (item rel)', url: 'https://datatracker.ietf.org/doc/html/rfc8288' }
    ],
    docUrl: 'https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-06-hostwide-discovery',
    grmpTestType: 'PT-06'
  },
  {
    id: 'PT-07',
    rtCode: 'RT-P07',
    name: 'Catalog Assistance',
    summary: 'Establishes bidirectional item-collection navigation between datasets and catalog repositories.',
    roles: ['catalog', 'item'],
    requiredRelations: ['item'],
    recommendedRelations: ['collection'],
    standards: [
      { label: 'RFC 9264 (item/collection)', url: 'https://datatracker.ietf.org/doc/html/rfc9264' },
      { label: 'W3C DCAT-3', url: 'https://www.w3.org/TR/vocab-dcat-3/' }
    ],
    docUrl: 'https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-07-catalog-assistance',
    grmpTestType: 'PT-07'
  },
  {
    id: 'PT-08',
    rtCode: 'RT-P08',
    name: 'External Linksets (RFC 9264)',
    summary: 'Offloads complex or large link graphs to dedicated RFC 9264 linkset endpoints.',
    roles: ['resource', 'linkset'],
    requiredRelations: ['linkset'],
    recommendedRelations: [],
    standards: [
      { label: 'RFC 9264 (Linkset)', url: 'https://datatracker.ietf.org/doc/html/rfc9264' },
      { label: 'RFC 8288 (Web Linking)', url: 'https://datatracker.ietf.org/doc/html/rfc8288' }
    ],
    docUrl: 'https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-08-external-linksets',
    grmpTestType: 'PT-08'
  },
  {
    id: 'PT-09',
    rtCode: 'RT-P09',
    name: 'Release Linking & Version Navigation',
    summary: 'Navigates release lifecycles and dataset versions via RFC 5829 relations (latest-version, predecessor-version, successor-version, version-history).',
    roles: ['series', 'latest_version', 'version_history', 'release'],
    requiredRelations: ['latest-version'],
    recommendedRelations: ['predecessor-version', 'successor-version', 'version-history'],
    standards: [
      { label: 'RFC 5829 (Versioning Links)', url: 'https://datatracker.ietf.org/doc/html/rfc5829' },
      { label: 'W3C DCAT-3 (Version Chains)', url: 'https://www.w3.org/TR/vocab-dcat-3/#Class:Dataset' }
    ],
    docUrl: 'https://github.com/eosc-semantic-interop/if-solutions-proposals/tree/main/proposals/radical-transparency/linkset-usage-patterns#pt-09-versioning',
    grmpTestType: 'PT-09'
  }
];

export function getPatternById(id: string): RTPatternDef | undefined {
  return RT_PATTERNS.find(p => p.id === id || p.rtCode === id);
}
