import { DiscoveredLink } from '../wrx/types';

export interface UserInteractionEvent {
  id: string;
  type: 'SET_SEED_URI' | 'ANSWER_QUESTION' | 'ADD_LINK' | 'REMOVE_LINK' | 'SET_VIEW_MODE';
  timestamp: number;
  payload: any;
}

export interface AppState {
  version: number;
  mode: 'triage' | 'wizard';
  seedUri: string;
  activePatternId: string;
  links: DiscoveredLink[];
  history: UserInteractionEvent[];
  ui: {
    viewMode: 'balanced' | 'extended-triage' | 'extended-graph';
    activeQuestionIndex: number;
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
      ui: {
        viewMode: 'balanced',
        activeQuestionIndex: 0
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

  public setViewMode(mode: 'balanced' | 'extended-triage' | 'extended-graph'): void {
    this.state.ui.viewMode = mode;
    this.notify();
  }

  public setQuestionIndex(index: number): void {
    this.state.ui.activeQuestionIndex = index;
    this.notify();
  }

  public undo(): void {
    if (this.state.history.length === 0) return;
    this.state.history.pop();
    const remaining = [...this.state.history];
    this.state.seedUri = '';
    this.state.links = [];
    this.state.history = [];

    for (const e of remaining) {
      if (e.type === 'SET_SEED_URI') this.setSeedUri(e.payload.uri);
      else if (e.type === 'ANSWER_QUESTION') this.answerQuestion(e.payload.questionId, e.payload.rel, e.payload.targetUri);
    }
    this.notify();
  }

  public reset(): void {
    this.state.seedUri = '';
    this.state.links = [];
    this.state.history = [];
    this.state.ui.activeQuestionIndex = 0;
    this.notify();
  }
}
