'use client';

import { useEffect, useId, useRef } from 'react';
import { POST_STYLE_LABELS } from '@/lib/postStyle';
import type { WatchlistItem } from '@/lib/watchlistStorage';
import {
  buildWatchlistWorkflowConfig,
  type SessionWorkflowDefaults
} from '@/lib/workflowAutomationConfig';

type MonitoringPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  item: WatchlistItem | null;
  /** Used when watchlist prefs say “use current” for a field. */
  sessionDefaults: SessionWorkflowDefaults;
};

/** Plain-language preview only — does not run research or schedule anything. */
export function MonitoringPreviewModal({
  open,
  onClose,
  item,
  sessionDefaults
}: MonitoringPreviewModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  const cfg = buildWatchlistWorkflowConfig(item, sessionDefaults, false);
  const r = cfg.recurring;
  const researchMode = cfg.researchMode;
  const tone = cfg.preferredTone;
  const length = cfg.preferredLength;
  const styles = cfg.preferredPostStyles;

  const modeLabel = researchMode === 'web' ? 'Live web' : 'Mock';
  const freqLabel =
    r?.frequency === 'daily'
      ? 'Daily'
      : r?.frequency === 'weekly'
        ? 'Weekly'
        : r?.frequency === 'monthly'
          ? 'Monthly'
          : 'Not set yet (optional)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              Monitoring run preview
            </h2>
            <p className="text-xs text-slate-500">Illustration only — nothing runs or schedules yet.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            suppressHydrationWarning
            onClick={onClose}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm text-slate-700">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topic</h3>
            <p className="mt-1 font-medium text-slate-900">{item.topic}</p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Intended cadence
            </h3>
            <p className="mt-1">{freqLabel}</p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Saved preferences (effective values)
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
              <li>
                Research: <strong className="font-medium">{modeLabel}</strong>
                {!r?.preferredResearchMode ? (
                  <span className="text-slate-500"> (from your current session)</span>
                ) : null}
              </li>
              <li>
                Tone: <strong className="font-medium">{tone}</strong>
                {!r?.preferredTone ? (
                  <span className="text-slate-500"> (from your current session)</span>
                ) : null}
              </li>
              <li>
                Length: <strong className="font-medium">{length}</strong>
                {!r?.preferredLength ? (
                  <span className="text-slate-500"> (from your current session)</span>
                ) : null}
              </li>
              <li>
                Post styles:{' '}
                <strong className="font-medium">
                  {styles.map((s) => POST_STYLE_LABELS[s]).join(', ')}
                </strong>
                {!r?.preferredStyles?.length ? (
                  <span className="text-slate-500"> (from your current session)</span>
                ) : null}
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Expected workflow steps
            </h3>
            <ol className="mt-2 list-inside list-decimal space-y-2 text-slate-700">
              <li>
                <span className="font-medium text-slate-800">Research</span> — fetch facts for the
                topic using <strong>{modeLabel}</strong> mode (when live web is configured).
              </li>
              <li>
                <span className="font-medium text-slate-800">Sources &amp; facts</span> — review
                deduplicated sources and extracted fact rows.
              </li>
              <li>
                <span className="font-medium text-slate-800">Selection</span> — choose which facts
                feed generation (today you pick manually; automation could apply rules later).
              </li>
              <li>
                <span className="font-medium text-slate-800">Drafts</span> — generate KAWN-style
                posts with your tone, length, and one KAWN Post Draft per selected style.
              </li>
              <li>
                <span className="font-medium text-slate-800">Optional</span> — content brief, AI
                polish, export, or history snapshot — same tools you use today.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Output types you would get
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-700">
              <li>A structured fact list with source links and metadata</li>
              <li>A source review list (unique URLs / titles)</li>
              <li>
                {styles.length} KAWN Post Draft{styles.length === 1 ? '' : 's'} (
                {styles.map((s) => POST_STYLE_LABELS[s]).join('; ')})
              </li>
              <li>Optional: exported run package / saved history on this device</li>
            </ul>
          </section>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 py-3">
          <p className="text-xs leading-relaxed text-slate-600">
            Automated scheduling isn&apos;t available yet. To run this pipeline now, use{' '}
            <strong className="font-medium text-slate-800">Run research</strong> on this watchlist
            topic.
          </p>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Developed by: <span className="font-medium text-slate-600">Mohamed Gougam</span>
          </p>
        </div>
      </div>
    </div>
  );
}
