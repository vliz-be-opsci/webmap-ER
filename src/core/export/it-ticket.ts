import { DiagnosticReport } from '../triage/diagnostics';
import { DiscoveredLink } from '../wrx/types';
import { generateHttpHeaders } from './link-headers';

export function generateSystemicItTicket(report: DiagnosticReport, links: DiscoveredLink[]): string {
  const headers = generateHttpHeaders(links);

  return `## [Architecture / Interoperability] Implement Server-Wide RFC 8288 Link Headers & RT Sitemaps for Machine Harvesters

### Background & Business Impact
Automated research infrastructure harvesters (EOSC, OpenAIRE, thematic disciplinary aggregators) require transparent, machine-readable discovery of dataset schemas, metadata, and persistent identifiers (PIDs) using RFC 8288 HTTP Link headers and XML sitemaps.

Current HTTP responses across our digital asset catalog lack these standardized headers, hindering indexation and failing compliance audits.

### Pilot Exemplar Tested
- **Test Endpoint:** \`${report.targetUrl || 'https://example.org/resource'}\`
- **Current Vital Signs Score:** \`${report.score} / 100\` (${report.vitalStatus})
- **Discovered Gaps:**
${report.gaps.map(g => `  - [${g.severity}] ${g.message} — *${g.didacticReason}*`).join('\n')}

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
\`\`\`

**Apache Snippet:**
\`\`\`apache
${headers.apache}
\`\`\`

#### 2. Sitemap Update
Update our automated \`sitemap.xml\` generator to output \`<xhtml:link>\` signposting entries for all dataset records.

#### 3. Verification
Verify implementation by running the automated GRMP Radical Transparency test runner:
\`docker run --rm -v $(pwd)/rt-test.yaml:/app/test_config.yaml ghcr.io/vliz-be-opsci/rt-test:latest\`
`;
}
