import { DiagnosticReport } from '../triage/diagnostics';
import { DiscoveredLink } from '../wrx/types';
import { generateHttpHeaders } from './link-headers';
import { RT_PATTERNS } from '../rt/patterns';

export interface DelegatedTicketRequirement {
  rel: string;
  source: string;
  evidence?: string;
}

export function generateSystemicItTicket(
  report: DiagnosticReport,
  links: DiscoveredLink[],
  provenanceHistory: DelegatedTicketRequirement[] = []
): string {
  const headers = generateHttpHeaders(links);
  const targetUrl = report.targetUrl || 'https://example.org/resource';

  // Extract relations specifically flagged / delegated by user in triage
  const delegatedReqs = provenanceHistory.filter(p => p.source === 'DELEGATED_IT_TICKET');

  // Build ASCII Box-and-Wire Network Topology Diagram
  const asciiTopology = generateAsciiTopology(targetUrl, links);

  // Literature & Specification References
  const patternList = RT_PATTERNS.map(
    p => `- **${p.id} (${p.name})**: [EOSC IF Specification & Test Cases](${p.docUrl}) (GRMP Type: \`${p.grmpTestType}\`)`
  ).join('\n');

  const delegatedSection = delegatedReqs.length > 0 ? `
### Prioritized Remediation Requirements (Flagged in Triage)
The catalog curator specifically designated the following relations as critical server-wide infrastructure requirements:
${delegatedReqs.map(d => {
  const gap = report.gaps.find(g => g.rel.toLowerCase() === d.rel.toLowerCase());
  const reason = gap ? gap.didacticReason : 'Required standard signposting relation for harvester interoperability';
  return `- **\`rel="${d.rel}"\`**: ${reason}\n  *Directive:* Configure server/proxy middleware to inject standard \`<target-uri>; rel="${d.rel}"\` response headers across all published assets.`;
}).join('\n')}
` : '';

  return `## [Architecture / Interoperability] Implement Server-Wide RFC 8288 Link Headers & RT Sitemaps for Machine Harvesters

### Background & Business Impact
Automated research infrastructure harvesters (EOSC, OpenAIRE, thematic disciplinary aggregators) require transparent, machine-readable discovery of dataset schemas, metadata, and persistent identifiers (PIDs) using **RFC 8288 HTTP Link headers**, **RFC 9264 Linksets**, and XML sitemaps.

Current HTTP responses across our digital asset catalog lack these standardized headers, hindering indexation and failing compliance audits under the **EOSC Interoperability Framework (EOSC IF)**.
${delegatedSection}
### Pilot Exemplar Tested
- **Test Endpoint:** \`${targetUrl}\`
- **Current Vital Signs Score:** \`${report.score} / 100\` (${report.vitalStatus})
- **Discovered Gaps:**
${report.gaps.map(g => `  - [${g.severity}] ${g.message} — *${g.didacticReason}*`).join('\n')}

### Graph Network Topology (GRMPy / Signposting)
\`\`\`text
${asciiTopology}
\`\`\`

### Proposed Systemic Remediation
Rather than fixing this single URL individually, please configure our webserver reverse proxy (Nginx / Apache / Cloudflare) or CMS response middleware to inject the standard headers across **all published dataset and catalog endpoints**.

#### 1. Exemplar Headers to Deploy (Reverse Proxy Configuration)
**Raw Header:**
\`\`\`http
${headers.raw}
\`\`\`

**Nginx Snippet:**
\`\`\`nginx
${headers.nginx}
${delegatedReqs.length > 0 ? `
# Curator-Flagged Remediation Directives (Pending Configuration):
${delegatedReqs.map(d => `# add_header Link "<https://example.org/path/to/${d.rel}>; rel="${d.rel}"" always;`).join('\n')}` : ''}
\`\`\`

**Apache Snippet:**
\`\`\`apache
${headers.apache}
${delegatedReqs.length > 0 ? `
# Curator-Flagged Remediation Directives (Pending Configuration):
${delegatedReqs.map(d => `# Header append Link "<https://example.org/path/to/${d.rel}>; rel="${d.rel}""`).join('\n')}` : ''}
\`\`\`

#### 2. Sitemap Update
Update our automated \`sitemap.xml\` generator to output \`<xhtml:link>\` signposting entries for all dataset records.

#### 3. Standard Specifications & Pattern Literature
- **RFC 8288 (Web Linking):** [https://www.rfc-editor.org/rfc/rfc8288](https://www.rfc-editor.org/rfc/rfc8288)
- **RFC 9264 (Linkset):** [https://www.rfc-editor.org/rfc/rfc9264](https://www.rfc-editor.org/rfc/rfc9264)
- **W3C DX-PROF (Profile Guidance):** [https://www.w3.org/TR/dx-prof-conneg/](https://www.w3.org/TR/dx-prof-conneg/)
- **EOSC Interoperability Framework Radical Transparency Patterns:**
${patternList}

#### 4. Automated Verification & CI/CD
Verify implementation by executing the reproducible containerized test runner with your generated \`rt-test.yaml\`:
\`\`\`bash
docker run --rm -v $(pwd)/rt-test.yaml:/app/test_config.yaml ghcr.io/vliz-be-opsci/rt-test:latest
\`\`\`
`;
}

function generateAsciiTopology(targetUrl: string, links: DiscoveredLink[]): string {
  const boxWidth = Math.max(70, targetUrl.length + 8);
  const border = '+' + '-'.repeat(boxWidth) + '+';
  const paddedUrl = `  URI: <${targetUrl}>`.padEnd(boxWidth);

  let diagram = `${border}\n| ${'ORIGIN RESOURCE / LANDING PAGE'.padEnd(boxWidth - 1)}|\n| ${paddedUrl}|\n${border}\n       |\n`;

  if (links.length === 0) {
    diagram += `       +--[NO DISCOVERED SIGNPOSTING EDGES]\n`;
    return diagram;
  }

  links.forEach((link) => {
    diagram += `       +--[rel="${link.rel}"]---> <${link.target}>\n       |\n`;
  });

  diagram += `       * (Harvester Traversal Graph)`;
  return diagram;
}
