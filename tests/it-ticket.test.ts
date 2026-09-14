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
});
