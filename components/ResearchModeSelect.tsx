'use client';

import type { WorkflowResearchMode } from '@/lib/workflowAutomationConfig';

/** Mock vs live web — same union as `WorkflowResearchMode` in `lib/workflowAutomationConfig.ts`. */
export type ResearchModeChoice = WorkflowResearchMode;

type ResearchModeSelectProps = {
  value: ResearchModeChoice;
  onChange: (value: ResearchModeChoice) => void;
  disabled?: boolean;
};

/** Compact mock vs live web toggle for `/api/facts`. */
export function ResearchModeSelect({
  value,
  onChange,
  disabled = false
}: ResearchModeSelectProps) {
  return (
    <fieldset className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
      <legend className="sr-only">Research mode</legend>
      <span className="shrink-0 font-medium text-slate-600">Research</span>
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="researchMode"
            className="h-3.5 w-3.5 border-slate-300 text-slate-900"
            checked={value === 'mock'}
            onChange={() => onChange('mock')}
            disabled={disabled}
            suppressHydrationWarning
          />
          <span>Mock</span>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="researchMode"
            className="h-3.5 w-3.5 border-slate-300 text-slate-900"
            checked={value === 'web'}
            onChange={() => onChange('web')}
            disabled={disabled}
            suppressHydrationWarning
          />
          <span>Live web</span>
        </label>
      </div>
    </fieldset>
  );
}
