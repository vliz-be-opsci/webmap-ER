/**
 * Reusable inline SVG icons for webmap-ER.
 * Adheres strictly to the Zero-Emoji Mandate.
 * All icons render with stroke="currentColor", fill="none", and viewBox="0 0 24 24".
 */

function svgWrap(content: string, cls = 'icon-svg', size = 18): string {
  const classAttr = cls ? ` class="${cls}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${classAttr} aria-hidden="true">${content}</svg>`;
}

export function iconCross(cls?: string, size?: number): string {
  return svgWrap('<path d="M12 4v16m-8-8h16" />', cls, size);
}

export function iconListChecks(cls?: string, size?: number): string {
  return svgWrap('<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>', cls, size);
}

export function iconColumns2(cls?: string, size?: number): string {
  return svgWrap('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>', cls, size);
}

export function iconNetwork(cls?: string, size?: number): string {
  return svgWrap('<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>', cls, size);
}

export function iconLink(cls?: string, size?: number): string {
  return svgWrap('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>', cls, size);
}

export function iconFileCode(cls?: string, size?: number): string {
  return svgWrap('<path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/>', cls, size);
}

export function iconHelpCircle(cls?: string, size?: number): string {
  return svgWrap('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>', cls, size);
}

export function iconInfo(cls?: string, size?: number): string {
  return svgWrap('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', cls, size);
}

export function iconRotateCcw(cls?: string, size?: number): string {
  return svgWrap('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>', cls, size);
}

export function iconChevronLeft(cls?: string, size?: number): string {
  return svgWrap('<path d="m15 18-6-6 6-6"/>', cls, size);
}

export function iconChevronRight(cls?: string, size?: number): string {
  return svgWrap('<path d="m9 18 6-6-6-6"/>', cls, size);
}

export function iconChevronUp(cls?: string, size?: number): string {
  return svgWrap('<path d="m18 15-6-6-6 6"/>', cls, size);
}

export function iconChevronDown(cls?: string, size?: number): string {
  return svgWrap('<path d="m6 9 6 6 6-6"/>', cls, size);
}

export function iconShieldCheck(cls?: string, size?: number): string {
  return svgWrap('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>', cls, size);
}

export function iconSun(cls?: string, size?: number): string {
  return svgWrap('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>', cls, size);
}

export function iconMoon(cls?: string, size?: number): string {
  return svgWrap('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>', cls, size);
}

export function iconCopy(cls?: string, size?: number): string {
  return svgWrap('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>', cls, size);
}

export function iconCheck(cls?: string, size?: number): string {
  return svgWrap('<path d="M20 6 9 17l-5-5"/>', cls, size);
}

export function iconClose(cls?: string, size?: number): string {
  return svgWrap('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', cls, size);
}

export function iconSparkles(cls?: string, size?: number): string {
  return svgWrap('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>', cls, size);
}

export function iconSearch(cls?: string, size?: number): string {
  return svgWrap('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', cls, size);
}

