import { AppStore } from '../../core/state/store';
import { evaluateHealthAndGaps } from '../../core/triage/diagnostics';
import { generateTriageQuestions } from '../../core/triage/questions';
import { extractResourceLinks } from '../../core/wrx/extractor';
import { detectSmartMetadata } from '../../core/wrx/smart-detector';
import { probeHostwideResource } from '../../core/wrx/host-prober';
import { classifyResourcePattern } from '../../core/wrx/pattern-classifier';
import { buildIntakeQuestions } from '../../core/triage/intake-model';
import { generateSitemapXml } from '../../core/export/sitemap';
import { RT_PATTERNS, getPatternById } from '../../core/rt/patterns';
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

  function render() {
    const state = store.getState();
    const report = evaluateHealthAndGaps(state.seedUri, state.links, state.smartInference);
    const activeFilter = state.activePatternId && state.activePatternId !== 'ALL' ? state.activePatternId : undefined;
    const questions = generateTriageQuestions(report, activeFilter);
    const activeIdx = Math.min(state.ui.activeQuestionIndex, Math.max(0, questions.length - 1));
    const currentQ = questions[activeIdx];

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

    const intakeSummary = state.intakeSummary;

    // Build pattern-specific relations for Provenance Review Matrix
    const activePatternDef = getPatternById(state.activePatternId);
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

    panel.innerHTML = `
      <!-- Clinical Telemetry HUD -->
      <section class="telemetry-hud" aria-label="RT Health Diagnostic Telemetry">
        <div class="hud-top-row">
          <div class="hud-lead">
            <span class="hud-label">RT VITAL SIGNS SCORE</span>
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
        <div class="hud-secondary-strip">
          <div class="hud-meta-item">
            <span>DETECTED RELS:</span>
            <strong class="tabular-numbers">${report.presentRelations.length}</strong>
          </div>
          <div class="hud-meta-item">
            <span>UNRESOLVED GAPS:</span>
            <strong class="tabular-numbers">${report.gaps.length}</strong>
          </div>
          <div class="hud-meta-item">
            <span>STANDARD:</span>
            <strong>RFC 8288 / 9264</strong>
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

      <!-- Target Seed Resource Input Bar -->
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
            value="${state.seedUri}" 
            aria-label="Seed Resource URI"
          />
          <button id="btn-extract" class="btn btn-primary" style="border-radius: 0; padding: 0.5rem 1rem;">
            Diagnose (wrx)
          </button>
        </div>
      </section>

      <!-- Provenance Audit Strip -->
      ${intakeSummary ? `
        <div class="provenance-audit-strip">
          <div class="provenance-audit-header">
            <div class="provenance-audit-title">
              <span class="smart-badge-icon">${iconSparkles('', 14)}</span>
              <span>Active Pattern: <strong>${state.activePatternId}</strong> (${intakeSummary.confidence.toUpperCase()} CONFIDENCE)</span>
            </div>
            <button id="btn-toggle-review" class="btn btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.75rem;">
              ${state.ui.showIntakeReview ? 'Hide Review' : 'View Provenance & Review'}
            </button>
          </div>
          <div class="provenance-audit-checklist">
            ${intakeSummary.auditLog.map(audit => `
              <span class="provenance-check-item ${audit.status === 'SUCCESS' ? 'status-success' : 'status-cors'}">
                <span>${audit.status === 'SUCCESS' ? '✓' : '!'}</span>
                <span>${audit.target.split('/').pop() || audit.target}: ${audit.status}</span>
              </span>
            `).join('')}
            <span class="provenance-check-item">
              <span>${intakeSummary.skippedCount} questions auto-resolved</span>
            </span>
          </div>
        </div>
      ` : ''}

      <!-- Pattern & Provenance Review Matrix Card -->
      ${state.ui.showIntakeReview ? `
        <div class="provenance-review-matrix">
          <div class="card-header-meta">
            <span class="card-step-badge">INTAKE & PROVENANCE AUDIT</span>
            <span class="hud-condition-badge status-healthy">${state.activePatternId} CONFORMANCE</span>
          </div>
          <h3 class="card-title">Pattern Conformance & Provenance Review</h3>
          <p class="card-prompt">
            Review relations derived by wrx hostwide discovery and user prescriptions for <strong>${activePatternDef ? activePatternDef.name : state.activePatternId}</strong>. Switching patterns immediately adapts the audit requirements and triage questions.
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
                  : item.source.startsWith('AUTO_ROBOTS') || item.source.startsWith('AUTO_SITEMAP') || item.source.startsWith('AUTO_LINK') || item.source.startsWith('AUTO_JSONLD')
                    ? 'badge-auto'
                    : item.source.startsWith('AUTO_HEURISTIC')
                      ? 'badge-heuristic'
                      : 'badge-human';
                return `
                  <tr>
                    <td>
                      <strong>${item.rel}</strong>
                      ${item.isRequired ? '<span class="req-tag" style="font-size: 0.65rem; color: var(--clinical-crimson); margin-left: 4px;">REQUIRED</span>' : '<span class="req-tag" style="font-size: 0.65rem; color: var(--text-secondary); margin-left: 4px;">RECOMMENDED</span>'}
                    </td>
                    <td><code>${escapeHtml(item.targetUri)}</code></td>
                    <td>
                      <span class="provenance-badge ${badgeClass}">${item.source}</span>
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
      ` : ''}

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
                <span>Adopt Profile: <strong>${p.label}</strong></span>
              </button>
            `).join('')}
            ${(report.smartInference.detectedPids || []).map(p => `
              <button class="smart-suggestion-chip" data-rel="cite-as" data-uri="${p.uri}">
                <span>Adopt PID: <strong>${p.label}</strong></span>
              </button>
            `).join('')}
            ${(report.smartInference.detectedApis || []).map(a => `
              <button class="smart-suggestion-chip" data-rel="service-desc" data-uri="${a.endpoint}">
                <span>Link API: <strong>${a.label}</strong></span>
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
          <h3 class="card-title">${currentQ.title}</h3>
          <p class="card-prompt">${currentQ.prompt}</p>
          
          <div class="clinical-guidance-panel">
            <div class="guidance-icon">${iconInfo('', 18)}</div>
            <div class="guidance-body">
              <strong>Why This Matters:</strong> ${currentQ.didacticText}
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
                <button class="btn-prescription-opt" data-uri="${opt.uri}">
                  <span class="prescription-opt-title">${opt.label}</span>
                  <span class="prescription-opt-uri">${opt.uri}</span>
                  ${opt.description ? `<span class="prescription-opt-desc">${opt.description}</span>` : ''}
                </button>
              `).join('')}
            </div>
          ` : ''}

          <div class="terminal-input-group" style="margin-top: 1rem;">
            <input 
              type="text" 
              id="custom-uri-input" 
              class="form-control-bare" 
              placeholder="${currentQ.inputPlaceholder}" 
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
            Your digital asset conforms to Radical Transparency specifications. Open the Export dialog to inspect generated HTTP Link headers, sitemaps, and the systemic IT ticket.
          </p>
        </div>
      `}
    `;

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

    // Wire Hostwide wrx Diagnosis
    panel.querySelector('#btn-extract')?.addEventListener('click', async () => {
      const input = (panel.querySelector('#seed-uri-input') as HTMLInputElement)?.value.trim();
      if (!input) return;
      store.setSeedUri(input);
      showToast('wrx Probing', 'Probing seed resource, robots.txt, and sitemaps...', 'info');

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

      // Set intake summary
      store.setIntakeSummary({
        recommendedPatternId: classification.recommendedPattern,
        confidence: classification.confidence,
        scorePercent: classification.scorePercent,
        rationale: classification.rationale,
        skippedCount: autoSkippedCount,
        totalCount: intakeQuestions.length,
        auditLog: extraction.auditLog
      });

      // Update active pattern
      store.setActivePatternId(classification.recommendedPattern, 'AUTO_DEDUCED');

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
          `Deduced ${classification.recommendedPattern} (${classification.confidence} confidence). ${autoSkippedCount} questions auto-resolved.`,
          'success'
        );
      }
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
        if (uri && currentQ) {
          store.answerQuestionWithProvenance(currentQ.id, currentQ.rel, uri, 'HUMAN', 'Selected from recommended options');
          showToast('Prescription Saved', `Assigned ${currentQ.rel} -> ${uri}`, 'info');
          if (activeIdx < questions.length - 1) {
            store.setQuestionIndex(activeIdx + 1);
          }
        }
      });
    });

    panel.querySelector('#btn-save-answer')?.addEventListener('click', () => {
      const val = (panel.querySelector('#custom-uri-input') as HTMLInputElement)?.value.trim();
      if (val && currentQ) {
        store.answerQuestionWithProvenance(currentQ.id, currentQ.rel, val, 'HUMAN', 'Custom user input');
        showToast('Prescription Saved', `Assigned ${currentQ.rel} -> ${val}`, 'info');
        if (activeIdx < questions.length - 1) {
          store.setQuestionIndex(activeIdx + 1);
        }
      }
    });

    panel.querySelector('#btn-prev-q')?.addEventListener('click', () => store.setQuestionIndex(activeIdx - 1));
    panel.querySelector('#btn-next-q')?.addEventListener('click', () => store.setQuestionIndex(activeIdx + 1));
    panel.querySelector('#btn-skip-q')?.addEventListener('click', () => {
      store.setQuestionIndex(activeIdx + 1);
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
