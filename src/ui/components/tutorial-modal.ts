import {
  iconCross,
  iconClose,
  iconListChecks,
  iconFileCode,
  iconChevronLeft,
  iconChevronRight,
  iconSearch,
  iconSparkles
} from '../icons';

export interface TourStep {
  stepNumber: number;
  title: string;
  lead: string;
  body: string;
  iconSvg: string;
  iconColor: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    title: 'The Radical Transparency Paradigm',
    lead: 'Machine-Actionable FAIR Interoperability',
    body: 'Radical Transparency (RT) allows search engines, scientific harvesters (EOSC, OpenAIRE), and AI agents to discover what standards, metadata profiles, and persistent identifiers (PIDs) govern a digital resource using standardized RFC 8288 HTTP Link headers and XML sitemaps—without having to scrape or parse unstructured HTML.',
    iconSvg: iconCross('brand-cross', 24),
    iconColor: 'var(--clinical-cobalt)'
  },
  {
    stepNumber: 2,
    title: 'Seed Resource Extraction (wrx)',
    lead: 'Automated Header & Linkset Crawling',
    body: 'Enter any dataset, API endpoint, or landing page URL. webmap-ER automatically inspects HTTP Link headers, fetches embedded and linked RDF bodies (JSON-LD, Turtle), and resolves RFC 9264 linksets in real time.',
    iconSvg: iconSearch('', 24),
    iconColor: 'var(--clinical-emerald)'
  },
  {
    stepNumber: 3,
    title: 'Smart Metadata & Auto-Detection',
    lead: 'Automatic Profile & Identifier Extraction',
    body: 'When linked data is discovered, our smart detection engine traverses JSON-LD graphs and RDF contexts to extract conformsTo profiles (e.g. RO-Crate, DCAT-AP), permanent DOIs, and subsetting API descriptors, giving you 1-click adoption chips.',
    iconSvg: iconSparkles('', 24),
    iconColor: 'var(--clinical-amber)'
  },
  {
    stepNumber: 4,
    title: 'The 8-Pattern RT Conformance Matrix',
    lead: 'Full Coverage Across PT-01 to PT-08',
    body: 'The Telemetry HUD and Pattern Matrix Strip audit adherence across all 8 EOSC Radical Transparency patterns: profile conformity, composition, content negotiation, direct metadata, subsetting APIs, hostwide sitemaps, catalog assistance, and external linksets.',
    iconSvg: iconListChecks('', 24),
    iconColor: 'var(--clinical-cobalt)'
  },
  {
    stepNumber: 5,
    title: 'Systemic IT Remediation & GRMPy Testing',
    lead: 'Ready-to-Deploy Reverse Proxy Snippets & Test Suites',
    body: 'Generate copy-paste Nginx and Apache reverse proxy headers, live XML sitemaps with <xhtml:link> signposting, and systemic IT issue tickets with ASCII network topologies and reproducible containerized GRMPy test runner commands.',
    iconSvg: iconFileCode('', 24),
    iconColor: 'var(--clinical-emerald)'
  }
];

export function createTutorialModal(
  onClose: () => void,
  onLaunchPreset?: () => void
): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  let currentStep = 0;

  function render() {
    const step = TOUR_STEPS[currentStep];

    modal.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" style="max-width: 660px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.625rem;">
            <div class="brand-emblem" style="width: 28px; height: 28px;">
              ${iconCross('brand-cross', 18)}
            </div>
            <h2 id="tutorial-title" style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
              webmap-ER Clinical Tour (Step ${currentStep + 1} of ${TOUR_STEPS.length})
            </h2>
          </div>
          <button id="tutorial-close-btn" class="btn btn-icon" aria-label="Close tutorial">
            ${iconClose('', 18)}
          </button>
        </div>

        <div class="modal-body" style="padding: 1.5rem; line-height: 1.55; font-size: 0.875rem; color: var(--text-primary);">
          <div class="tutorial-steps tour-card">
            <div style="color: ${step.iconColor}; flex-shrink: 0; margin-top: 2px;">
              ${step.iconSvg}
            </div>
            <div>
              <div class="hud-label" style="margin-bottom: 0.25rem;">${step.lead}</div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
                ${step.title}
              </h3>
              <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">
                ${step.body}
              </p>
            </div>
          </div>

          <div class="tour-step-dots" role="tablist" aria-label="Tour progress dots">
            ${TOUR_STEPS.map((_, i) => `
              <button 
                class="tour-step-dot ${i === currentStep ? 'active' : ''}" 
                data-step="${i}" 
                aria-label="Go to step ${i + 1}"
                tabindex="0"
              ></button>
            `).join('')}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <button id="btn-launch-preset" class="btn btn-secondary">
              ${iconSparkles('', 14)}
              <span>Launch Sample Preset</span>
            </button>

            <div style="display: flex; gap: 0.5rem;">
              <button id="btn-tour-prev" class="btn btn-secondary" ${currentStep === 0 ? 'disabled' : ''}>
                ${iconChevronLeft('', 14)}
                <span>Previous</span>
              </button>
              <button id="btn-tour-next" class="btn btn-primary">
                <span>${currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}</span>
                ${currentStep < TOUR_STEPS.length - 1 ? iconChevronRight('', 14) : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Wire events
    modal.querySelector('#tutorial-close-btn')?.addEventListener('click', onClose);
    modal.querySelector('#btn-launch-preset')?.addEventListener('click', () => {
      onLaunchPreset?.();
      onClose();
    });

    modal.querySelector('#btn-tour-prev')?.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        render();
      }
    });

    modal.querySelector('#btn-tour-next')?.addEventListener('click', () => {
      if (currentStep < TOUR_STEPS.length - 1) {
        currentStep++;
        render();
      } else {
        onClose();
      }
    });

    modal.querySelectorAll('.tour-step-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const s = dot.getAttribute('data-step');
        if (s !== null) {
          currentStep = parseInt(s, 10);
          render();
        }
      });
    });
  }

  render();
  return modal;
}
