import { DiscoveredLink } from '../wrx/types';

export function generateRtTestYaml(resourceUri: string, links: DiscoveredLink[]): string {
  const effectiveUri = resourceUri || 'https://example.org/resource';
  const blocks: string[] = [];

  const profileLink = links.find(l => l.rel === 'profile');
  const describedByLink = links.find(l => l.rel === 'describedby');
  const citeAsLink = links.find(l => l.rel === 'cite-as');
  const hasPartLink = links.find(l => l.rel === 'http://schema.org/hasPart' || l.rel === 'hasPart');
  const alternateLink = links.find(l => l.rel === 'alternate');
  const serviceDescLink = links.find(l => l.rel === 'service-desc');
  const serviceDocLink = links.find(l => l.rel === 'service-doc');
  const linksetLink = links.find(l => l.rel === 'linkset');
  const itemLink = links.find(l => l.rel === 'item');
  const collectionLink = links.find(l => l.rel === 'collection');

  // PT-01: Profile Conformity Declaration
  if (profileLink || (!hasPartLink && !alternateLink && !serviceDescLink && !linksetLink)) {
    let pt01 = `  - name: "Pattern 01: Profile Conformity Declaration"\n    type: "PT-01"\n    uris:\n      resource: "${effectiveUri}"\n`;
    if (profileLink) pt01 += `      profile: "${profileLink.target}"\n`;
    if (describedByLink) pt01 += `      profile_description: "${describedByLink.target}"\n`;
    if (citeAsLink) pt01 += `      cite_as: "${citeAsLink.target}"\n`;
    blocks.push(pt01.trimEnd());
  }

  // PT-02: Profile Composition
  if (hasPartLink) {
    const pt02 = `  - name: "Pattern 02: Profile Composition"\n    type: "PT-02"\n    uris:\n      parent_profile: "${effectiveUri}"\n      part_profile: "${hasPartLink.target}"\n`;
    blocks.push(pt02.trimEnd());
  }

  // PT-03: Content Negotiation Menu
  if (alternateLink) {
    let pt03 = `  - name: "Pattern 03: Content Negotiation Menu"\n    type: "PT-03"\n    uris:\n      resource: "${effectiveUri}"\n      alternate: "${alternateLink.target}"\n`;
    if (profileLink) pt03 += `      profile: "${profileLink.target}"\n`;
    blocks.push(pt03.trimEnd());
  }

  // PT-04: Direct Metadata / No Landing Page
  if (describedByLink || citeAsLink) {
    let pt04 = `  - name: "Pattern 04: No Landing Page / Direct Metadata"\n    type: "PT-04"\n    uris:\n      resource: "${effectiveUri}"\n`;
    if (describedByLink) pt04 += `      metadata: "${describedByLink.target}"\n`;
    if (citeAsLink) pt04 += `      cite_as: "${citeAsLink.target}"\n`;
    blocks.push(pt04.trimEnd());
  }

  // PT-05: Subsetting API Integration
  if (serviceDescLink || serviceDocLink) {
    let pt05 = `  - name: "Pattern 05: Subsetting API Integration"\n    type: "PT-05"\n    uris:\n      resource: "${effectiveUri}"\n`;
    if (serviceDescLink) pt05 += `      service_desc: "${serviceDescLink.target}"\n`;
    if (serviceDocLink) pt05 += `      service_doc: "${serviceDocLink.target}"\n`;
    blocks.push(pt05.trimEnd());
  }

  // PT-06: Hostwide Resource Discovery (Sitemaps)
  if (itemLink) {
    const pt06 = `  - name: "Pattern 06: Hostwide Resource Discovery (Sitemaps)"\n    type: "PT-06"\n    uris:\n      sitemap: "${effectiveUri}"\n      resource: "${itemLink.target}"\n`;
    blocks.push(pt06.trimEnd());
  }

  // PT-07: Catalog Assistance
  if (collectionLink) {
    const pt07 = `  - name: "Pattern 07: Catalog Assistance"\n    type: "PT-07"\n    uris:\n      catalog: "${collectionLink.target}"\n      item: "${effectiveUri}"\n`;
    blocks.push(pt07.trimEnd());
  }

  // PT-08: External Linksets (RFC 9264)
  if (linksetLink) {
    const pt08 = `  - name: "Pattern 08: External Linksets (RFC 9264)"\n    type: "PT-08"\n    uris:\n      resource: "${effectiveUri}"\n      linkset: "${linksetLink.target}"\n`;
    blocks.push(pt08.trimEnd());
  }

  return `version: "1.0"\nname: "Automated Radical Transparency Conformance Test Suite"\n\npatterns:\n${blocks.join('\n\n')}\n`;
}
