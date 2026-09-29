import type { AppState, RelationProvenance, IntakeSummaryState } from './store';
import type { DiscoveredLink } from '../wrx/types';

export interface CondensedIntakeSummary {
  p: string; // recommendedPatternId
  c: 'high' | 'medium' | 'low'; // confidence
  s: number; // scorePercent
  k: number; // skippedCount
  t: number; // totalCount
  a: Array<{
    t: string; // target
    s: 'SUCCESS' | 'CORS_RESTRICTED' | 'NOT_FOUND' | 'ERROR'; // status
    m?: string; // message
  }>;
}

export interface SessionSnapshot {
  v: 1; // schema version
  u: string; // seedUri
  p: string; // activePatternId
  l: Array<{
    r: string; // rel
    t: string; // target
    s: string; // source
  }>;
  pr: Array<{
    r: string; // rel
    t: string; // targetUri
    s: string; // source
    e?: string; // evidence
  }>;
  is?: CondensedIntakeSummary; // condensed intake summary
  ui?: {
    m?: 'balanced' | 'extended-triage' | 'extended-graph';
    q?: number;
    r?: boolean;
    x?: boolean;
  };
}

export function stateToSnapshot(state: AppState): SessionSnapshot {
  const sortedLinks = [...(state.links || [])]
    .map(l => ({ r: l.rel, t: l.target, s: l.source }))
    .sort((a, b) => a.r.localeCompare(b.r) || a.t.localeCompare(b.t));

  const sortedProvenance = [...(state.provenanceHistory || [])]
    .filter(p => p.rel !== 'pattern-focus')
    .map(p => ({
      r: p.rel,
      t: p.targetUri,
      s: p.source,
      ...(p.evidence ? { e: p.evidence } : {})
    }))
    .sort((a, b) => a.r.localeCompare(b.r) || a.t.localeCompare(b.t));

  let condensedIntake: CondensedIntakeSummary | undefined;
  if (state.intakeSummary) {
    condensedIntake = {
      p: state.intakeSummary.recommendedPatternId,
      c: state.intakeSummary.confidence,
      s: state.intakeSummary.scorePercent,
      k: state.intakeSummary.skippedCount,
      t: state.intakeSummary.totalCount,
      a: (state.intakeSummary.auditLog || []).map(item => ({
        t: item.target,
        s: item.status as any,
        ...(item.message ? { m: item.message } : {})
      }))
    };
  }

  const snapshot: SessionSnapshot = {
    v: 1,
    u: state.seedUri || '',
    p: state.activePatternId || 'PT-01',
    l: sortedLinks,
    pr: sortedProvenance,
    ...(condensedIntake ? { is: condensedIntake } : {}),
    ui: {
      m: state.ui?.viewMode || 'balanced',
      q: state.ui?.activeQuestionIndex || 0,
      r: !!state.ui?.showIntakeReview,
      x: state.ui?.showMissingLinks !== false
    }
  };

  return snapshot;
}

export function snapshotToState(snapshot: SessionSnapshot): Partial<AppState> {
  const links: DiscoveredLink[] = (snapshot.l || []).map(l => ({
    rel: l.r,
    target: l.t,
    source: (l.s as any) || 'link-header'
  }));

  const provenanceHistory: RelationProvenance[] = (snapshot.pr || []).map(p => ({
    rel: p.r,
    targetUri: p.t,
    source: p.s,
    evidence: p.e,
    timestamp: 0
  }));

  let intakeSummary: IntakeSummaryState | undefined;
  if (snapshot.is) {
    intakeSummary = {
      recommendedPatternId: snapshot.is.p,
      confidence: snapshot.is.c,
      scorePercent: snapshot.is.s,
      rationale: `Restored session intake audit (${snapshot.is.p})`,
      skippedCount: snapshot.is.k,
      totalCount: snapshot.is.t,
      auditLog: (snapshot.is.a || []).map(item => ({
        target: item.t,
        status: item.s,
        message: item.m || ''
      }))
    };
  }

  return {
    version: 1,
    seedUri: snapshot.u || '',
    activePatternId: snapshot.p || 'PT-01',
    links,
    provenanceHistory,
    intakeSummary,
    ui: {
      viewMode: snapshot.ui?.m || 'balanced',
      activeQuestionIndex: snapshot.ui?.q || 0,
      showIntakeReview: !!snapshot.ui?.r,
      showMissingLinks: snapshot.ui?.x !== false
    }
  };
}

export function canonicalJsonStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => JSON.stringify(k) + ':' + canonicalJsonStringify(obj[k]));
  return '{' + pairs.join(',') + '}';
}

export async function encodeSessionToFragment(state: AppState): Promise<string> {
  const snapshot = stateToSnapshot(state);
  const json = canonicalJsonStringify(snapshot);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);

  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Response(data).body!.pipeThrough(new CompressionStream('deflate-raw'));
      const compressedBuffer = await new Response(stream).arrayBuffer();
      const base64 = bufferToBase64Url(new Uint8Array(compressedBuffer));
      return `#s1=${base64}`;
    } catch {}
  }
  return `#raw=${bufferToBase64Url(data)}`;
}

export async function decodeFragmentToState(hash: string): Promise<Partial<AppState> | null> {
  if (!hash || !hash.includes('=')) return null;
  const hashClean = hash.replace(/^#/, '');
  const eqIdx = hashClean.indexOf('=');
  if (eqIdx === -1) return null;
  const prefix = hashClean.slice(0, eqIdx);
  const payload = hashClean.slice(eqIdx + 1);
  if (!payload) return null;

  try {
    const bytes = base64UrlToBuffer(payload);
    let json = '';
    if ((prefix === 's1' || prefix === 'gz') && typeof DecompressionStream !== 'undefined') {
      const stream = new Response(bytes as BufferSource).body!.pipeThrough(new DecompressionStream('deflate-raw'));
      const decompressedBuffer = await new Response(stream).arrayBuffer();
      json = new TextDecoder().decode(decompressedBuffer);
    } else {
      json = new TextDecoder().decode(bytes);
    }

    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;

    if ('v' in parsed && 'u' in parsed && 'l' in parsed) {
      return snapshotToState(parsed as SessionSnapshot);
    }

    return parsed as Partial<AppState>;
  } catch (err) {
    return null;
  }
}

export const encodeStateToFragment = encodeSessionToFragment;
export const decodeStateFromFragment = decodeFragmentToState;

function bufferToBase64Url(uint8: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
