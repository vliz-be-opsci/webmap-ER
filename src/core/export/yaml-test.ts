import { DiscoveredLink } from '../wrx/types';

export function generateRtTestYaml(resourceUri: string, links: DiscoveredLink[]): string {
  const profileLink = links.find(l => l.rel === 'profile');
  const describedByLink = links.find(l => l.rel === 'describedby');
  const citeAsLink = links.find(l => l.rel === 'cite-as');

  return `version: "1.0"
name: "Automated Radical Transparency Conformance Test Suite"

patterns:
  - name: "Resource Profile & Metadata Conformance"
    type: "PT-01"
    uris:
      resource: "${resourceUri || 'https://example.org/resource'}"
${profileLink ? `      profile: "${profileLink.target}"\n` : ''}${describedByLink ? `      profile_description: "${describedByLink.target}"\n` : ''}${citeAsLink ? `      cite_as: "${citeAsLink.target}"\n` : ''}`;
}
