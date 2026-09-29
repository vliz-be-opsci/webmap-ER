import { DiagnosticReport } from '../triage/diagnostics';
import { DiscoveredLink } from '../wrx/types';
import { RelationProvenance } from '../state/store';
import { generateHttpHeaders } from './link-headers';
import { generateSitemapXml } from './sitemap';
import { RT_PATTERNS } from '../rt/patterns';

export function generateAgentImplementationPlan(
  report: DiagnosticReport,
  links: DiscoveredLink[],
  provenanceHistory: RelationProvenance[] = [],
  activePatternId: string = 'PT-04'
): string {
  const targetUrl = report.targetUrl || 'https://example.org/resource';
  const patternDef = RT_PATTERNS.find(p => p.id === activePatternId) || RT_PATTERNS.find(p => p.id === 'PT-04')!;
  const headers = generateHttpHeaders(links);
  const rawHeaderValue = (headers.raw || '').replace(/^Link:\s*/i, '');
  const sitemapSnippet = generateSitemapXml(targetUrl, links);

  // Extract delegated or user-prescribed relations
  const delegatedReqs = provenanceHistory.filter(p => p.source === 'DELEGATED_IT_TICKET');
  const humanPrescriptions = provenanceHistory.filter(p => p.source === 'HUMAN');

  // Build list of all relations that need to be on the wire
  const relationsTable = links.length > 0
    ? links.map(l => {
        const prov = provenanceHistory.find(p => p.rel.toLowerCase() === l.rel.toLowerCase());
        const isDelegated = prov?.source === 'DELEGATED_IT_TICKET';
        const sourceLabel = isDelegated ? 'DELEGATED_IT_TICKET (High Priority)' : (prov?.source || l.source || 'DISCOVERED');
        return `| \`${l.rel}\` | \`${l.target}\` | ${sourceLabel} |`;
      }).join('\n')
    : '| *(None yet)* | `https://example.org/resource` | PENDING_CONFIGURATION |';

  const prioritizedSection = delegatedReqs.length > 0 ? `
### Prioritized Curator Directives (Flagged in Triage)
The catalog curator flagged the following items as urgent systemic requirements during interactive diagnostic triage:
${delegatedReqs.map(d => {
  const gap = report.gaps.find(g => g.rel.toLowerCase() === d.rel.toLowerCase());
  const reason = gap ? gap.didacticReason : 'Critical signposting relation needed for interoperability';
  return `- **\`rel="${d.rel}"\`**: ${reason}
  - *Directive:* Prioritize injecting this header across all dataset endpoints.`;
}).join('\n')}
` : '';

  return `# [Agent Task Plan] Server-Wide RFC 8288 Signposting & Pattern Conformance Implementation

> **Mission for Autonomous LLM Agent:**
> Implement server-side RFC 8288 Web Linking response headers and hostwide discovery mechanisms across this repository's published dataset endpoints to satisfy **Radical Transparency Pattern ${patternDef.id} (${patternDef.name})** under the EOSC Interoperability Framework.
> Follow this execution plan step-by-step. All tasks are result-oriented and framework-agnostic.

---

## 1. Context & Baseline Health Assessment
- **Target Endpoint / Seed URI:** \`${targetUrl}\`
- **Active Conformance Pattern:** **${patternDef.id}** — *${patternDef.name}*
- **Pattern Description:** ${patternDef.summary}
- **Current Vital Signs Score:** \`${report.score}% / 100\` (${report.vitalStatus})
- **Identified Conformance Gaps:**
${report.gaps.length > 0 ? report.gaps.map(g => `  - [${g.severity}] \`rel="${g.rel}"\`: ${g.message} (*${g.didacticReason}*)`).join('\n') : '  - (No outstanding critical gaps detected on seed)'}
${prioritizedSection}
---

## 2. Invariant Target End-State (Wire-Level Contract)
Regardless of whether this repository is built on a reverse proxy (Nginx, Apache, Caddy), an application framework (Node.js, Python, Java, Go, PHP), or serverless edge functions, the HTTP response for every dataset landing page and metadata endpoint **MUST** satisfy the following wire-level contract:

### 2.1. HTTP Response Headers
When executing \`curl -s -I <dataset-endpoint>\`, the response headers must include:
\`\`\`http
${headers.raw ? headers.raw : 'Link: <https://example.org/dataset.jsonld>; rel="describedby"; type="application/ld+json"'}
Access-Control-Expose-Headers: Link
\`\`\`

> **CRITICAL REQUIREMENT:** \`Access-Control-Expose-Headers: Link\` MUST be included so that browser-based web crawlers, data portals, and cross-origin client apps can dereference the signposting relationships without CORS restrictions.

### 2.2. Target Relations Matrix
| Relation (\`rel\`) | Target URI | Provenance / Priority |
| :--- | :--- | :--- |
${relationsTable}

---

## 3. Autonomous Agent Execution Plan

- [ ] **Phase 1: Environment & Architecture Discovery**
  - [ ] Inspect the repository directory structure, configuration files, and package manifests to determine the tech stack:
    - *Reverse Proxies / Webservers:* \`nginx.conf\`, \`/etc/nginx/\`, \`.htaccess\`, \`httpd.conf\`, \`Caddyfile\`.
    - *Node.js / JavaScript:* \`package.json\` (check for Express, Fastify, Next.js, Koa, NestJS).
    - *Python:* \`pyproject.toml\`, \`requirements.txt\`, \`Pipfile\` (check for FastAPI, Django, Flask, Starlette).
    - *Java / Kotlin:* \`pom.xml\`, \`build.gradle\` (check for Spring Boot, Micronaut, Quarkus).
    - *PHP / Go / Ruby / Other:* Identify router or HTTP middleware stack.
  - [ ] Identify where HTTP responses are composed or dispatched (global middleware, base controller, router pipeline, or web server config).

- [ ] **Phase 2: Signposting HTTP Header Implementation**
  - [ ] Implement middleware or proxy rules to inject the standard RFC 8288 \`Link\` headers.
  - [ ] Ensure headers are appended rather than overriding existing application headers.
  - [ ] Include \`Access-Control-Expose-Headers: Link\` across all responses.
  - [ ] For dynamic datasets, dynamically bind the resource identifier (e.g. DOI or local ID) to \`rel="cite-as"\` and metadata record to \`rel="describedby"\`.

- [ ] **Phase 3: Hostwide Sitemap Conformance (PT-06)**
  - [ ] If the repository generates or serves \`sitemap.xml\`, ensure each \`<url>\` element includes \`<xhtml:link>\` signposting entries.
  - [ ] XML namespace declaration required in \`<urlset>\`: \`xmlns:xhtml="http://www.w3.org/1999/xhtml"\`.
  - [ ] Verify XML syntax is well-formed.

- [ ] **Phase 4: Automated Verification & Acceptance Testing**
  - [ ] Start or serve the application locally.
  - [ ] Execute HTTP inspection:
    \`\`\`bash
    curl -s -I http://localhost:8080/dataset/example | grep -i -E "link|access-control"
    \`\`\`
  - [ ] Verify all required relations (\`rel="describedby"\`, \`rel="cite-as"\`, \`rel="profile"\`, etc.) are returned.
  - [ ] Execute containerized test suite with the generated \`rt-test.yaml\`:
    \`\`\`bash
    docker run --rm -v $(pwd)/rt-test.yaml:/app/test_config.yaml ghcr.io/vliz-be-opsci/rt-test:latest
    \`\`\`

---

## 4. Multi-Framework Implementation Recipes (Agnostic Reference)

Select the recipe corresponding to this repository's detected architecture:

### Option A: Nginx (Reverse Proxy or Static Server)
\`\`\`nginx
# Inside the server { ... } or location / { ... } block:
location /dataset/ {
    # RFC 8288 Signposting headers
    add_header Link '${rawHeaderValue ? rawHeaderValue.replace(/'/g, "\\'") : '<https://example.org/dataset.jsonld>; rel="describedby"'}' always;
    add_header Access-Control-Expose-Headers "Link" always;
    
    proxy_pass http://upstream_backend;
}
\`\`\`

### Option B: Node.js (Express / Fastify Middleware)
\`\`\`javascript
// Express.js global or router middleware:
app.use('/dataset', (req, res, next) => {
  res.setHeader('Link', [
    '<https://example.org/dataset.jsonld>; rel="describedby"; type="application/ld+json"',
    '<https://doi.org/10.5061/dryad.example>; rel="cite-as"'
  ].join(', '));
  res.setHeader('Access-Control-Expose-Headers', 'Link');
  next();
});
\`\`\`

### Option C: Python (FastAPI / Starlette Middleware)
\`\`\`python
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def add_signposting_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/dataset"):
        response.headers["Link"] = (
            '<https://example.org/dataset.jsonld>; rel="describedby"; type="application/ld+json", '
            '<https://doi.org/10.5061/dryad.example>; rel="cite-as"'
        )
        response.headers["Access-Control-Expose-Headers"] = "Link"
    return response
\`\`\`

### Option D: Apache HTTP Server (\`.htaccess\` or \`httpd.conf\`)
\`\`\`apache
<IfModule mod_headers.c>
  Header append Link "<https://example.org/dataset.jsonld>; rel=\\"describedby\\"; type=\\"application/ld+json\\""
  Header append Link "<https://doi.org/10.5061/dryad.example>; rel=\\"cite-as\\""
  Header append Access-Control-Expose-Headers "Link"
</IfModule>
\`\`\`

### Option E: Cloudflare Workers / Edge CDN
\`\`\`javascript
export default {
  async fetch(request, env) {
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Link', '<https://example.org/dataset.jsonld>; rel="describedby"');
    newHeaders.set('Access-Control-Expose-Headers', 'Link');
    return new Response(response.body, { status: response.status, headers: newHeaders });
  }
};
\`\`\`

---

## 5. Hostwide XML Sitemap Reference (PT-06)
If this service publishes an XML sitemap, update it to include embedded \`<xhtml:link>\` signposting entries:
\`\`\`xml
${sitemapSnippet}
\`\`\`

---

## 6. Standards & Specification References
- **RFC 8288 (Web Linking):** [https://www.rfc-editor.org/rfc/rfc8288](https://www.rfc-editor.org/rfc/rfc8288)
- **RFC 9264 (Linkset):** [https://www.rfc-editor.org/rfc/rfc9264](https://www.rfc-editor.org/rfc/rfc9264)
- **EOSC Interoperability Framework Radical Transparency Specification:** [${patternDef.docUrl}](${patternDef.docUrl})
- **FAIR Signposting Guidelines:** [https://signposting.org/FAIR/](https://signposting.org/FAIR/)
`;
}
