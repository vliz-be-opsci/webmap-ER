import {
  iconCross,
  iconClose,
  iconChevronLeft,
  iconChevronRight,
  iconSearch,
  iconListChecks,
  iconSparkles,
  iconNetwork,
  iconFileCode
} from '../icons';

export interface SpotlightStep {
  targetSelector: string;
  title: string;
  lead: string;
  body: string;
  iconSvg: string;
}

const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    targetSelector: '.seed-card, #seed-uri-input',
    title: '1. Seed Resource Diagnostic Input',
    lead: 'Automated Header & Linkset Crawling (wrx)',
    body: 'Start by entering any digital asset or catalog landing page URL (or pick a marine preset from the header). webmap-ER automatically inspects HTTP Link headers, parses embedded JSON-LD graphs, and extracts RDF statements.',
    iconSvg: iconSearch('', 20)
  },
  {
    targetSelector: '.pattern-matrix-strip',
    title: '2. The 9-Pattern Conformance Matrix',
    lead: 'Pattern Applicability & Filtering',
    body: '<strong>Crucial Architecture Principle: Not every URI needs to conform to all 9 patterns!</strong><br/><br/>' +
      '• <strong>Landing pages & dataset files:</strong> Focus on <code>PT-01</code> (Functional Profile) and <code>PT-04</code> (Direct Metadata & PID).<br/>' +
      '• <strong>Data distributions:</strong> Focus on <code>PT-03</code> (Format & profile content negotiation).<br/>' +
      '• <strong>Catalogs & repositories:</strong> Focus on <code>PT-06</code> (Hostwide Sitemaps) and <code>PT-07</code> (Catalog assistance).<br/>' +
      '• <strong>APIs & query services:</strong> Focus on <code>PT-05</code> (Subsetting APIs).<br/>' +
      '• <strong>Versioned datasets:</strong> Focus on <code>PT-09</code> (Release linking & version lifecycle).<br/><br/>' +
      'Click any pattern badge in the matrix to filter questions and graph projections to that specific pattern.',
    iconSvg: iconListChecks('', 20)
  },
  {
    targetSelector: '.question-card, .triage-panel',
    title: '3. Clinical Triage & Smart Suggestions',
    lead: 'Proactive Inquiry & 1-Click Prescriptions',
    body: 'The ER evaluates your vital signs score and presents prioritized gaps. When embedded profiles, DOIs, or OpenAPI endpoints are auto-detected, 1-click chips appear to prescribe them immediately. If no linked data is found, the ER proactively asks for external catalog URIs.',
    iconSvg: iconSparkles('', 20)
  },
  {
    targetSelector: '#graph-container, .graph-panel',
    title: '4. Interactive Topology & Missing Links',
    lead: 'Visualizing Discovered vs. Missing Relations',
    body: 'The coordinate graph renders existing signposting edges. Click <strong>"Show Missing"</strong> in the graph toolbar to project unresolved pattern requirements as dashed <em>ghost nodes</em>—clicking any ghost node immediately navigates to its prescription question!',
    iconSvg: iconNetwork('', 20)
  },
  {
    targetSelector: '#btn-export',
    title: '5. Systemic IT Remediation & GRMPy Testing',
    lead: 'Deploying Server-Wide Reverse Proxy Headers',
    body: 'Click <strong>Export & IT Ticket</strong> to copy ready-to-deploy reverse-proxy configs (Nginx/Apache), XML sitemaps with <code>&lt;xhtml:link&gt;</code>, and a comprehensive systemic issue ticket with an ASCII network topology diagram for your infrastructure team.',
    iconSvg: iconFileCode('', 20)
  }
];

export function createSpotlightTour(
  onClose: () => void,
  onLaunchPreset?: () => void
): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'spotlight-tour-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Interactive Clinical Guidance Tour');

  let currentStepIdx = 0;

  function update() {
    const step = SPOTLIGHT_STEPS[currentStepIdx];
    const isLast = currentStepIdx === SPOTLIGHT_STEPS.length - 1;

    overlay.innerHTML = `
      <div class="spotlight-backdrop"></div>
      <div class="spotlight-target-box" id="spotlight-box"></div>
      <div class="spotlight-card" id="spotlight-card">
        <div class="spotlight-card-header">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div class="brand-emblem" style="width: 24px; height: 24px;">
              ${iconCross('brand-cross', 16)}
            </div>
            <span class="hud-label" style="margin-bottom: 0;">STEP ${currentStepIdx + 1} OF ${SPOTLIGHT_STEPS.length}</span>
          </div>
          <button id="btn-spotlight-close" class="btn btn-icon" aria-label="Exit tour" style="padding: 0.25rem;">
            ${iconClose('', 16)}
          </button>
        </div>

        <div class="spotlight-card-body">
          <div style="display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 0.75rem;">
            <div style="color: var(--clinical-cobalt); flex-shrink: 0; margin-top: 2px;">
              ${step.iconSvg}
            </div>
            <div>
              <div class="hud-label" style="color: var(--clinical-cobalt); margin-bottom: 0.2rem;">${step.lead}</div>
              <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0;">
                ${step.title}
              </h3>
            </div>
          </div>
          <div style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
            ${step.body}
          </div>

          <div class="tour-step-dots" role="tablist" style="margin: 0.75rem 0;">
            ${SPOTLIGHT_STEPS.map((_, i) => `
              <button 
                class="tour-step-dot ${i === currentStepIdx ? 'active' : ''}" 
                data-step="${i}" 
                aria-label="Go to step ${i + 1}"
              ></button>
            `).join('')}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
            <button id="btn-spotlight-preset" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;">
              ${iconSparkles('', 14)}
              <span>Launch Preset</span>
            </button>

            <div style="display: flex; gap: 0.4rem;">
              <button id="btn-spotlight-prev" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" ${currentStepIdx === 0 ? 'disabled' : ''}>
                ${iconChevronLeft('', 14)}
                <span>Prev</span>
              </button>
              <button id="btn-spotlight-next" class="btn btn-primary" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;">
                <span>${isLast ? 'Complete' : 'Next'}</span>
                ${!isLast ? iconChevronRight('', 14) : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Position highlight box and card
    positionSpotlight(step.targetSelector);

    // Event listeners
    overlay.querySelector('#btn-spotlight-close')?.addEventListener('click', () => {
      cleanup();
      onClose();
    });

    overlay.querySelector('#btn-spotlight-preset')?.addEventListener('click', () => {
      cleanup();
      onLaunchPreset?.();
      onClose();
    });

    overlay.querySelector('#btn-spotlight-prev')?.addEventListener('click', () => {
      if (currentStepIdx > 0) {
        currentStepIdx--;
        update();
      }
    });

    overlay.querySelector('#btn-spotlight-next')?.addEventListener('click', () => {
      if (currentStepIdx < SPOTLIGHT_STEPS.length - 1) {
        currentStepIdx++;
        update();
      } else {
        cleanup();
        onClose();
      }
    });

    overlay.querySelectorAll('.tour-step-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const s = dot.getAttribute('data-step');
        if (s !== null) {
          currentStepIdx = parseInt(s, 10);
          update();
        }
      });
    });
  }

  function positionSpotlight(targetSelector: string) {
    const box = overlay.querySelector('#spotlight-box') as HTMLElement;
    const card = overlay.querySelector('#spotlight-card') as HTMLElement;
    if (!box || !card) return;

    const targetEl = document.querySelector(targetSelector) as HTMLElement;
    if (targetEl && targetEl.getBoundingClientRect) {
      const rect = targetEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        box.style.display = 'block';
        box.style.top = `${Math.max(4, rect.top - 6)}px`;
        box.style.left = `${Math.max(4, rect.left - 6)}px`;
        box.style.width = `${rect.width + 12}px`;
        box.style.height = `${rect.height + 12}px`;

        // Position guidance card nearby
        const cardWidth = 420;
        let cardLeft = rect.left;
        if (cardLeft + cardWidth > window.innerWidth - 20) {
          cardLeft = window.innerWidth - cardWidth - 20;
        }
        cardLeft = Math.max(16, cardLeft);

        let cardTop = rect.bottom + 14;
        if (cardTop + 280 > window.innerHeight) {
          cardTop = Math.max(16, rect.top - 310);
        }

        card.style.top = `${cardTop}px`;
        card.style.left = `${cardLeft}px`;
        card.style.position = 'fixed';
        card.style.transform = 'none';
        return;
      }
    }

    // Default fallback to center of viewport
    box.style.display = 'none';
    card.style.position = 'fixed';
    card.style.top = '50%';
    card.style.left = '50%';
    card.style.transform = 'translate(-50%, -50%)';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      cleanup();
      onClose();
    } else if (e.key === 'ArrowRight' && currentStepIdx < SPOTLIGHT_STEPS.length - 1) {
      currentStepIdx++;
      update();
    } else if (e.key === 'ArrowLeft' && currentStepIdx > 0) {
      currentStepIdx--;
      update();
    }
  }

  function cleanup() {
    window.removeEventListener('keydown', handleKeyDown);
  }

  window.addEventListener('keydown', handleKeyDown);
  update();
  return overlay;
}
