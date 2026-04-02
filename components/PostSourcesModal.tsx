'use client';

import { useEffect, useId, useRef } from 'react';
import type { Fact } from '@/lib/types/fact';
import { hostnameFromUrl } from '@/lib/sourceDisplay';

type PostSourcesModalProps = {
  open: boolean;
  onClose: () => void;
  /** Facts that were used when this draft was produced. */
  facts: Fact[];
  postLabel: string;
};

/**
 * Accessible overlay listing claims and sources for one draft (no internal pipeline details).
 */
export function PostSourcesModal({
  open,
  onClose,
  facts,
  postLabel
}: PostSourcesModalProps) {
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

  if (!open) return null;

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
        className="max-h-[min(85vh,720px)] w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              Sources behind this post
            </h2>
            <p className="text-xs text-slate-500">{postLabel}</p>
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
        <div className="max-h-[min(65vh,560px)] overflow-y-auto px-4 py-3">
          {facts.length === 0 ? (
            <p className="text-sm text-slate-600">
              No fact snapshot is available for this draft yet. Generate posts again after
              selecting facts.
            </p>
          ) : (
            <ul className="space-y-4">
              {facts.map((f, i) => {
                const title = (f.sourceTitle ?? f.sourceName ?? '').trim() || 'Source';
                const domain = hostnameFromUrl(f.sourceUrl);
                const publisher =
                  (f.publisher?.trim() ||
                    f.sourceName?.trim() ||
                    (domain ? domain : '—')) ?? '—';

                return (
                  <li
                    key={`${f.sourceUrl}-${i}`}
                    className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-slate-900">{f.text.trim()}</p>
                    <dl className="mt-2 space-y-1 text-xs text-slate-600">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <dt className="shrink-0 font-medium text-slate-500">Source title</dt>
                        <dd className="min-w-0">{title}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <dt className="shrink-0 font-medium text-slate-500">Publisher / site</dt>
                        <dd className="min-w-0 break-words">{publisher}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                        <dt className="shrink-0 font-medium text-slate-500">Link</dt>
                        <dd className="min-w-0 break-all">
                          <a
                            href={f.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-700 underline decoration-indigo-200 underline-offset-2 hover:text-indigo-900"
                          >
                            {f.sourceUrl}
                          </a>
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
