'use client';

import { useMemo, useState } from 'react';
import { POST_STYLES, POST_STYLE_LABELS, type PostStyle } from '@/lib/postStyle';
import { POST_LENGTHS, type PostLength } from '@/lib/post-length';
import { TONES, type Tone } from '@/lib/tone';
import type { ResearchModeChoice } from '@/components/ResearchModeSelect';
import type {
  WatchlistItem,
  WatchlistFrequency,
  WatchlistRecurringRunConfig
} from '@/lib/watchlistStorage';
import { AutomationCandidateIndicator } from '@/components/AutomationCandidateIndicator';
import { MonitoringPreviewModal } from '@/components/MonitoringPreviewModal';
import type { SessionWorkflowDefaults } from '@/lib/workflowAutomationConfig';

type WatchlistPanelProps = {
  items: WatchlistItem[];
  currentTopic: string;
  onPickTopic: (topic: string) => void;
  onAddTopic: (topic: string) => void;
  onRemove: (id: string) => void;
  onRunResearch: (topic: string) => void;
  onUpdateRecurring: (id: string, recurring: WatchlistRecurringRunConfig | undefined) => void;
  /** Watchlist item ids flagged for future automation (local only). */
  automationWatchlistIds: string[];
  onToggleAutomationCandidate: (id: string) => void;
  /** Resolves “use current” in the monitoring preview. */
  sessionDefaults: SessionWorkflowDefaults;
  busy?: boolean;
};

export function WatchlistPanel({
  items,
  currentTopic,
  onPickTopic,
  onAddTopic,
  onRemove,
  onRunResearch,
  onUpdateRecurring,
  automationWatchlistIds,
  onToggleAutomationCandidate,
  sessionDefaults,
  busy = false
}: WatchlistPanelProps) {
  const [newTopic, setNewTopic] = useState('');
  const [openPrefsId, setOpenPrefsId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<WatchlistItem | null>(null);

  const canAddCurrent = currentTopic.trim().length > 0;
  const canAddNew = newTopic.trim().length > 0;

  const sorted = useMemo(() => items, [items]);
  const automationSet = useMemo(
    () => new Set(automationWatchlistIds),
    [automationWatchlistIds]
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Watchlist</p>
          <p className="mt-0.5 text-sm text-slate-600">
            A small list of topics you want to revisit later.
          </p>
        </div>
        <button
          type="button"
          suppressHydrationWarning
          disabled={!canAddCurrent || busy}
          onClick={() => onAddTopic(currentTopic)}
          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          title="Add the currently typed topic to your watchlist"
        >
          Add current topic
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
          Add a topic
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="e.g. sustainable shipping KPIs"
            autoComplete="off"
            suppressHydrationWarning
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-300"
          />
        </label>
        <button
          type="button"
          suppressHydrationWarning
          disabled={!canAddNew || busy}
          onClick={() => {
            onAddTopic(newTopic);
            setNewTopic('');
          }}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3 text-sm text-slate-600">
          No watchlist items yet. Add your current topic or type one above.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {sorted.map((it) => (
            <li key={it.id} className="rounded-md border border-slate-200 bg-white">
              <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex min-w-0 items-center gap-2">
                    {automationSet.has(it.id) ? <AutomationCandidateIndicator /> : null}
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => onPickTopic(it.topic)}
                      disabled={busy}
                      className="min-w-0 truncate text-left text-sm font-medium text-slate-900 hover:underline"
                      title="Click to use this topic in the research input"
                    >
                      {it.topic}
                    </button>
                  </div>
                  {it.recurring ? (
                    <p className="text-[11px] text-slate-600">
                      Prefs: {formatPrefsSummary(it.recurring)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500">Prefs: none</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => setPreviewItem(it)}
                    disabled={busy}
                    className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-900 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="See what a future automated run would look like (preview only)"
                  >
                    Preview monitoring run
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() =>
                      setOpenPrefsId((prev) => (prev === it.id ? null : it.id))
                    }
                    disabled={busy}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Configure recurring-run preferences (no scheduling yet)"
                  >
                    Preferences
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => onRunResearch(it.topic)}
                    disabled={busy}
                    className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Use this topic and load facts"
                  >
                    Run research
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => onToggleAutomationCandidate(it.id)}
                    disabled={busy}
                    className={
                      automationSet.has(it.id)
                        ? 'rounded-md border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-900 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50'
                        : 'rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
                    }
                    title="Flag this topic as a candidate for future automation (stored locally)"
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => onRemove(it.id)}
                    disabled={busy}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Remove from watchlist"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {openPrefsId === it.id ? (
                <div className="border-t border-slate-100 px-3 py-3">
                  <RecurringPrefsEditor
                    value={it.recurring}
                    busy={busy}
                    onChange={(next) => onUpdateRecurring(it.id, next)}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <MonitoringPreviewModal
        open={previewItem !== null}
        onClose={() => setPreviewItem(null)}
        item={previewItem}
        sessionDefaults={sessionDefaults}
      />
    </div>
  );
}

function formatPrefsSummary(p: WatchlistRecurringRunConfig): string {
  const bits: string[] = [];
  if (p.frequency) bits.push(p.frequency);
  if (p.preferredResearchMode) bits.push(p.preferredResearchMode);
  if (p.preferredTone) bits.push(p.preferredTone);
  if (p.preferredLength) bits.push(p.preferredLength);
  if (p.preferredStyles && p.preferredStyles.length > 0) bits.push(`${p.preferredStyles.length} style(s)`);
  return bits.length > 0 ? bits.join(' · ') : 'none';
}

function RecurringPrefsEditor({
  value,
  onChange,
  busy
}: {
  value: WatchlistRecurringRunConfig | undefined;
  onChange: (next: WatchlistRecurringRunConfig | undefined) => void;
  busy: boolean;
}) {
  const v = value ?? {};

  function set<K extends keyof WatchlistRecurringRunConfig>(
    key: K,
    next: WatchlistRecurringRunConfig[K] | undefined
  ) {
    const updated: WatchlistRecurringRunConfig = { ...v, [key]: next };
    // If user clears everything, store undefined to keep storage clean.
    const hasAny = Object.entries(updated).some(([, val]) =>
      Array.isArray(val) ? val.length > 0 : val !== undefined
    );
    onChange(hasAny ? updated : undefined);
  }

  function toggleStyle(style: PostStyle) {
    const prev = v.preferredStyles ?? [];
    const on = prev.includes(style);
    const next = on ? prev.filter((s) => s !== style) : [...prev, style];
    set('preferredStyles', next.length > 0 ? next : undefined);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Frequency
        <select
          value={(v.frequency ?? '') as WatchlistFrequency | ''}
          onChange={(e) =>
            set('frequency', (e.target.value || undefined) as WatchlistFrequency | undefined)
          }
          disabled={busy}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
        >
          <option value="">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Research mode
        <select
          value={(v.preferredResearchMode ?? '') as ResearchModeChoice | ''}
          onChange={(e) =>
            set(
              'preferredResearchMode',
              (e.target.value || undefined) as ResearchModeChoice | undefined
            )
          }
          disabled={busy}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
        >
          <option value="">Use current</option>
          <option value="mock">Mock</option>
          <option value="web">Live web</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Tone
        <select
          value={(v.preferredTone ?? '') as Tone | ''}
          onChange={(e) => set('preferredTone', (e.target.value || undefined) as Tone | undefined)}
          disabled={busy}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
        >
          <option value="">Use current</option>
          {TONES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Length
        <select
          value={(v.preferredLength ?? '') as PostLength | ''}
          onChange={(e) =>
            set('preferredLength', (e.target.value || undefined) as PostLength | undefined)
          }
          disabled={busy}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400"
        >
          <option value="">Use current</option>
          {POST_LENGTHS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-2">
        <div className="mb-1 text-sm font-medium text-slate-700">Preferred styles</div>
        <div className="flex flex-wrap gap-3">
          {POST_STYLES.map((s) => (
            <label key={s} className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={(v.preferredStyles ?? []).includes(s)}
                onChange={() => toggleStyle(s)}
                disabled={busy}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>{POST_STYLE_LABELS[s]}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          These are saved for future recurring runs; nothing executes automatically yet.
        </p>
      </div>
    </div>
  );
}

