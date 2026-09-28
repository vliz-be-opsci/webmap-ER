import { DiscoveredLink } from '../wrx/types';
import { SmartInferenceResult } from '../wrx/smart-detector';

export interface UserInteractionEvent {
  id: string;
  type: 'SET_SEED_URI' | 'ANSWER_QUESTION' | 'ADD_LINK' | 'REMOVE_LINK' | 'SET_VIEW_MODE' | 'SET_ACTIVE_PATTERN';
  timestamp: number;
  payload: any;
}

export interface RelationProvenance {
  rel: string;
  targetUri: string;
  source: string;
  evidence?: string;
  timestamp: number;
}

export interface IntakeSummaryState {
  recommendedPatternId: string;
  confidence: 'high' | 'medium' | 'low';
  scorePercent: number;
  rationale: string;
  skippedCount: number;
  totalCount: number;
  auditLog: Array<{ target: string; status: string; message: string }>;
}

export interface AppState {
  version: number;
  mode: 'triage' | 'wizard';
  seedUri: string;
  activePatternId: string;
  links: DiscoveredLink[];
  smartInference?: SmartInferenceResult;
  history: UserInteractionEvent[];
  provenanceHistory: RelationProvenance[];
  intakeSummary?: IntakeSummaryState;
  ui: {
    viewMode: 'balanced' | 'extended-triage' | 'extended-graph';
    activeQuestionIndex: number;
    showIntakeReview: boolean;
    showMissingLinks: boolean;
  };
}

export class AppStore {
  private state: AppState;
  private listeners: Array<(state: AppState) => void> = [];

  constructor(initialState?: Partial<AppState>) {
    this.state = {
      version: 1,
      mode: 'triage',
      seedUri: '',
      activePatternId: 'PT-01',
      links: [],
      history: [],
      provenanceHistory: [],
      ui: {
        viewMode: 'balanced',
        activeQuestionIndex: 0,
        showIntakeReview: false,
        showMissingLinks: true
      },
      ...initialState
    };
  }

  public getState(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const s = this.getState();
    this.listeners.forEach(l => l(s));
  }

  public setSeedUri(uri: string): void {
    const event: UserInteractionEvent = {
      id: crypto.randomUUID(),
      type: 'SET_SEED_URI',
      timestamp: Date.now(),
      payload: { uri }
    };
    this.state.seedUri = uri;
    this.state.history.push(event);
    this.notify();
  }

  public setLinks(links: DiscoveredLink[]): void {
    this.state.links = links;
    this.notify();
  }

  public answerQuestion(questionId: string, rel: string, targetUri: string): void {
    const event: UserInteractionEvent = {
      id: crypto.randomUUID(),
      type: 'ANSWER_QUESTION',
      timestamp: Date.now(),
      payload: { questionId, rel, targetUri }
    };
    this.state.history.push(event);

    const existingIdx = this.state.links.findIndex(l => l.rel === rel);
    const newLink: DiscoveredLink = {
      target: targetUri,
      rel,
      source: 'link-header'
    };

    if (existingIdx >= 0) {
      this.state.links[existingIdx] = newLink;
    } else {
      this.state.links.push(newLink);
    }

    this.notify();
  }

  public answerQuestionWithProvenance(
    questionId: string,
    rel: string,
    targetUri: string,
    source: string = 'HUMAN',
    evidence?: string
  ): void {
    const event: UserInteractionEvent = {
      id: crypto.randomUUID(),
      type: 'ANSWER_QUESTION',
      timestamp: Date.now(),
      payload: { questionId, rel, targetUri, source, evidence }
    };
    this.state.history.push(event);

    const existingIdx = this.state.links.findIndex(l => l.rel === rel);
    const newLink: DiscoveredLink = {
      target: targetUri,
      rel,
      source: 'link-header'
    };

    if (existingIdx >= 0) {
      this.state.links[existingIdx] = newLink;
    } else {
      this.state.links.push(newLink);
    }

    const prov: RelationProvenance = {
      rel,
      targetUri,
      source,
      evidence,
      timestamp: Date.now()
    };
    const provIdx = this.state.provenanceHistory.findIndex(p => p.rel === rel);
    if (provIdx >= 0) {
      this.state.provenanceHistory[provIdx] = prov;
    } else {
      this.state.provenanceHistory.push(prov);
    }
    this.notify();
  }

  public delegateToItTicket(
    questionId: string,
    rel: string,
    evidence?: string
  ): void {
    const event: UserInteractionEvent = {
      id: crypto.randomUUID(),
      type: 'ANSWER_QUESTION',
      timestamp: Date.now(),
      payload: {
        questionId,
        rel,
        targetUri: '(Delegated to IT Ticket)',
        source: 'DELEGATED_IT_TICKET',
        evidence: evidence || `Curator flagged rel="${rel}" as a systemic infrastructure requirement in IT ticket`
      }
    };
    this.state.history.push(event);

    const prov: RelationProvenance = {
      rel,
      targetUri: '(Delegated to IT Ticket)',
      source: 'DELEGATED_IT_TICKET',
      evidence: evidence || `Curator flagged rel="${rel}" as a systemic infrastructure requirement in IT ticket`,
      timestamp: Date.now()
    };
    const existingIdx = this.state.provenanceHistory.findIndex(p => p.rel === rel);
    if (existingIdx >= 0) {
      this.state.provenanceHistory[existingIdx] = prov;
    } else {
      this.state.provenanceHistory.push(prov);
    }
    this.notify();
  }

  public setIntakeSummary(summary: IntakeSummaryState | undefined): void {
    this.state.intakeSummary = summary;
    this.notify();
  }

  public toggleIntakeReview(show?: boolean): void {
    this.state.ui.showIntakeReview = show !== undefined ? show : !this.state.ui.showIntakeReview;
    this.notify();
  }

  public setViewMode(mode: 'balanced' | 'extended-triage' | 'extended-graph'): void {
    this.state.ui.viewMode = mode;
    this.notify();
  }

  public setActivePatternId(patternId: string, source: string = 'HUMAN_SWITCHED'): void {
    const event: UserInteractionEvent = {
      id: crypto.randomUUID(),
      type: 'SET_ACTIVE_PATTERN',
      timestamp: Date.now(),
      payload: { patternId, source }
    };
    this.state.activePatternId = patternId;
    this.state.ui.activeQuestionIndex = 0;
    this.state.history.push(event);

    if (this.state.intakeSummary) {
      this.state.intakeSummary.recommendedPatternId = patternId;
    }

    const prov: RelationProvenance = {
      rel: 'pattern-focus',
      targetUri: patternId,
      source,
      evidence: `Active pattern focus set to ${patternId}`,
      timestamp: Date.now()
    };
    const existingIdx = this.state.provenanceHistory.findIndex(p => p.rel === 'pattern-focus');
    if (existingIdx >= 0) {
      this.state.provenanceHistory[existingIdx] = prov;
    } else {
      this.state.provenanceHistory.push(prov);
    }

    this.notify();
  }

  public setSmartInference(inference: SmartInferenceResult | undefined): void {
    this.state.smartInference = inference;
    this.notify();
  }

  public setQuestionIndex(index: number): void {
    this.state.ui.activeQuestionIndex = index;
    this.notify();
  }

  public setShowMissingLinks(show: boolean): void {
    this.state.ui.showMissingLinks = show;
    this.notify();
  }

  public undo(): void {
    if (this.state.history.length === 0) return;
    this.state.history.pop();
    const remaining = [...this.state.history];
    this.state.seedUri = '';
    this.state.links = [];
    this.state.provenanceHistory = [];
    this.state.history = [];

    for (const e of remaining) {
      if (e.type === 'SET_SEED_URI') {
        this.setSeedUri(e.payload.uri);
      } else if (e.type === 'ANSWER_QUESTION') {
        if (e.payload.source === 'DELEGATED_IT_TICKET') {
          this.delegateToItTicket(e.payload.questionId, e.payload.rel, e.payload.evidence);
        } else if (e.payload.source) {
          this.answerQuestionWithProvenance(e.payload.questionId, e.payload.rel, e.payload.targetUri, e.payload.source, e.payload.evidence);
        } else {
          this.answerQuestion(e.payload.questionId, e.payload.rel, e.payload.targetUri);
        }
      } else if (e.type === 'SET_ACTIVE_PATTERN') {
        this.setActivePatternId(e.payload.patternId, e.payload.source);
      }
    }
    this.notify();
  }

  public restoreSession(partialState: Partial<AppState>): void {
    if (!partialState) return;
    this.state = {
      ...this.state,
      ...partialState,
      ui: {
        ...this.state.ui,
        ...(partialState.ui || {})
      },
      links: partialState.links ? [...partialState.links] : this.state.links,
      provenanceHistory: partialState.provenanceHistory ? [...partialState.provenanceHistory] : this.state.provenanceHistory
    };
    this.notify();
  }

  public reset(): void {
    this.state.seedUri = '';
    this.state.links = [];
    this.state.history = [];
    this.state.provenanceHistory = [];
    this.state.intakeSummary = undefined;
    this.state.ui.activeQuestionIndex = 0;
    this.state.ui.showIntakeReview = false;
    this.notify();
  }
}
