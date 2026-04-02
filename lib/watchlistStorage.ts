/**
 * Topic watchlist stored in browser localStorage (no backend persistence).
 * Purpose: keep a short set of topics you want to revisit regularly later.
 */

export type WatchlistItem = {
  id: string;
  topic: string;
  createdAt: string; // ISO 8601
  /** Optional preferences for future recurring research runs (no scheduling yet). */
  recurring?: WatchlistRecurringRunConfig;
};

export type WatchlistFrequency = 'daily' | 'weekly' | 'monthly';

export type WatchlistRecurringRunConfig = {
  /** How often you intend to revisit this topic later (purely stored, not executed). */
  frequency?: WatchlistFrequency;
  preferredResearchMode?: 'mock' | 'web';
  preferredTone?: 'professional' | 'educational' | 'bold' | 'conversational';
  preferredLength?: 'short' | 'medium' | 'long';
  preferredStyles?: Array<
    | 'professional_insight'
    | 'educational'
    | 'bold_thought_leadership'
    | 'storytelling'
    | 'statistic_led'
  >;
};

const STORAGE_KEY = 'fact2linkedin-topic-watchlist';
const MAX_ITEMS = 30;

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isFrequency(x: unknown): x is WatchlistFrequency {
  return x === 'daily' || x === 'weekly' || x === 'monthly';
}

function isResearchMode(x: unknown): x is 'mock' | 'web' {
  return x === 'mock' || x === 'web';
}

function isTone(x: unknown): x is WatchlistRecurringRunConfig['preferredTone'] {
  return x === 'professional' || x === 'educational' || x === 'bold' || x === 'conversational';
}

function isLength(x: unknown): x is WatchlistRecurringRunConfig['preferredLength'] {
  return x === 'short' || x === 'medium' || x === 'long';
}

function isStyle(x: unknown): x is NonNullable<WatchlistRecurringRunConfig['preferredStyles']>[number] {
  return (
    x === 'professional_insight' ||
    x === 'educational' ||
    x === 'bold_thought_leadership' ||
    x === 'storytelling' ||
    x === 'statistic_led'
  );
}

function normalizeRecurring(raw: unknown): WatchlistRecurringRunConfig | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;

  const out: WatchlistRecurringRunConfig = {};
  if (o.frequency !== undefined && isFrequency(o.frequency)) out.frequency = o.frequency;
  if (o.preferredResearchMode !== undefined && isResearchMode(o.preferredResearchMode)) {
    out.preferredResearchMode = o.preferredResearchMode;
  }
  if (o.preferredTone !== undefined && isTone(o.preferredTone)) out.preferredTone = o.preferredTone;
  if (o.preferredLength !== undefined && isLength(o.preferredLength)) out.preferredLength = o.preferredLength;
  if (o.preferredStyles !== undefined && Array.isArray(o.preferredStyles)) {
    const seen = new Set<string>();
    const styles = o.preferredStyles
      .filter((s) => isStyle(s))
      .filter((s) => (seen.has(s) ? false : (seen.add(s), true)));
    if (styles.length > 0) out.preferredStyles = styles;
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function normalize(x: unknown): WatchlistItem | null {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== 'string') return null;
  if (typeof o.topic !== 'string') return null;
  if (typeof o.createdAt !== 'string') return null;
  const topic = o.topic.trim();
  if (!topic) return null;
  return { id: o.id, topic, createdAt: o.createdAt, recurring: normalizeRecurring(o.recurring) };
}

export function loadWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => normalize(x)).filter((x): x is WatchlistItem => x !== null);
  } catch {
    return [];
  }
}

function saveWatchlist(items: WatchlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Ignore quota/private mode; UI still works this session.
  }
}

export function addToWatchlist(topic: string): WatchlistItem[] {
  const t = topic.trim().replace(/\s+/g, ' ');
  if (!t) return loadWatchlist();

  const prev = loadWatchlist();
  const exists = prev.some((i) => i.topic.toLowerCase() === t.toLowerCase());
  if (exists) return prev;

  const item: WatchlistItem = { id: newId(), topic: t, createdAt: new Date().toISOString() };
  const next = [item, ...prev].slice(0, MAX_ITEMS);
  saveWatchlist(next);
  return next;
}

export function removeFromWatchlist(id: string): WatchlistItem[] {
  const prev = loadWatchlist();
  const next = prev.filter((x) => x.id !== id);
  saveWatchlist(next);
  return next;
}

export function updateWatchlistRecurring(
  id: string,
  recurring: WatchlistRecurringRunConfig | undefined
): WatchlistItem[] {
  const prev = loadWatchlist();
  const next = prev.map((it) => {
    if (it.id !== id) return it;
    const clean = normalizeRecurring(recurring);
    return clean ? { ...it, recurring: clean } : { ...it, recurring: undefined };
  });
  saveWatchlist(next);
  return next;
}

