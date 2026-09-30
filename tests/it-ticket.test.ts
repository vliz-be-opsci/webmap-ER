import { describe, it, expect } from 'vitest';
import { generateSystemicItTicket } from '../src/core/export/it-ticket';
import { evaluateHealthAndGaps } from '../src/core/triage/diagnostics';
import { DiscoveredLink } from '../src/core/wrx/types';

describe('Systemic IT Ticket with ASCII Topology & Literature Links', () => {
  it('should include ASCII network topology and standard RT literature citations', () => {
    const links: DiscoveredLink[] = [
      { target: 'https://w3id.org/ro/crate/1.1', rel: 'profile', source: 'link-header' },
      { target: 'https://example.org/metadata.jsonld', rel: 'describedby', source: 'link-header' }
    ];
    const report = evaluateHealthAndGaps('https://example.org/res', links);
    const ticket = generateSystemicItTicket(report, links);

    // Check ASCII topology
    expect(ticket).toContain('+--[rel="profile"]');
    expect(ticket).toContain('+--[rel="describedby"]');

    // Check Literature references
    expect(ticket).toContain('EOSC Interoperability Framework');
    expect(ticket).toContain('RFC 8288');
    expect(ticket).toContain('RFC 9264');
    expect(ticket).toContain('ghcr.io/vliz-be-opsci/rt-test');
  });

  it('should include Prioritized Remediation Requirements when delegated in triage', () => {
    const links: DiscoveredLink[] = [];
    const report = evaluateHealthAndGaps('https://example.org/dataset', links);
    const delegated = [
      {
        rel: 'profile',
        source: 'DELEGATED_IT_TICKET',
        evidence: 'Curator flagged rel="profile" as a systemic infrastructure requirement in IT ticket'
      }
    ];

    const ticket = generateSystemicItTicket(report, links, delegated);

    expect(ticket).toContain('Prioritized Remediation Requirements (Flagged in Triage)');
    expect(ticket).toContain('rel="profile"');
    expect(ticket).toContain('Directive:');
    // Reverse proxy directives for Nginx and Apache
    expect(ticket).toContain('# add_header Link "<https://example.org/path/to/profile>; rel="profile"" always;');
    expect(ticket).toContain('# Header append Link "<https://example.org/path/to/profile>; rel="profile""');
  });
});
