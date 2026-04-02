'use client';

import type { WorkflowStep } from '@/lib/workflowStep';

const STEPS: { id: WorkflowStep; label: string; shortLabel: string }[] = [
  { id: 1, label: 'Enter topic', shortLabel: 'Topic' },
  { id: 2, label: 'Collect facts', shortLabel: 'Collect' },
  { id: 3, label: 'Review facts', shortLabel: 'Review' },
  { id: 4, label: 'Generate posts', shortLabel: 'Generate' },
  { id: 5, label: 'Edit / export', shortLabel: 'Export' }
];

type WorkflowIndicatorProps = {
  step: WorkflowStep;
};

/** Lightweight progress hint — not a blocking wizard. */
export function WorkflowIndicator({ step }: WorkflowIndicatorProps) {
  return (
    <nav
      aria-label="Workflow steps"
      className="rounded-lg border border-slate-200/90 bg-slate-50/90 px-3 py-3 sm:px-4"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Workflow</p>
      <ol className="flex flex-wrap items-center gap-y-2 sm:gap-x-0">
        {STEPS.map((s, index) => {
          const isCurrent = s.id === step;
          const isPast = s.id < step;

          return (
            <li key={s.id} className="flex items-center" aria-current={isCurrent ? 'step' : undefined}>
              {index > 0 ? (
                <span className="mx-1.5 text-slate-300 sm:mx-2" aria-hidden>
                  ·
                </span>
              ) : null}
              <span className="flex items-center gap-2">
                <span
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isCurrent
                      ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2 ring-offset-slate-50'
                      : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-400'
                  ].join(' ')}
                  aria-hidden
                >
                  {isPast ? '✓' : s.id}
                </span>
                <span
                  className={[
                    'text-sm',
                    isCurrent ? 'font-semibold text-slate-900' : isPast ? 'text-slate-600' : 'text-slate-400'
                  ].join(' ')}
                >
                  <span className="sm:hidden">{s.shortLabel}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
