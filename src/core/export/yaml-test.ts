import { DiscoveredLink } from '../wrx/types';

function inferMimeType(uri: string, explicitType?: string): string {
  if (explicitType) return explicitType;
  const lower = uri.toLowerCase();
  if (lower.endsWith('.ttl')) return 'text/turtle';
  if (lower.endsWith('.jsonld') || lower.endsWith('.json')) return 'application/ld+json';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
  if (lower.endsWith('.rdf') || lower.endsWith('.xml')) return 'application/rdf+xml';
  if (lower.endsWith('.csv')) return 'text/csv';
  return 'application/ld+json';
}

function parseUrlMetadata(uri: string) {
  let host = 'https://example.org';
  let hostDisplay = 'example.org';
  let datasetName = 'Resource';
  try {
    const u = new URL(uri);
    host = u.origin;
    hostDisplay = u.host;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      datasetName = parts[parts.length - 1];
    }
  } catch {}
  return { host, hostDisplay, datasetName };
}

export function generateRtTestYaml(
  resourceUri: string,
  links: DiscoveredLink[],
  activePatternId?: string
): string {
  const effectiveUri = resourceUri || 'https://example.org/resource';
  const { host, hostDisplay, datasetName } = parseUrlMetadata(effectiveUri);

  const profileLink = links.find(l => l.rel.toLowerCase() === 'profile');
  const describedByLinks = links.filter(l => l.rel.toLowerCase() === 'describedby');
  const citeAsLink = links.find(l => l.rel.toLowerCase() === 'cite-as');
  const hasPartLinks = links.filter(l => l.rel.toLowerCase() === 'http://schema.org/haspart' || l.rel.toLowerCase() === 'haspart');
  const alternateLinks = links.filter(l => l.rel.toLowerCase() === 'alternate');
  const serviceDescLink = links.find(l => l.rel.toLowerCase() === 'service-desc');
  const serviceDocLink = links.find(l => l.rel.toLowerCase() === 'service-doc');
  const linksetLink = links.find(l => l.rel.toLowerCase() === 'linkset');
  const itemLinks = links.filter(l => l.rel.toLowerCase() === 'item');
  const collectionLink = links.find(l => l.rel.toLowerCase() === 'collection');
  const latestVersionLink = links.find(l => l.rel.toLowerCase() === 'latest-version');
  const versionHistoryLink = links.find(l => l.rel.toLowerCase() === 'version-history');

  const patternBlocks: string[] = [];

  // Helper to determine if pattern should be included
  const shouldInclude = (id: string, condition: boolean) => {
    if (activePatternId && activePatternId !== 'ALL') {
      return activePatternId === id;
    }
    return condition;
  };

  // PT-01: Profile Conformity Declaration
  if (shouldInclude('PT-01', !!profileLink || (!hasPartLinks.length && !alternateLinks.length && !serviceDescLink && !linksetLink && !latestVersionLink))) {
    const profTarget = profileLink?.target || `${effectiveUri}/profile`;
    const profDesc = describedByLinks[0]?.target || `${effectiveUri}/profile.ttl`;
    patternBlocks.push(`  # ============================================================================
  # PT-01: Profile Conformity Declaration
  # ============================================================================
  - name: "[PT-01] ${datasetName} Profile Conformity"
    type: "PT-01"
    uris:
      resource: "${effectiveUri}"
      profile: "${profTarget}"
      profile_description: "${profDesc}"
      profile_description_profile: "http://www.w3.org/ns/dx/prof/Profile"
      profile_type: "https://www.rfc-editor.org/info/rfc6906"`);
  }

  // PT-02: Profile Composition
  if (shouldInclude('PT-02', hasPartLinks.length > 0)) {
    const compProf = profileLink?.target || `${effectiveUri}/profile/composite`;
    const members = hasPartLinks.length > 0
      ? hasPartLinks.map(l => `        - "${l.target}"`).join('\n')
      : `        - "${effectiveUri}/profile/member-1"
        - "${effectiveUri}/profile/member-2"`;
    patternBlocks.push(`  # ============================================================================
  # PT-02: Profile Composition
  # ============================================================================
  - name: "[PT-02] ${datasetName} Composite Profile"
    type: "PT-02"
    uris:
      resource: "${effectiveUri}"
      composite_profile: "${compProf}"
      member_profiles:
${members}
      check_composite: true`);
  }

  // PT-03: Content Negotiation Menu
  if (shouldInclude('PT-03', alternateLinks.length > 0)) {
    const varMenu = linksetLink?.target || `${effectiveUri}.linkset.json`;
    const variantsYaml = alternateLinks.length > 0
      ? alternateLinks.map(l => `        - uri: "${l.target}"\n          type: "${inferMimeType(l.target, l.type)}"`).join('\n')
      : `        - uri: "${effectiveUri}.ttl"\n          type: "text/turtle"\n        - uri: "${effectiveUri}.jsonld"\n          type: "application/ld+json"\n        - uri: "${effectiveUri}.html"\n          type: "text/html"`;
    patternBlocks.push(`  # ============================================================================
  # PT-03: Content Negotiation Menu & Variant Identity Restoration
  # ============================================================================
  - name: "[PT-03] ${datasetName} Conneg Menu"
    type: "PT-03"
    uris:
      concept: "${effectiveUri}"
      variant_menu: "${varMenu}"
      variants:
${variantsYaml}
      check_variants: true`);
  }

  // PT-04: No Landing Page Solution (Direct Data Payload Citation & Metadata)
  if (shouldInclude('PT-04', describedByLinks.length > 0 || !!citeAsLink)) {
    const pid = citeAsLink?.target || 'https://doi.org/10.example/pid';
    const content = effectiveUri;
    const descYaml = describedByLinks.length > 0
      ? describedByLinks.map(l => `        - uri: "${l.target}"\n          type: "${inferMimeType(l.target, l.type)}"`).join('\n')
      : `        - uri: "${effectiveUri}.ttl"\n          type: "text/turtle"\n        - uri: "${effectiveUri}.html"\n          type: "text/html"`;
    patternBlocks.push(`  # ============================================================================
  # PT-04: No Landing Page Solution (Direct Data Payload Citation & Metadata)
  # ============================================================================
  - name: "[PT-04] ${datasetName} Direct Data Payload Citation"
    type: "PT-04"
    uris:
      pid: "${pid}"
      content: "${content}"
      resource: "${effectiveUri}"
      descriptions:
${descYaml}
      check_descriptions: true`);
  }

  // PT-05: Subsetting API & Dynamic Services
  if (shouldInclude('PT-05', !!serviceDescLink || !!serviceDocLink)) {
    const baseApi = serviceDescLink?.target
      ? serviceDescLink.target.replace(/\/openapi(\.json)?$/i, '')
      : `${effectiveUri}/api`;
    patternBlocks.push(`  # ============================================================================
  # PT-05: Subsetting API & Dynamic Services
  # ============================================================================
  - name: "[PT-05] ${datasetName} Observation Service"
    type: "PT-05"
    uris:
      dataset: "${effectiveUri}"
      base_api: "${baseApi}"
      api_catalog: "${host}/.well-known/api-catalog"
      service_desc: "${serviceDescLink?.target || baseApi + '/openapi.json'}"
      service_doc: "${serviceDocLink?.target || baseApi + '/docs/'}"
      service_meta: "${baseApi}/meta.ttl"`);
  }

  // PT-06: Hostwide Discovery
  if (shouldInclude('PT-06', itemLinks.length > 0)) {
    const resourcesYaml = itemLinks.length > 0
      ? itemLinks.map(l => `        - uri: "${l.target}"\n          linkset: "${l.target}.linkset.json"\n          profile: "${profileLink?.target || host + '/profile'}"`).join('\n')
      : `        - uri: "${effectiveUri}"\n          linkset: "${effectiveUri}.linkset.json"\n          profile: "${profileLink?.target || host + '/profile'}"`;
    patternBlocks.push(`  # ============================================================================
  # PT-06: Hostwide Discovery
  # ============================================================================
  - name: "[PT-06] Hostwide Sitemaps & Robots Discovery"
    type: "PT-06"
    uris:
      host: "${host}"
      robots_txt: true
      sitemap: "${host}/sitemap.xml"
      resources:
${resourcesYaml}`);
  }

  // PT-07: Catalog Assistance & Feed Discovery
  if (shouldInclude('PT-07', !!collectionLink)) {
    patternBlocks.push(`  # ============================================================================
  # PT-07: Catalog Assistance & Feed Discovery
  # ============================================================================
  - name: "[PT-07] Hostwide API Catalog & Feeds"
    type: "PT-07"
    uris:
      api_catalog: "${host}/.well-known/api-catalog"
      api_catalog_sitemap: "${host}/sitemap-catalog.xml"
      api_endpoints:
        - uri: "${effectiveUri}"`);
  }

  // PT-08: Large Linksets Split-Up
  if (shouldInclude('PT-08', !!linksetLink)) {
    const masterLinkset = linksetLink?.target || `${effectiveUri}.linkset.json`;
    patternBlocks.push(`  # ============================================================================
  # PT-08: Large Linksets Split-Up
  # ============================================================================
  - name: "[PT-08] ${datasetName} Hierarchical Linkset Decomposition"
    type: "PT-08"
    uris:
      resource: "${effectiveUri}"
      master_linkset: "${masterLinkset}"
      child_linksets:
        - "${effectiveUri}.conneg.linkset.json"
        - "${effectiveUri}.profiles.linkset.json"
        - "${effectiveUri}.provenance.linkset.json"
      check_children: true`);
  }

  // PT-09: Release Linking & Version Navigation
  if (shouldInclude('PT-09', !!latestVersionLink || !!versionHistoryLink)) {
    const latest = latestVersionLink?.target || `${effectiveUri}/v2.1`;
    const hist = versionHistoryLink?.target || `${effectiveUri}/history`;
    const seriesPid = citeAsLink?.target || `${effectiveUri}/doi`;
    patternBlocks.push(`  # ============================================================================
  # PT-09: Release Linking & Version Navigation
  # ============================================================================
  - name: "[PT-09] ${datasetName} Versioned Release Lifecycle"
    type: "PT-09"
    uris:
      series: "${effectiveUri}"
      series_pid: "${seriesPid}"
      latest_version: "${latest}"
      version_history: "${hist}"
      history_profile: "https://www.rfc-editor.org/info/rfc5829"
      releases:
        - uri: "${latest}"
          version: "2.1"
          predecessor: "${effectiveUri}/v2.0"
          pid: "${seriesPid}.v2.1"
        - uri: "${effectiveUri}/v2.0"
          version: "2.0"
          predecessor: "${effectiveUri}/v1.0"
          successor: "${latest}"
          pid: "${seriesPid}.v2.0"
        - uri: "${effectiveUri}/v1.0"
          version: "1.0"
          successor: "${effectiveUri}/v2.0"
          pid: "${seriesPid}.v1.0"
      check_history: true
      check_releases: true`);
  }

  // If no blocks were matched (e.g. initial empty state), provide default PT-01, PT-04 and PT-06
  if (patternBlocks.length === 0) {
    patternBlocks.push(`  # ============================================================================
  # PT-01: Profile Conformity Declaration
  # ============================================================================
  - name: "[PT-01] ${datasetName} Profile Conformity"
    type: "PT-01"
    uris:
      resource: "${effectiveUri}"
      profile: "${effectiveUri}/profile"
      profile_description: "${effectiveUri}/profile.ttl"
      profile_description_profile: "http://www.w3.org/ns/dx/prof/Profile"
      profile_type: "https://www.rfc-editor.org/info/rfc6906"`);

    patternBlocks.push(`  # ============================================================================
  # PT-04: No Landing Page Solution (Direct Data Payload Citation & Metadata)
  # ============================================================================
  - name: "[PT-04] ${datasetName} Direct Data Payload Citation"
    type: "PT-04"
    uris:
      pid: "https://doi.org/10.example/${datasetName}"
      content: "${effectiveUri}"
      resource: "${effectiveUri}"
      descriptions:
        - uri: "${effectiveUri}.jsonld"
          type: "application/ld+json"
        - uri: "${effectiveUri}.ttl"
          type: "text/turtle"
      check_descriptions: true`);
  }

  return `title: "Empirical Radical Transparency Test Suite for ${hostDisplay}"
description: "Comprehensive empirical audit comparing live ${hostDisplay} resources against Radical Transparency Patterns."

options:
  timeout: 10
  verify_ssl: false
  max_depth: 3

patterns:
${patternBlocks.join('\n\n')}
`;
}
