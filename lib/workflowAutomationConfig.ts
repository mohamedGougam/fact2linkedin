/**
 * Unified workflow + automation configuration for research → generate flows.
 * Single place for types, defaults resolution, and future automation runners.
 */

import type { ContentRunReport } from '@/lib/contentRunReport';
import type { PostStyle } from '@/lib/postStyle';
import type { StyleMemory } from '@/lib/styleMemory';
import type { PostLength } from '@/lib/post-length';
import type { Tone } from '@/lib/tone';
import type { WatchlistItem, WatchlistRecurringRunConfig } from '@/lib/watchlistStorage';

/**
 * Mock vs live web — same values as the Research toggle in the UI (`ResearchModeSelect`).
 */
export type WorkflowResearchMode = 'mock' | 'web';

/**
 * Identity + timestamps when this config is tied to a watchlist row.
 */
export type WorkflowWatchlistContext = {
  itemId: string;
  createdAt?: string;
};

/**
 * Full snapshot: topic, research + generation defaults, optional watchlist/recurring
 * context, and whether this snapshot is flagged for future automation.
 */
export type WorkflowAutomationConfig = {
  topic: string;
  researchMode: WorkflowResearchMode;
  preferredTone: Tone;
  preferredLength: PostLength;
  preferredPostStyles: PostStyle[];
  /** Cadence / per-topic overrides (same shape as stored on {@link WatchlistItem}). */
  recurring: WatchlistRecurringRunConfig | null;
  /** Non-null when describing a specific watchlist entry. */
  watchlist: WorkflowWatchlistContext | null;
  automationCandidate: boolean;
};

/**
 * Subset used for “use current session” resolution in watchlist previews and editors.
 */
export type SessionWorkflowDefaults = Pick<
  WorkflowAutomationConfig,
  'researchMode' | 'preferredTone' | 'preferredLength' | 'preferredPostStyles'
>;

export function pickSessionDefaults(c: WorkflowAutomationConfig): SessionWorkflowDefaults {
  return {
    researchMode: c.researchMode,
    preferredTone: c.preferredTone,
    preferredLength: c.preferredLength,
    preferredPostStyles: c.preferredPostStyles
  };
}

export function sessionDefaultsFromStyleMemory(sm: StyleMemory): SessionWorkflowDefaults {
  return {
    researchMode: sm.preferredResearchMode,
    preferredTone: sm.preferredTone,
    preferredLength: sm.preferredLength,
    preferredPostStyles: sm.preferredPostStyles
  };
}

/** Main editor session: no watchlist row, no recurring block (those live on items). */
export function buildSessionWorkflowConfig(input: {
  topic: string;
  researchMode: WorkflowResearchMode;
  preferredTone: Tone;
  preferredLength: PostLength;
  preferredPostStyles: PostStyle[];
  /** Matches “saved preferences” automation checkbox. */
  settingsAutomationCandidate: boolean;
}): WorkflowAutomationConfig {
  return {
    topic: input.topic.trim(),
    researchMode: input.researchMode,
    preferredTone: input.preferredTone,
    preferredLength: input.preferredLength,
    preferredPostStyles: input.preferredPostStyles,
    recurring: null,
    watchlist: null,
    automationCandidate: input.settingsAutomationCandidate
  };
}

/**
 * Resolved defaults for a watchlist item (recurring overrides session where set).
 */
export function buildWatchlistWorkflowConfig(
  item: WatchlistItem,
  sessionDefaults: SessionWorkflowDefaults,
  automationCandidate: boolean
): WorkflowAutomationConfig {
  const recurring = item.recurring ?? null;
  return {
    topic: item.topic,
    researchMode: recurring?.preferredResearchMode ?? sessionDefaults.researchMode,
    preferredTone: recurring?.preferredTone ?? sessionDefaults.preferredTone,
    preferredLength: recurring?.preferredLength ?? sessionDefaults.preferredLength,
    preferredPostStyles:
      recurring?.preferredStyles && recurring.preferredStyles.length > 0
        ? recurring.preferredStyles
        : sessionDefaults.preferredPostStyles,
    recurring,
    watchlist: { itemId: item.id, createdAt: item.createdAt },
    automationCandidate
  };
}

/** Map a saved history run to a workflow config (no watchlist; recurring not stored on runs). */
export function workflowConfigFromContentRunReport(
  report: ContentRunReport,
  automationCandidate: boolean
): WorkflowAutomationConfig {
  const go = report.generationOptions;
  return {
    topic: report.topic.trim(),
    researchMode: report.researchMode,
    preferredTone: go.tone,
    preferredLength: go.length,
    preferredPostStyles: go.postStyles,
    recurring: null,
    watchlist: null,
    automationCandidate
  };
}
