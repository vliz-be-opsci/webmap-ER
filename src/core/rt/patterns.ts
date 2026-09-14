export interface RTPatternDef {
  id: string; // e.g. "PT-01"
  rtCode: string; // e.g. "RT-P01"
  name: string;
  summary: string;
  roles: string[];
  requiredRelations: string[];
  recommendedRelations: string[];
}

export const RT_PATTERNS: RTPatternDef[] = [
  {
    id: 'PT-01',
    rtCode: 'RT-P01',
    name: 'Profile Conformity Declaration',
    summary: 'Declares that a resource conforms to a specific functional profile and links to profile documentation.',
    roles: ['resource', 'profile', 'profile_description', 'profile_type'],
    requiredRelations: ['profile'],
    recommendedRelations: ['describedby', 'type']
  },
  {
    id: 'PT-02',
    rtCode: 'RT-P02',
    name: 'Profile Composition',
    summary: 'Declares member sub-profiles composed inside a parent composite profile.',
    roles: ['parent_profile', 'part_profile'],
    requiredRelations: ['http://schema.org/hasPart'],
    recommendedRelations: ['http://schema.org/isPartOf']
  },
  {
    id: 'PT-03',
    rtCode: 'RT-P03',
    name: 'Content Negotiation Menu',
    summary: 'Advertises alternate representations and profile-specific formats available for a resource.',
    roles: ['resource', 'alternate'],
    requiredRelations: ['alternate'],
    recommendedRelations: ['profile']
  },
  {
    id: 'PT-04',
    rtCode: 'RT-P04',
    name: 'No Landing Page / Direct Metadata',
    summary: 'Directly links resources to machine-readable metadata, persistent identifier, and conceptual type.',
    roles: ['resource', 'metadata', 'cite_as', 'type'],
    requiredRelations: ['describedby'],
    recommendedRelations: ['cite-as', 'type']
  },
  {
    id: 'PT-05',
    rtCode: 'RT-P05',
    name: 'Subsetting API Integration',
    summary: 'Links a resource to machine-readable subsetting and query APIs (e.g. OGC API, OpenAPI).',
    roles: ['resource', 'service_desc', 'service_doc'],
    requiredRelations: ['service-desc'],
    recommendedRelations: ['service-doc']
  },
  {
    id: 'PT-06',
    rtCode: 'RT-P06',
    name: 'Hostwide Resource Discovery',
    summary: 'Enables sitemap.xml and robots.txt harvesting with embedded signposting links.',
    roles: ['robots', 'sitemap', 'resource'],
    requiredRelations: ['item'],
    recommendedRelations: ['profile', 'describedby']
  },
  {
    id: 'PT-07',
    rtCode: 'RT-P07',
    name: 'Catalog Assistance',
    summary: 'Establishes bidirectional item-collection navigation between datasets and catalog repositories.',
    roles: ['catalog', 'item'],
    requiredRelations: ['item'],
    recommendedRelations: ['collection']
  },
  {
    id: 'PT-08',
    rtCode: 'RT-P08',
    name: 'External Linksets',
    summary: 'Offloads complex or large link graphs to dedicated RFC 9264 linkset endpoints.',
    roles: ['resource', 'linkset'],
    requiredRelations: ['linkset'],
    recommendedRelations: []
  }
];

export function getPatternById(id: string): RTPatternDef | undefined {
  return RT_PATTERNS.find(p => p.id === id || p.rtCode === id);
}
