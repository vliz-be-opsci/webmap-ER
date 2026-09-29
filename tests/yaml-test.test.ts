import { describe, it, expect } from 'vitest';
import { generateRtTestYaml } from '../src/core/export/yaml-test';
import { DiscoveredLink } from '../src/core/wrx/types';

describe('Empirical GRMP Docker Runner rt-test YAML Exporter', () => {
  it('should generate valid root options conforming to the GRMP runner specification', () => {
    const yaml = generateRtTestYaml('https://example.org/dataset/arms-mbon', []);
    expect(yaml).toContain('title: "Empirical Radical Transparency Test Suite for example.org"');
    expect(yaml).toContain('description:');
    expect(yaml).toContain('options:');
    expect(yaml).toContain('timeout: 10');
    expect(yaml).toContain('verify_ssl: false');
    expect(yaml).toContain('max_depth: 3');
    expect(yaml).toContain('patterns:');
  });

  it('should emit PT-01 conforming to GRMP schema with profile description profile and type', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/profile/marine-genomic', rel: 'profile', source: 'link-header' },
      { target: 'https://example.org/profile/marine-genomic.ttl', rel: 'describedby', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/dataset/arms-mbon', links, 'PT-01');
    expect(yaml).toContain('type: "PT-01"');
    expect(yaml).toContain('resource: "https://example.org/dataset/arms-mbon"');
    expect(yaml).toContain('profile: "https://example.org/profile/marine-genomic"');
    expect(yaml).toContain('profile_description: "https://example.org/profile/marine-genomic.ttl"');
    expect(yaml).toContain('profile_description_profile: "http://www.w3.org/ns/dx/prof/Profile"');
    expect(yaml).toContain('profile_type: "https://www.rfc-editor.org/info/rfc6906"');
  });

  it('should emit PT-02 conforming to GRMP schema with composite_profile and member_profiles list', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/profile/member-1', rel: 'http://schema.org/hasPart', source: 'link-header' },
      { target: 'https://example.org/profile/member-2', rel: 'hasPart', source: 'link-header' },
      { target: 'https://example.org/profile/composite', rel: 'profile', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/dataset/arms-2018', links, 'PT-02');
    expect(yaml).toContain('type: "PT-02"');
    expect(yaml).toContain('resource: "https://example.org/dataset/arms-2018"');
    expect(yaml).toContain('composite_profile: "https://example.org/profile/composite"');
    expect(yaml).toContain('member_profiles:');
    expect(yaml).toContain('- "https://example.org/profile/member-1"');
    expect(yaml).toContain('- "https://example.org/profile/member-2"');
    expect(yaml).toContain('check_composite: true');
  });

  it('should emit PT-03 conforming to GRMP schema with concept, variant_menu, and variants list', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/dataset/arms-mbon.ttl', rel: 'alternate', type: 'text/turtle', source: 'link-header' },
      { target: 'https://example.org/dataset/arms-mbon.jsonld', rel: 'alternate', type: 'application/ld+json', source: 'link-header' },
      { target: 'https://example.org/dataset/arms-mbon.linkset.json', rel: 'linkset', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/dataset/arms-mbon', links, 'PT-03');
    expect(yaml).toContain('type: "PT-03"');
    expect(yaml).toContain('concept: "https://example.org/dataset/arms-mbon"');
    expect(yaml).toContain('variant_menu: "https://example.org/dataset/arms-mbon.linkset.json"');
    expect(yaml).toContain('variants:');
    expect(yaml).toContain('uri: "https://example.org/dataset/arms-mbon.ttl"');
    expect(yaml).toContain('type: "text/turtle"');
    expect(yaml).toContain('check_variants: true');
  });

  it('should emit PT-04 conforming to GRMP schema with pid, content, resource, and descriptions list', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://doi.org/10.14284/578', rel: 'cite-as', source: 'link-header' },
      { target: 'https://example.org/dataset/arms-mbon.ttl', rel: 'describedby', type: 'text/turtle', source: 'link-header' },
      { target: 'https://example.org/dataset/arms-mbon.html', rel: 'describedby', type: 'text/html', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/dataset/arms-mbon', links, 'PT-04');
    expect(yaml).toContain('type: "PT-04"');
    expect(yaml).toContain('pid: "https://doi.org/10.14284/578"');
    expect(yaml).toContain('resource: "https://example.org/dataset/arms-mbon"');
    expect(yaml).toContain('content: "https://example.org/dataset/arms-mbon"');
    expect(yaml).toContain('descriptions:');
    expect(yaml).toContain('uri: "https://example.org/dataset/arms-mbon.ttl"');
    expect(yaml).toContain('type: "text/turtle"');
    expect(yaml).toContain('check_descriptions: true');
  });

  it('should emit PT-05 conforming to GRMP schema with dataset, base_api, api_catalog, and service descriptors', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/api/observations/v1/openapi.json', rel: 'service-desc', source: 'link-header' },
      { target: 'https://example.org/api/observations/v1/docs/', rel: 'service-doc', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/id/dataset/arms-mbon', links, 'PT-05');
    expect(yaml).toContain('type: "PT-05"');
    expect(yaml).toContain('dataset: "https://example.org/id/dataset/arms-mbon"');
    expect(yaml).toContain('base_api: "https://example.org/api/observations/v1"');
    expect(yaml).toContain('api_catalog: "https://example.org/.well-known/api-catalog"');
    expect(yaml).toContain('service_desc: "https://example.org/api/observations/v1/openapi.json"');
    expect(yaml).toContain('service_doc: "https://example.org/api/observations/v1/docs/"');
    expect(yaml).toContain('service_meta: "https://example.org/api/observations/v1/meta.ttl"');
  });

  it('should emit PT-06 conforming to GRMP schema with host, robots_txt, and resources list', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/id/dataset/arms-mbon', rel: 'item', source: 'sitemap-xml' },
      { target: 'https://example.org/id/dataset/arms-mbon.linkset.json', rel: 'linkset', source: 'link-header' },
      { target: 'https://example.org/id/profile/marine-genomic', rel: 'profile', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/id/dataset/arms-mbon', links, 'PT-06');
    expect(yaml).toContain('type: "PT-06"');
    expect(yaml).toContain('host: "https://example.org"');
    expect(yaml).toContain('robots_txt: true');
    expect(yaml).toContain('sitemap: "https://example.org/sitemap.xml"');
    expect(yaml).toContain('resources:');
    expect(yaml).toContain('uri: "https://example.org/id/dataset/arms-mbon"');
  });

  it('should emit PT-07 conforming to GRMP schema with api_catalog and api_endpoints', () => {
    const yaml = generateRtTestYaml('https://example.org/api/observations/v1', [], 'PT-07');
    expect(yaml).toContain('type: "PT-07"');
    expect(yaml).toContain('api_catalog: "https://example.org/.well-known/api-catalog"');
    expect(yaml).toContain('api_catalog_sitemap: "https://example.org/sitemap-catalog.xml"');
    expect(yaml).toContain('api_endpoints:');
    expect(yaml).toContain('- uri: "https://example.org/api/observations/v1"');
  });

  it('should emit PT-08 conforming to GRMP schema with master_linkset and child_linksets', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/id/dataset/arms-mbon.linkset.json', rel: 'linkset', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/id/dataset/arms-mbon', links, 'PT-08');
    expect(yaml).toContain('type: "PT-08"');
    expect(yaml).toContain('resource: "https://example.org/id/dataset/arms-mbon"');
    expect(yaml).toContain('master_linkset: "https://example.org/id/dataset/arms-mbon.linkset.json"');
    expect(yaml).toContain('child_linksets:');
    expect(yaml).toContain('check_children: true');
  });

  it('should emit PT-09 conforming to GRMP schema with series, releases, and version checks', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://example.org/id/dataset/90/v2.1', rel: 'latest-version', source: 'link-header' },
      { target: 'https://example.org/doi/10.14284/90', rel: 'cite-as', source: 'link-header' }
    ];

    const yaml = generateRtTestYaml('https://example.org/id/dataset/90', links, 'PT-09');
    expect(yaml).toContain('type: "PT-09"');
    expect(yaml).toContain('series: "https://example.org/id/dataset/90"');
    expect(yaml).toContain('series_pid: "https://example.org/doi/10.14284/90"');
    expect(yaml).toContain('latest_version: "https://example.org/id/dataset/90/v2.1"');
    expect(yaml).toContain('version_history: "https://example.org/id/dataset/90/history"');
    expect(yaml).toContain('history_profile: "https://www.rfc-editor.org/info/rfc5829"');
    expect(yaml).toContain('releases:');
    expect(yaml).toContain('check_history: true');
    expect(yaml).toContain('check_releases: true');
  });
});
