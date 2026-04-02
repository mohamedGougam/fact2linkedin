'use client';

import { useCallback, useState } from 'react';
import { POST_STYLE_LABELS, type PostStyle } from '@/lib/postStyle';
import { stripHtmlTags } from '@/lib/stripHtml';

type CompareDraftsPanelProps = {
  posts: string[];
  postStyles: PostStyle[];
  /** Indices into `posts` / `postStyles` to show (2+). */
  indices: number[];
  onClear: () => void;
};

/** Side-by-side (stacked on small screens) read-only comparison; copy per column. */
export function CompareDraftsPanel({
  posts,
  postStyles,
  indices,
  onClear
}: CompareDraftsPanelProps) {
  const sorted = [...new Set(indices)]
    .filter((i) => i >= 0 && i < posts.length)
    .sort((a, b) => a - b);

  if (sorted.length < 2) return null;

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Compare KAWN Post Drafts</p>
          <p className="text-xs text-slate-600">
            {sorted.length} KAWN Posts selected. Edit each draft in the cards above — this view updates
            automatically.
          </p>
        </div>
        <button
          type="button"
          suppressHydrationWarning
          onClick={onClear}
          className="self-start rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 sm:self-auto"
        >
          Clear selection
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((i) => (
          <CompareColumn
            key={i}
            slotLabel={i + 1}
            styleLabel={
              postStyles[i] ? POST_STYLE_LABELS[postStyles[i]] : `Style ${i + 1}`
            }
            text={posts[i] ?? ''}
          />
        ))}
      </div>
    </div>
  );
}

function CompareColumn({
  slotLabel,
  styleLabel,
  text
}: {
  slotLabel: number;
  styleLabel: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(stripHtmlTags(text));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <div className="flex min-h-0 flex-col rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Post {slotLabel}
          </p>
          <p className="truncate text-sm font-medium text-slate-900" title={styleLabel}>
            {styleLabel}
          </p>
        </div>
        <button
          type="button"
          suppressHydrationWarning
          onClick={copy}
          className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100"
        >
          {copied ? <span className="text-emerald-700">Copied</span> : 'Copy'}
        </button>
      </div>
      <pre className="max-h-[min(28rem,50vh)] flex-1 overflow-auto whitespace-pre-wrap font-sans text-sm text-slate-800">
        {stripHtmlTags(text)}
      </pre>
    </div>
  );
}
