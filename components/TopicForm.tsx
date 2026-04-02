'use client';

import {
  ResearchModeSelect,
  type ResearchModeChoice
} from '@/components/ResearchModeSelect';

type TopicFormProps = {
  topic: string;
  onTopicChange: (value: string) => void;
  researchMode: ResearchModeChoice;
  onResearchModeChange: (value: ResearchModeChoice) => void;
  /** Loads facts for the current topic (does not build posts yet). */
  onLoadFacts: () => void;
  busy?: boolean;
};

/** Topic field + research mode + button to fetch facts from the server. */
export function TopicForm({
  topic,
  onTopicChange,
  researchMode,
  onResearchModeChange,
  onLoadFacts,
  busy = false
}: TopicFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
          Topic
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="e.g. sustainable shipping"
            autoComplete="off"
            name="topic"
            suppressHydrationWarning
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none ring-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-300"
          />
        </label>
        <button
          type="button"
          suppressHydrationWarning
          onClick={onLoadFacts}
          disabled={busy}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Working…' : 'Load facts'}
        </button>
      </div>
      <ResearchModeSelect
        value={researchMode}
        onChange={onResearchModeChange}
        disabled={busy}
      />
    </div>
  );
}
