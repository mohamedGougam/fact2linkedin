import { normalizePostStyles, POST_STYLES, type PostStyle } from '@/lib/postStyle';
import { isPostLength, type PostLength } from '@/lib/post-length';
import { isTone, type Tone } from '@/lib/tone';

export type StyleMemory = {
  preferredTone: Tone;
  preferredLength: PostLength;
  preferredPostStyles: PostStyle[];
  preferredResearchMode: 'mock' | 'web';
};

/** Legacy key prefix (pre–KAWN product name); unchanged so existing browser data still loads. */
const STORAGE_KEY = 'fact2linkedin-style-memory';

export const DEFAULT_STYLE_MEMORY: StyleMemory = {
  preferredTone: 'professional',
  preferredLength: 'short',
  preferredPostStyles: [...POST_STYLES],
  preferredResearchMode: 'mock'
};

function normalize(x: unknown): StyleMemory | null {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;

  const tone = isTone(o.preferredTone) ? o.preferredTone : null;
  const length = isPostLength(o.preferredLength) ? o.preferredLength : null;
  const styles = normalizePostStyles(o.preferredPostStyles) ?? null;
  const researchMode = o.preferredResearchMode === 'mock' || o.preferredResearchMode === 'web'
    ? o.preferredResearchMode
    : null;

  if (!tone || !length || !styles || !researchMode) return null;

  return {
    preferredTone: tone,
    preferredLength: length,
    preferredPostStyles: styles,
    preferredResearchMode: researchMode
  };
}

export function loadStyleMemory(): StyleMemory {
  if (typeof window === 'undefined') return DEFAULT_STYLE_MEMORY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STYLE_MEMORY;
    const parsed = JSON.parse(raw) as unknown;
    return normalize(parsed) ?? DEFAULT_STYLE_MEMORY;
  } catch {
    return DEFAULT_STYLE_MEMORY;
  }
}

export function saveStyleMemory(next: StyleMemory) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function clearStyleMemory() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

