import { describe, it, expect } from 'vitest';
import { generateHttpHeaders } from '../src/core/export/link-headers';
import { generateSitemapXml } from '../src/core/export/sitemap';
import { generateRtTestYaml } from '../src/core/export/yaml-test';
import { generateSystemicItTicket } from '../src/core/export/it-ticket';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';

describe('Exporters & Systemic Remediation Artifacts', () => {
  const url = 'https://example.org/dataset/01';
  const links = [
    { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' as const },
    { target: 'https://doi.org/10.1234/test', rel: 'cite-as', source: 'link-header' as const }
  ];

  it('should generate valid HTTP Link headers for Apache and Nginx', () => {
    const out = generateHttpHeaders(links);
    expect(out.raw).toContain('rel="profile"');
    expect(out.nginx).toContain('add_header Link');
    expect(out.apache).toContain('Header add Link');
  });

  it('should generate sitemap.xml with xhtml:link elements', () => {
    const xml = generateSitemapXml(url, links);
    expect(xml).toContain('<loc>https://example.org/dataset/01</loc>');
    expect(xml).toContain('xhtml:link rel="profile" href="https://w3id.org/ro/crate/1.1"');
  });

  it('should generate rt-test YAML matching grmp-test-implementations syntax', () => {
    const yaml = generateRtTestYaml(url, links);
    expect(yaml).toContain('type: "PT-01"');
    expect(yaml).toContain('resource: "https://example.org/dataset/01"');
  });

  it('should generate systemic IT ticket formulated across the whole server', () => {
    const report = evaluateHealthAndGaps(url, links);
    const md = generateSystemicItTicket(report, links);
    expect(md).toContain('[Architecture / Interoperability]');
    expect(md).toContain('Systemic Remediation');
    expect(md).toContain('Exemplar Headers');
  });
});
