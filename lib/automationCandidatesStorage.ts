/**
 * Local-only flags: which watchlist items, saved runs, or the settings profile
 * are candidates for future automation (no scheduling yet).
 */

const STORAGE_KEY = 'fact2linkedin-automation-candidates';

export type AutomationCandidatesState = {
  watchlistIds: string[];
  runIds: string[];
  /** The single app-wide style memory profile. */
  settingsProfile: boolean;
};

const DEFAULT_STATE: AutomationCandidatesState = {
  watchlistIds: [],
  runIds: [],
  settingsProfile: false
};

function normalize(raw: unknown): AutomationCandidatesState {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_STATE };
  }
  const o = raw as Record<string, unknown>;
  const watchlistIds = Array.isArray(o.watchlistIds)
    ? o.watchlistIds.filter((x): x is string => typeof x === 'string')
    : [];
  const runIds = Array.isArray(o.runIds)
    ? o.runIds.filter((x): x is string => typeof x === 'string')
    : [];
  const settingsProfile = o.settingsProfile === true;
  return { watchlistIds, runIds, settingsProfile };
}

export function loadAutomationCandidates(): AutomationCandidatesState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return normalize(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveAutomationCandidates(next: AutomationCandidatesState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

export function toggleWatchlistAutomationCandidate(
  id: string
): AutomationCandidatesState {
  const cur = loadAutomationCandidates();
  const set = new Set(cur.watchlistIds);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const next = { ...cur, watchlistIds: Array.from(set) };
  saveAutomationCandidates(next);
  return next;
}

export function toggleRunAutomationCandidate(id: string): AutomationCandidatesState {
  const cur = loadAutomationCandidates();
  const set = new Set(cur.runIds);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  const next = { ...cur, runIds: Array.from(set) };
  saveAutomationCandidates(next);
  return next;
}

export function setSettingsProfileAutomationCandidate(on: boolean): AutomationCandidatesState {
  const cur = loadAutomationCandidates();
  const next = { ...cur, settingsProfile: on };
  saveAutomationCandidates(next);
  return next;
}

export function toggleSettingsProfileAutomationCandidate(): AutomationCandidatesState {
  const cur = loadAutomationCandidates();
  const next = { ...cur, settingsProfile: !cur.settingsProfile };
  saveAutomationCandidates(next);
  return next;
}

/** Drop a watchlist id when the item is removed (keeps storage tidy). */
export function removeWatchlistAutomationFlag(id: string): AutomationCandidatesState {
  const cur = loadAutomationCandidates();
  const next = {
    ...cur,
    watchlistIds: cur.watchlistIds.filter((x) => x !== id)
  };
  saveAutomationCandidates(next);
  return next;
}
