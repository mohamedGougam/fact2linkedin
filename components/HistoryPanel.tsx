'use client';

import { AutomationCandidateIndicator } from '@/components/AutomationCandidateIndicator';
import { formatIsoTimestampUi } from '@/lib/formatIsoTimestamp';
import {
  summarizeHistoryRun,
  type GenerationRun
} from '@/lib/historyStorage';

type HistoryPanelProps = {
  runs: GenerationRun[];
  onRestoreFull: (run: GenerationRun) => void;
  onReuseFacts: (run: GenerationRun) => void;
  /** Saved run ids flagged for future automation (local only). */
  automationRunIds: string[];
  onToggleAutomationCandidate: (runId: string) => void;
};

/** Past generations from localStorage: compact summaries and restore options. */
export function HistoryPanel({
  runs,
  onRestoreFull,
  onReuseFacts,
  automationRunIds,
  onToggleAutomationCandidate
}: HistoryPanelProps) {
  if (runs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-sm text-slate-500">
        No saved runs yet. After you generate posts, a snapshot appears here on this device.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {runs.map((run) => (
        <HistoryRunRow
          key={run.id}
          run={run}
          automationOn={automationRunIds.includes(run.id)}
          onToggleAutomation={() => onToggleAutomationCandidate(run.id)}
          onRestoreFull={() => onRestoreFull(run)}
          onReuseFacts={() => onReuseFacts(run)}
        />
      ))}
    </ul>
  );
}

function HistoryRunRow({
  run,
  automationOn,
  onToggleAutomation,
  onRestoreFull,
  onReuseFacts
}: {
  run: GenerationRun;
  automationOn: boolean;
  onToggleAutomation: () => void;
  onRestoreFull: () => void;
  onReuseFacts: () => void;
}) {
  const s = summarizeHistoryRun(run);
  const when = formatIsoTimestampUi(s.timestamp);

  return (
    <li className="group rounded-lg border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 border-l-4 border-indigo-400 pl-3">
          <div className="flex min-w-0 items-center gap-2">
            {automationOn ? <AutomationCandidateIndicator /> : null}
            <p
              className="min-w-0 truncate text-sm font-semibold text-slate-900"
              title={s.topic || undefined}
            >
              {s.topic.trim() ? s.topic : '(no topic)'}
            </p>
          </div>
          <p className="mt-1 text-xs tabular-nums text-slate-500">{when}</p>
          <div className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1.5 text-[11px] leading-tight text-slate-700">
            <StatPill
              label="Research"
              value={s.researchModeLabel ?? '—'}
              title={
                s.researchModeLabel
                  ? 'Research mode when posts were generated'
                  : 'Not stored for this run (saved before this field existed)'
              }
            />
            <StatPill
              label="Facts found"
              value={s.factsFound === null ? '—' : String(s.factsFound)}
              title={
                s.factsFound === null
                  ? 'Unknown for this run'
                  : 'Facts returned from research in the editor'
              }
            />
            <StatPill
              label="Selected"
              value={String(s.factsSelected)}
              title="Facts used for generation"
            />
            <StatPill
              label="Posts"
              value={String(s.postsGenerated)}
              title="Drafts generated"
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
          <button
            type="button"
            suppressHydrationWarning
            onClick={onToggleAutomation}
            className={
              automationOn
                ? 'rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-100'
                : 'rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50'
            }
            title="Flag this saved run as a candidate for future automation (stored locally)"
          >
            Auto candidate
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={onRestoreFull}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            title="Restore topic, facts, tone, styles, and saved post drafts"
          >
            Restore all
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={onReuseFacts}
            className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title="Load saved facts and settings; clear posts so you can generate new drafts"
          >
            Reuse facts only
          </button>
        </div>
      </div>
    </li>
  );
}

function StatPill({
  label,
  value,
  title
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <span
      className="inline-flex max-w-full items-baseline gap-1 rounded-md bg-slate-100/90 px-2 py-1 text-slate-800 ring-1 ring-slate-200/80"
      title={title}
    >
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">{value}</span>
    </span>
  );
}

