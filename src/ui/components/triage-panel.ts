import { AppStore } from '../../core/state/store';
import { evaluateHealthAndGaps, evaluatePatternScore } from '../../core/triage/diagnostics';
import { generateTriageQuestions } from '../../core/triage/questions';
import { extractResourceLinks } from '../../core/wrx/extractor';
import { detectSmartMetadata } from '../../core/wrx/smart-detector';
import { probeHostwideResource } from '../../core/wrx/host-prober';
import { classifyResourcePattern } from '../../core/wrx/pattern-classifier';
import { buildIntakeQuestions } from '../../core/triage/intake-model';
import { generateSitemapXml } from '../../core/export/sitemap';
import { RT_PATTERNS, getPatternById } from '../../core/rt/patterns';
import { SAMPLE_PRESETS } from '../../core/rt/presets';
import { showToast } from './toast';
import {
  iconInfo,
  iconShieldCheck,
  iconChevronLeft,
  iconChevronRight,
  iconRotateCcw,
  iconSparkles,
  iconCopy,
  iconSearch
} from '../icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function createTriagePanel(store: AppStore): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'triage-panel';

  async function runDiagnosisForUri(input: string, preferredPattern?: string) {
    if (!input) return;
    store.setSeedUri(input);
    if (preferredPattern) {
      store.setActivePatternId(preferredPattern, 'HUMAN_SWITCHED');
    }
    showToast('wrx Probing', 'Probing seed resource, robots.txt, and sitemaps...', 'info');

    try {
      const extraction = await probeHostwideResource(input);
      const classification = classifyResourcePattern(extraction);
      const intakeQuestions = buildIntakeQuestions(extraction, classification);

      // Auto-answer high-confidence questions
      let autoSkippedCount = 0;
      for (const q of intakeQuestions) {
        if (q.skipped && q.currentValue) {
          store.answerQuestionWithProvenance(q.id, q.rel || 'describedby', q.currentValue, q.source, q.evidence);
          autoSkippedCount++;
        }
      }

      // Merge seed links
      if (extraction.seedExtraction.links.length > 0) {
        extraction.seedExtraction.links.forEach(l => {
          store.answerQuestionWithProvenance('seed-link', l.rel, l.target, 'AUTO_LINK_HEADER');
        });
      }

      // Check for preset known relations
      const preset = SAMPLE_PRESETS.find(p => p.uris.resource === input);
      if (preset) {
        Object.entries(preset.uris).forEach(([role, uri]) => {
          if (role !== 'resource') {
            store.answerQuestionWithProvenance('preset-seed', role, uri, 'AUTO_LINK_HEADER', `Pre-configured in sample preset ${preset.name}`);
          }
        });
      }

      // Set intake summary
      store.setIntakeSummary({
        recommendedPatternId: preferredPattern || classification.recommendedPattern,
        confidence: classification.confidence,
        scorePercent: classification.scorePercent,
        rationale: classification.rationale,
        skippedCount: autoSkippedCount,
        totalCount: intakeQuestions.length,
        auditLog: extraction.auditLog
      });

      // Update active pattern if not manually set
      if (!preferredPattern) {
        store.setActivePatternId(classification.recommendedPattern, 'AUTO_DEDUCED');
      }

      const inference = detectSmartMetadata(extraction.seedExtraction);
      store.setSmartInference(inference);

      if (extraction.seedExtraction.corsBlocked) {
        showToast(
          'CORS Inspection Notice',
          'Direct network inspection was restricted by CORS. Heuristic diagnostic triage active.',
          'warning',
          5000
        );
      } else {
        showToast(
          'Diagnosis Complete',
          `Deduced ${preferredPattern || classification.recommendedPattern} (${classification.confidence} confidence). ${autoSkippedCount} questions auto-resolved.`,
          'success'
        );
      }
    } catch (err) {
      showToast('Diagnostic Error', 'Failed to inspect hostwide resources. Running fallback triage.', 'warning');
    }
  }

  function render() {
    const state = store.getState();
    const hasSeedUri = !!state.seedUri && state.seedUri.trim().length > 0;
    const activePatternDef = getPatternById(state.activePatternId) || RT_PATTERNS[0];
    const intakeSummary = state.intakeSummary;

    // Build pattern-specific relations for Provenance Review Matrix
    const patternRelations: Array<{ rel: string; isRequired: boolean; isPresent: boolean; targetUri: string; source: string; evidence?: string }> = [];

    if (activePatternDef) {
      const allExpectedRels = [
        ...activePatternDef.requiredRelations.map(r => ({ rel: r, isRequired: true })),
        ...activePatternDef.recommendedRelations.map(r => ({ rel: r, isRequired: false }))
      ];

      for (const expected of allExpectedRels) {
        const found = state.links.find(l => l.rel.toLowerCase() === expected.rel.toLowerCase());
        const prov = state.provenanceHistory.find(p => p.rel.toLowerCase() === expected.rel.toLowerCase());
        patternRelations.push({
          rel: expected.rel,
          isRequired: expected.isRequired,
          isPresent: !!found,
          targetUri: found ? found.target : '(Unprescribed)',
          source: prov ? prov.source : found ? found.source : 'UNRESOLVED',
          evidence: prov?.evidence
        });
      }
    }

    // Also include other prescribed relations not in pattern definition
    state.provenanceHistory.forEach(prov => {
      if (prov.rel !== 'pattern-focus' && !patternRelations.some(pr => pr.rel.toLowerCase() === prov.rel.toLowerCase())) {
        patternRelations.push({
          rel: prov.rel,
          isRequired: false,
          isPresent: true,
          targetUri: prov.targetUri,
          source: prov.source,
          evidence: prov.evidence
        });
      }
    });

    const hasProvenanceOrIntake = !!intakeSummary || state.provenanceHistory.length > 0;
    const intakeSummaryHtml = hasProvenanceOrIntake ? `
      <div class="provenance-audit-strip">
        <div class="provenance-audit-header">
          <div class="provenance-audit-title">
            <span class="smart-badge-icon">${iconSparkles('', 14)}</span>
            <span>${intakeSummary ? `Deduced Pattern: <strong>${escapeHtml(intakeSummary.recommendedPatternId)}</strong> (${intakeSummary.confidence.toUpperCase()} CONFIDENCE)` : `Pattern &amp; Provenance Conformance: <strong>${escapeHtml(state.activePatternId)}</strong>`}</span>
          </div>
          <button id="btn-toggle-review" class="btn btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;">
            ${state.ui.showIntakeReview ? 'Hide Review' : 'View Provenance & Review'}
          </button>
        </div>
        <div class="provenance-audit-checklist">
          ${intakeSummary ? intakeSummary.auditLog.map(audit => `
            <span class="provenance-check-item ${audit.status === 'SUCCESS' ? 'status-success' : 'status-cors'}">
              <span>${audit.status === 'SUCCESS' ? '✓' : '!'}</span>
              <span>${escapeHtml(audit.target.split('/').pop() || audit.target)}: ${audit.status}</span>
            </span>
          `).join('') : ''}
          <span class="provenance-check-item">
            <span>${intakeSummary ? `${intakeSummary.skippedCount} questions auto-resolved` : `${state.provenanceHistory.length} relations tracked`}</span>
          </span>
        </div>
      </div>
    ` : '';

    const reviewMatrixHtml = state.ui.showIntakeReview ? `
      <div class="provenance-review-matrix">
        <div class="card-header-meta">
          <span class="card-step-badge">INTAKE & PROVENANCE AUDIT</span>
          <span class="hud-condition-badge status-healthy">${state.activePatternId} CONFORMANCE</span>
        </div>
        <h3 class="card-title">Pattern Conformance & Provenance Review</h3>
        <p class="card-prompt">
          Review relations derived by wrx hostwide discovery and user prescriptions for <strong>${escapeHtml(activePatternDef ? activePatternDef.name : state.activePatternId)}</strong>. Switching patterns immediately adapts the audit requirements and triage questions.
        </p>

        <table class="provenance-matrix-table">
          <thead>
            <tr>
              <th>Relation</th>
              <th>Target URI</th>
              <th>Status / Provenance</th>
            </tr>
          </thead>
          <tbody>
            ${patternRelations.length > 0 ? patternRelations.map(item => {
              const badgeClass = item.source === 'UNRESOLVED'
                ? (item.isRequired ? 'badge-unresolved-critical' : 'badge-unresolved')
                : item.source === 'DELEGATED_IT_TICKET'
                  ? 'badge-ticket'
                  : item.source.startsWith('AUTO_ROBOTS') || item.source.startsWith('AUTO_SITEMAP') || item.source.startsWith('AUTO_LINK') || item.source.startsWith('AUTO_JSONLD')
                    ? 'badge-auto'
                    : item.source.startsWith('AUTO_HEURISTIC')
                      ? 'badge-heuristic'
                      : 'badge-human';
              return `
                <tr>
                  <td>
                    <strong>${escapeHtml(item.rel)}</strong>
                    ${item.isRequired ? '<span class="req-tag" style="font-size: 0.65rem; color: var(--clinical-crimson); margin-left: 4px;">REQUIRED</span>' : '<span class="req-tag" style="font-size: 0.65rem; color: var(--text-secondary); margin-left: 4px;">RECOMMENDED</span>'}
                  </td>
                  <td><code>${escapeHtml(item.targetUri)}</code></td>
                  <td>
                    <span class="provenance-badge ${badgeClass}">${escapeHtml(item.source)}</span>
                    ${item.evidence ? `<div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(item.evidence)}</div>` : ''}
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 1rem;">
                  No relations configured for this pattern.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <div style="margin-top: 1rem;">
          <span class="hud-label">SWITCH ACTIVE PATTERN</span>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.35rem;">
            ${RT_PATTERNS.map(p => `
              <button class="btn btn-secondary btn-pattern-switch ${state.activePatternId === p.id ? 'active' : ''}" data-pattern="${p.id}" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                ${p.id}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
          <button id="btn-apply-and-sync" class="btn btn-primary">
            Apply Pattern & Synchronize Workspace
          </button>
        </div>
      </div>
    ` : '';

    if (!hasSeedUri) {
      // EMPTY STATE: Seed URI input is promoted to TOP and HIGHLIGHTED; Telemetry HUD and Pattern Matrix are HIDDEN
      panel.innerHTML = `
        <!-- Target Seed Resource Input Bar (HIGHLIGHTED ON TOP) -->
        <section class="seed-card highlighted" aria-label="Seed Resource Diagnostic Input">
          <div class="seed-header">
            <label for="seed-uri-input" class="hud-label" style="margin-bottom: 0;">
              <span class="status-pulse-dot" style="background: var(--clinical-cobalt);"></span>
              <span>TARGET SEED RESOURCE URI (AWAITING INPUT)</span>
            </label>
          </div>
          <div class="terminal-input-group">
            <span class="protocol-badge">HTTPS</span>
            <input 
              type="text" 
              id="seed-uri-input" 
              class="form-control-bare" 
              placeholder="https://example.org/dataset (enter URI or pick preset below)" 
              value="${escapeHtml(state.seedUri)}" 
              aria-label="Seed Resource URI"
              autofocus
            />
            <button id="btn-extract" class="btn btn-primary" style="border-radius: 0; padding: 0.5rem 1rem;">
              Diagnose (wrx)
            </button>
          </div>
        </section>

        <!-- Provenance Audit Strip (if present) -->
        ${intakeSummaryHtml}

        <!-- Pattern & Provenance Review Matrix Card (if open) -->
        ${reviewMatrixHtml}

        <!-- Intake Hero Card with Quickstart Presets -->
        <div class="intake-hero-card">
          <div class="intake-hero-header">
            <div class="intake-hero-icon">${iconSparkles('', 26)}</div>
            <div class="intake-hero-text">
              <h3 class="intake-hero-title">Target Seed Resource Required</h3>
              <p class="intake-hero-desc">
                Provide a dataset, web service, or metadata landing page URI above to initiate automated wrx inspection and triage against the 8 Radical Transparency patterns.
              </p>
            </div>
          </div>

          <div class="intake-hero-presets">
            <span class="hud-label">OR QUICKSTART WITH A PRE-CONFIGURED RESEARCH DATASET</span>
            <div class="preset-cards-grid">
              ${SAMPLE_PRESETS.map(preset => `
                <button class="btn-preset-card" data-preset-id="${preset.id}">
                  <div class="preset-card-top">
                    <strong class="preset-card-name">${escapeHtml(preset.name)}</strong>
                    <span class="preset-target-tag">${preset.targetPattern}</span>
                  </div>
                  <p class="preset-card-desc">${escapeHtml(preset.description)}</p>
                  <div class="preset-card-action">Load Dataset &amp; Diagnose →</div>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else {
      // ACTIVE STATE: Seed URI provided -> Show Telemetry HUD, Pattern Strip, Standard Seed Input, and Questionnaire
      const report = evaluateHealthAndGaps(state.seedUri, state.links, state.smartInference);
      const activeFilter = state.activePatternId && state.activePatternId !== 'ALL' ? state.activePatternId : undefined;
      const allQuestions = generateTriageQuestions(report, activeFilter);
      const delegatedRels = new Set(
        state.provenanceHistory
          .filter(p => p.source === 'DELEGATED_IT_TICKET')
          .map(p => p.rel.toLowerCase())
      );
      const questions = allQuestions.filter(q => !delegatedRels.has(q.rel.toLowerCase()));
      const activeIdx = Math.min(state.ui.activeQuestionIndex, Math.max(0, questions.length - 1));
      const currentQ = questions.length > 0 ? questions[activeIdx] : null;

      const activePatternEval = evaluatePatternScore(state.activePatternId, state.links, true);

      const statusClass = `status-${report.vitalStatus.toLowerCase()}`;
      const statusLabel = report.vitalStatus === 'HEALTHY' 
        ? 'VITAL CONFORMITY' 
        : report.vitalStatus === 'UNSTABLE' 
          ? 'UNSTABLE CONDITION' 
          : 'CRITICAL TRAUMA';

      const meterBg = report.vitalStatus === 'HEALTHY'
        ? 'var(--clinical-emerald)'
        : report.vitalStatus === 'UNSTABLE'
          ? 'var(--clinical-amber)'
          : 'var(--clinical-crimson)';

      // Standards to display for current pattern
      const standardsToDisplay = (activePatternDef && activePatternDef.standards && activePatternDef.standards.length > 0)
        ? activePatternDef.standards
        : [
            { label: 'RFC 8288 (Web Linking)', url: 'https://datatracker.ietf.org/doc/html/rfc8288' },
            { label: 'RFC 9264 (Linkset)', url: 'https://datatracker.ietf.org/doc/html/rfc9264' }
          ];

      panel.innerHTML = `
        <!-- Clinical Telemetry HUD -->
        <section class="telemetry-hud" aria-label="RT Health Diagnostic Telemetry">
          <div class="hud-top-row">
            <div class="hud-lead">
              <span class="hud-label">GLOBAL VITAL SIGNS SCORE</span>
              <div class="hud-score-display">
                <span class="hud-score-value tabular-numbers">${report.score}</span>
                <span class="hud-score-unit">%</span>
              </div>
            </div>
            <div class="hud-condition-badge ${statusClass}">
              <span class="status-pulse-dot"></span>
              <span>${statusLabel}</span>
            </div>
          </div>

          <div class="hud-progress-track">
            <div class="hud-meter-bar" style="width: ${Math.max(report.score, 4)}%; background: ${meterBg};"></div>
          </div>

          <!-- Active Pattern Conformity Row -->
          <div class="hud-pattern-row">
            <div class="hud-pattern-lead">
              <span class="hud-pattern-id">${activePatternDef.id}</span>
              <div class="hud-pattern-meta">
                <span class="hud-pattern-name">${activePatternDef.name}</span>
                <span class="hud-pattern-status badge-${activePatternEval.status.toLowerCase()}">${activePatternEval.status} (${activePatternEval.score}%)</span>
              </div>
            </div>
          </div>

          <!-- Relation Breakdown Section: Concrete relations and gaps -->
          <div class="hud-breakdown-section">
            <!-- Detected Relations -->
            <div class="hud-rel-group">
              <span class="hud-sub-label">DETECTED RELATIONS (${report.presentRelations.length})</span>
              <div class="hud-chips-wrap">
                ${report.presentRelations.length > 0 ? report.presentRelations.map(rel => `
                  <span class="hud-rel-chip satisfied" title="Detected relation rel=&quot;${escapeHtml(rel)}&quot;">
                    <span class="chip-icon">✓</span>
                    <code>${escapeHtml(rel)}</code>
                  </span>
                `).join('') : `
                  <span class="hud-empty-hint">No relations detected yet on seed</span>
                `}
              </div>
            </div>

            <!-- Active Pattern Specific Gaps -->
            <div class="hud-rel-group">
              <span class="hud-sub-label">ACTIVE PATTERN (${activePatternDef.id}) CONFORMANCE GAPS</span>
              <div class="hud-chips-wrap">
                ${activePatternEval.missingRequired.map(rel => `
                  <span class="hud-rel-chip missing-req" title="Missing REQUIRED relation for ${activePatternDef.id}">
                    <span class="chip-icon">!</span>
                    <code>${escapeHtml(rel)}</code>
                    <span class="chip-tag tag-req">REQUIRED</span>
                  </span>
                `).join('')}
                ${activePatternEval.missingRecommended.map(rel => `
                  <span class="hud-rel-chip missing-rec" title="Missing RECOMMENDED relation for ${activePatternDef.id}">
                    <span class="chip-icon">?</span>
                    <code>${escapeHtml(rel)}</code>
                    <span class="chip-tag tag-rec">RECOMMENDED</span>
                  </span>
                `).join('')}
                ${activePatternEval.satisfiedRequired.map(rel => `
                  <span class="hud-rel-chip satisfied" title="Satisfied REQUIRED relation for ${activePatternDef.id}">
                    <span class="chip-icon">✓</span>
                    <code>${escapeHtml(rel)}</code>
                    <span class="chip-tag" style="background: rgba(5,150,105,0.15); color: var(--clinical-emerald);">REQ</span>
                  </span>
                `).join('')}
                ${activePatternEval.satisfiedRecommended.map(rel => `
                  <span class="hud-rel-chip satisfied" title="Satisfied RECOMMENDED relation for ${activePatternDef.id}">
                    <span class="chip-icon">✓</span>
                    <code>${escapeHtml(rel)}</code>
                    <span class="chip-tag" style="background: rgba(5,150,105,0.15); color: var(--clinical-emerald);">REC</span>
                  </span>
                `).join('')}
                ${activePatternEval.missingRequired.length === 0 && activePatternEval.missingRecommended.length === 0 ? `
                  <span class="hud-all-satisfied-hint">✓ All relations for ${activePatternDef.id} satisfied</span>
                ` : ''}
              </div>
            </div>

            <!-- Cross-Pattern Gaps Breakdown (precise pattern attribution) -->
            ${report.gaps.length > 0 && report.gaps.some(g => g.patternId !== activePatternDef.id) ? `
              <div class="hud-rel-group hud-cross-pattern-gaps">
                <span class="hud-sub-label">CROSS-PATTERN GAPS</span>
                <div class="hud-chips-wrap">
                  ${report.gaps.filter(g => g.patternId !== activePatternDef.id).map(gap => `
                    <span class="hud-rel-chip ${gap.severity === 'CRITICAL' ? 'missing-req' : 'missing-rec'}" title="${escapeHtml(gap.message)}">
                      <span class="chip-icon">${gap.severity === 'CRITICAL' ? '!' : '?'}</span>
                      <code>${escapeHtml(gap.rel)}</code>
                      <span class="chip-pattern-tag">[${gap.patternId}]</span>
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Pattern Standards (Clickable Links) -->
          <div class="hud-standards-bar">
            <span class="hud-sub-label">SPECIFICATIONS &amp; STANDARDS FOR ${activePatternDef.id}:</span>
            <div class="hud-standards-list">
              ${standardsToDisplay.map(std => `
                <a href="${std.url}" target="_blank" rel="noopener noreferrer" class="hud-standard-link" title="Open ${escapeHtml(std.label)} in new tab">
                  <span>${escapeHtml(std.label)}</span>
                  <span class="ext-icon">↗</span>
                </a>
              `).join('')}
            </div>
          </div>
        </section>

        <!-- Pattern Matrix Strip -->
        <div class="pattern-matrix-strip" role="group" aria-label="Radical Transparency 8-Pattern Matrix">
          ${report.patterns.map(p => {
            const isActive = state.activePatternId === p.patternId;
            const badgeClass = p.status === 'SATISFIED' ? 'badge-satisfied' : p.status === 'PARTIAL' ? 'badge-partial' : 'badge-unmet';
            return `
              <button class="pattern-badge ${isActive ? 'active' : ''} ${badgeClass}" data-pattern="${p.patternId}" title="${p.patternName} (${p.status})">
                <span class="pattern-badge-id">${p.patternId}</span>
                <span class="pattern-status-dot"></span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Target Seed Resource Input Bar (STANDARD COMPACT) -->
        <section class="seed-card" aria-label="Seed Resource Diagnostic Input">
          <div class="seed-header">
            <label for="seed-uri-input" class="hud-label" style="margin-bottom: 0;">TARGET SEED RESOURCE URI</label>
          </div>
          <div class="terminal-input-group">
            <span class="protocol-badge">HTTPS</span>
            <input 
              type="text" 
              id="seed-uri-input" 
              class="form-control-bare" 
              placeholder="https://example.org/dataset" 
              value="${escapeHtml(state.seedUri)}" 
              aria-label="Seed Resource URI"
            />
            <button id="btn-extract" class="btn btn-primary" style="border-radius: 0; padding: 0.5rem 1rem;">
              Diagnose (wrx)
            </button>
          </div>
        </section>

        <!-- Provenance Audit Strip -->
        ${intakeSummaryHtml}

        <!-- Pattern & Provenance Review Matrix Card -->
        ${reviewMatrixHtml}

        <!-- Smart Suggestions Strip -->
        ${report.smartInference && (
          (report.smartInference.detectedProfiles && report.smartInference.detectedProfiles.length > 0) ||
          (report.smartInference.detectedPids && report.smartInference.detectedPids.length > 0) ||
          (report.smartInference.detectedApis && report.smartInference.detectedApis.length > 0)
        ) ? `
          <div class="smart-suggestions-strip">
            <div class="smart-suggestions-header">
              <span class="smart-badge-icon">${iconSparkles('', 14)}</span>
              <span class="hud-label" style="margin-bottom: 0;">SMART LINKED DATA INFERENCES</span>
            </div>
            <div class="smart-suggestions-chips">
              ${(report.smartInference.detectedProfiles || []).map(p => `
                <button class="smart-suggestion-chip" data-rel="profile" data-uri="${p.uri}">
                  <span>Adopt Profile: <strong>${escapeHtml(p.label)}</strong></span>
                </button>
              `).join('')}
              ${(report.smartInference.detectedPids || []).map(p => `
                <button class="smart-suggestion-chip" data-rel="cite-as" data-uri="${p.uri}">
                  <span>Adopt PID: <strong>${escapeHtml(p.label)}</strong></span>
                </button>
              `).join('')}
              ${(report.smartInference.detectedApis || []).map(a => `
                <button class="smart-suggestion-chip" data-rel="service-desc" data-uri="${a.endpoint || ''}">
                  <span>Link API: <strong>${escapeHtml(a.label || 'API Description')}</strong></span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- PT-06 Hostwide Sitemap Card -->
        ${state.activePatternId === 'PT-06' ? `
          <div class="sitemap-preview-card">
            <div class="card-header-meta">
              <span class="card-step-badge">PATTERN PT-06</span>
              <span class="hud-condition-badge status-healthy">SITEMAP HARVESTING</span>
            </div>
            <h3 class="card-title">Hostwide Discovery: sitemap.xml Preview</h3>
            <p class="card-prompt">
              Radical Transparency Pattern 06 prescribes embedding <code>&lt;xhtml:link&gt;</code> signposting relations directly into your XML sitemaps to allow crawlers to harvest thousands of datasets in a single crawl pass.
            </p>
            <div class="code-preview-container">
              <pre class="code-preview"><code id="sitemap-xml-content">${escapeHtml(generateSitemapXml(state.seedUri, state.links))}</code></pre>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
              <button id="btn-copy-sitemap" class="btn btn-secondary">
                ${iconCopy('', 14)}
                <span>Copy sitemap.xml</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Active Questionnaire or Healthy State -->
        ${currentQ ? `
          <div class="question-card severity-${currentQ.severity.toLowerCase()}">
            <div class="card-header-meta">
              <span class="card-step-badge">QUESTION ${activeIdx + 1} OF ${questions.length}</span>
              <span class="hud-condition-badge status-${currentQ.severity.toLowerCase()}">
                ${currentQ.severity} GAP
              </span>
            </div>
            <h3 class="card-title">${escapeHtml(currentQ.title)}</h3>
            <p class="card-prompt">${escapeHtml(currentQ.prompt)}</p>
            
            <div class="clinical-guidance-panel">
              <div class="guidance-icon">${iconInfo('', 18)}</div>
              <div class="guidance-body">
                <strong>Why This Matters:</strong> ${escapeHtml(currentQ.didacticText)}
              </div>
            </div>

            ${currentQ.implementationGuidance ? `
              <div class="clinical-guidance-panel clinical-implementation-panel" style="margin-top: 0.75rem; border-left-color: var(--clinical-emerald);">
                <div class="guidance-icon" style="color: var(--clinical-emerald);">${iconSparkles('', 18)}</div>
                <div class="guidance-body">
                  <strong>How to Implement:</strong> ${escapeHtml(currentQ.implementationGuidance)}
                </div>
              </div>
            ` : ''}

            ${currentQ.quickOptions.length > 0 ? `
              <div class="prescription-options">
                <span class="hud-label">RECOMMENDED PRESCRIPTIONS</span>
                ${currentQ.quickOptions.map(opt => `
                  <button class="btn-prescription-opt" data-uri="${escapeHtml(opt.uri)}">
                    <span class="prescription-opt-title">${escapeHtml(opt.label)}</span>
                    <span class="prescription-opt-uri">${escapeHtml(opt.uri)}</span>
                    ${opt.description ? `<span class="prescription-opt-desc">${escapeHtml(opt.description)}</span>` : ''}
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <div class="terminal-input-group" style="margin-top: 1rem;">
              <input 
                type="text" 
                id="custom-uri-input" 
                class="form-control-bare" 
                placeholder="${escapeHtml(currentQ.inputPlaceholder)}" 
                aria-label="Custom target URI"
              />
              <button id="btn-save-answer" class="btn btn-primary" style="border-radius: 0; padding: 0.5rem 1rem;">
                Prescribe
              </button>
              ${currentQ.id === 'q-proactive-missing-ld' ? `
                <button id="btn-crawl-metadata" class="btn btn-secondary" style="border-radius: 0; padding: 0.5rem 0.85rem;">
                  ${iconSearch('', 14)} Crawl Metadata
                </button>
              ` : ''}
            </div>

            <div class="ticket-delegation-action">
              <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">
                <strong>Cannot resolve now?</strong> Delegate <code style="color: var(--clinical-cobalt); font-weight: 700;">rel="${escapeHtml(currentQ.rel)}"</code> as an infrastructure task in the IT ticket.
              </div>
              <button id="btn-delegate-ticket" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.75rem; white-space: nowrap; border-color: var(--clinical-cobalt); color: var(--clinical-cobalt);" title="Flag this requirement in the systemic IT ticket and move to next question">
                <span>Add to IT Ticket &amp; Next</span>
                ${iconChevronRight('', 14)}
              </button>
            </div>

            <div class="card-nav" style="display: flex; justify-content: space-between; margin-top: 1.25rem;">
              <button id="btn-prev-q" class="btn btn-secondary" ${activeIdx === 0 ? 'disabled' : ''}>
                ${iconChevronLeft('', 14)}
                <span>Previous</span>
              </button>
              <button id="btn-skip-q" class="btn btn-secondary" title="Skip this question">
                <span>Skip</span>
              </button>
              <button id="btn-undo" class="btn btn-secondary" ${state.history.length === 0 ? 'disabled' : ''}>
                ${iconRotateCcw('', 14)}
                <span>Undo</span>
              </button>
              <button id="btn-next-q" class="btn btn-secondary" ${activeIdx >= questions.length - 1 ? 'disabled' : ''}>
                <span>Next</span>
                ${iconChevronRight('', 14)}
              </button>
            </div>
          </div>
        ` : `
          <div class="healthy-state-card" style="text-align: center; padding: 2.5rem 1.5rem;">
            <div style="color: var(--clinical-emerald); margin-bottom: 0.75rem;">
              ${iconShieldCheck('', 44)}
            </div>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
              All Vital Relations Prescribed!
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.875rem; max-width: 440px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
              Your digital asset conforms to Radical Transparency specifications for ${escapeHtml(activePatternDef.name)}. Open the Export dialog to inspect generated HTTP Link headers, sitemaps, and the systemic IT ticket.
            </p>
          </div>
        `}
      `;
    }

    // Wire Pattern Matrix Clicks
    panel.querySelectorAll('.pattern-badge').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-pattern');
        if (!pid) return;
        if (state.activePatternId === pid) {
          store.setActivePatternId('ALL', 'HUMAN_SWITCHED');
        } else {
          store.setActivePatternId(pid, 'HUMAN_SWITCHED');
        }
      });
    });

    // Wire Preset Cards in Intake Hero
    panel.querySelectorAll('.btn-preset-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-preset-id');
        const preset = SAMPLE_PRESETS.find(p => p.id === id);
        if (preset) {
          const inputEl = panel.querySelector('#seed-uri-input') as HTMLInputElement;
          if (inputEl) inputEl.value = preset.uris.resource;
          runDiagnosisForUri(preset.uris.resource, preset.targetPattern);
        }
      });
    });

    // Wire Review Toggle Button
    panel.querySelector('#btn-toggle-review')?.addEventListener('click', () => {
      store.toggleIntakeReview();
    });

    // Wire Review Pattern Switchers
    panel.querySelectorAll('.btn-pattern-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-pattern');
        if (pid) {
          store.setActivePatternId(pid, 'HUMAN_SWITCHED');
          showToast('Pattern Switched', `Requirements & triage adapted to ${pid}.`, 'info');
        }
      });
    });

    // Wire Apply and Sync
    panel.querySelector('#btn-apply-and-sync')?.addEventListener('click', () => {
      store.toggleIntakeReview(false);
      showToast('Pattern Synchronized', `Active pattern ${state.activePatternId} applied to ER workspace.`, 'success');
    });

    // Wire Smart Suggestions Chips
    panel.querySelectorAll('.smart-suggestion-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const rel = btn.getAttribute('data-rel');
        const uri = btn.getAttribute('data-uri');
        if (rel && uri) {
          store.answerQuestionWithProvenance('smart-inference', rel, uri, 'AUTO_HEURISTIC', 'Smart Linked Data Inference');
          showToast('Smart Suggestion Adopted', `Prescribed ${rel} -> ${uri}`, 'success');
        }
      });
    });

    // Wire Sitemap Copy Button
    panel.querySelector('#btn-copy-sitemap')?.addEventListener('click', () => {
      const xml = generateSitemapXml(state.seedUri, state.links);
      navigator.clipboard?.writeText(xml);
      showToast('Copied', 'Sitemap XML copied to clipboard.', 'success');
    });

    // Wire Enter key on seed URI input
    const seedInputEl = panel.querySelector('#seed-uri-input') as HTMLInputElement;
    seedInputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        panel.querySelector<HTMLButtonElement>('#btn-extract')?.click();
      }
    });

    // Wire Enter key on custom URI input
    const customInputEl = panel.querySelector('#custom-uri-input') as HTMLInputElement;
    customInputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        panel.querySelector<HTMLButtonElement>('#btn-save-answer')?.click();
      }
    });

    // Wire Hostwide wrx Diagnosis
    panel.querySelector('#btn-extract')?.addEventListener('click', async () => {
      const input = (panel.querySelector('#seed-uri-input') as HTMLInputElement)?.value.trim();
      if (!input) {
        showToast('Input Required', 'Please enter a target seed resource URI to diagnose.', 'warning');
        return;
      }
      await runDiagnosisForUri(input);
    });

    // Wire Proactive Secondary Crawl
    panel.querySelector('#btn-crawl-metadata')?.addEventListener('click', async () => {
      const val = (panel.querySelector('#custom-uri-input') as HTMLInputElement)?.value.trim();
      if (!val) {
        showToast('Input Required', 'Please enter a metadata URL to crawl.', 'warning');
        return;
      }
      showToast('Crawling External Metadata', `Querying ${val}...`, 'info');
      const res = await extractResourceLinks(val);
      if (res.links.length > 0) {
        store.setLinks([...state.links, ...res.links]);
      }
      const inference = detectSmartMetadata(res);
      store.setSmartInference(inference);
      store.answerQuestionWithProvenance('q-proactive-missing-ld', 'describedby', val, 'HUMAN', 'Crawled secondary metadata record');
      showToast('External Crawl Complete', `Linked metadata record prescribed with ${res.links.length} secondary links.`, 'success');
    });

    panel.querySelectorAll('.btn-prescription-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const uri = btn.getAttribute('data-uri');
        const stateNow = store.getState();
        const reportNow = evaluateHealthAndGaps(stateNow.seedUri, stateNow.links, stateNow.smartInference);
        const filterNow = stateNow.activePatternId && stateNow.activePatternId !== 'ALL' ? stateNow.activePatternId : undefined;
        const allQ = generateTriageQuestions(reportNow, filterNow);
        const delegated = new Set(
          stateNow.provenanceHistory
            .filter(p => p.source === 'DELEGATED_IT_TICKET')
            .map(p => p.rel.toLowerCase())
        );
        const qList = allQ.filter(q => !delegated.has(q.rel.toLowerCase()));
        const idx = Math.min(stateNow.ui.activeQuestionIndex, Math.max(0, qList.length - 1));
        const q = qList[idx];
        if (uri && q) {
          store.answerQuestionWithProvenance(q.id, q.rel, uri, 'HUMAN', 'Selected from recommended options');
          showToast('Prescription Saved', `Assigned ${q.rel} -> ${uri}`, 'info');
          if (idx < qList.length - 1) {
            store.setQuestionIndex(idx + 1);
          }
        }
      });
    });

    panel.querySelector('#btn-save-answer')?.addEventListener('click', () => {
      const val = (panel.querySelector('#custom-uri-input') as HTMLInputElement)?.value.trim();
      const stateNow = store.getState();
      const reportNow = evaluateHealthAndGaps(stateNow.seedUri, stateNow.links, stateNow.smartInference);
      const filterNow = stateNow.activePatternId && stateNow.activePatternId !== 'ALL' ? stateNow.activePatternId : undefined;
      const allQ = generateTriageQuestions(reportNow, filterNow);
      const delegated = new Set(
        stateNow.provenanceHistory
          .filter(p => p.source === 'DELEGATED_IT_TICKET')
          .map(p => p.rel.toLowerCase())
      );
      const qList = allQ.filter(q => !delegated.has(q.rel.toLowerCase()));
      const idx = Math.min(stateNow.ui.activeQuestionIndex, Math.max(0, qList.length - 1));
      const q = qList[idx];
      if (val && q) {
        store.answerQuestionWithProvenance(q.id, q.rel, val, 'HUMAN', 'Custom user input');
        showToast('Prescription Saved', `Assigned ${q.rel} -> ${val}`, 'info');
        if (idx < qList.length - 1) {
          store.setQuestionIndex(idx + 1);
        }
      }
    });

    // Wire Delegate to IT Ticket Action
    panel.querySelector('#btn-delegate-ticket')?.addEventListener('click', () => {
      const stateNow = store.getState();
      const reportNow = evaluateHealthAndGaps(stateNow.seedUri, stateNow.links, stateNow.smartInference);
      const filterNow = stateNow.activePatternId && stateNow.activePatternId !== 'ALL' ? stateNow.activePatternId : undefined;
      const allQ = generateTriageQuestions(reportNow, filterNow);
      const delegated = new Set(
        stateNow.provenanceHistory
          .filter(p => p.source === 'DELEGATED_IT_TICKET')
          .map(p => p.rel.toLowerCase())
      );
      const qList = allQ.filter(q => !delegated.has(q.rel.toLowerCase()));
      const idx = Math.min(stateNow.ui.activeQuestionIndex, Math.max(0, qList.length - 1));
      const q = qList[idx];
      if (q) {
        store.delegateToItTicket(
          q.id,
          q.rel,
          `Curator flagged rel="${q.rel}" as a systemic infrastructure requirement in IT ticket`
        );
        showToast('Delegated to IT Ticket', `Added rel="${q.rel}" as requirement in export IT ticket.`, 'info');
        const nextCount = qList.length - 1;
        const nextIdx = Math.min(idx, Math.max(0, nextCount - 1));
        store.setQuestionIndex(nextIdx);
      }
    });

    panel.querySelector('#btn-prev-q')?.addEventListener('click', () => {
      const idx = store.getState().ui.activeQuestionIndex;
      store.setQuestionIndex(Math.max(0, idx - 1));
    });
    panel.querySelector('#btn-next-q')?.addEventListener('click', () => {
      const idx = store.getState().ui.activeQuestionIndex;
      store.setQuestionIndex(idx + 1);
    });
    panel.querySelector('#btn-skip-q')?.addEventListener('click', () => {
      const idx = store.getState().ui.activeQuestionIndex;
      store.setQuestionIndex(idx + 1);
      showToast('Question Skipped', 'Moved to next triage item. Gaps remain in review matrix.', 'info');
    });
    panel.querySelector('#btn-undo')?.addEventListener('click', () => {
      store.undo();
      showToast('Action Reverted', 'Reverted previous triage answer.', 'info');
    });
  }

  store.subscribe(render);
  render();
  return panel;
}
