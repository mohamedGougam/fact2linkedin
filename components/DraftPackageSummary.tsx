'use client';

import { POST_STYLE_LABELS, type PostStyle } from '@/lib/postStyle';
import type { PostLength } from '@/lib/post-length';
import type { Tone } from '@/lib/tone';

type DraftPackageSummaryProps = {
  topic: string;
  selectedFactsCount: number;
  tone: Tone;
  length: PostLength;
  postStyles: PostStyle[];
  postsCount: number;
};

/**
 * Single-glance snapshot of the active draft run — a “content package” header
 * without repeating full controls from above the fold.
 */
export function DraftPackageSummary({
  topic,
  selectedFactsCount,
  tone,
  length,
  postStyles,
  postsCount
}: DraftPackageSummaryProps) {
  const stylesLine = postStyles.map((s) => POST_STYLE_LABELS[s]).join(' · ');
  const topicDisplay = topic.trim() ? topic : '—';

  return (
    <div className="rounded-lg border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white px-4 py-3 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Draft package
        </p>
        <p className="text-xs tabular-nums text-slate-500">
          {postsCount === 0
            ? 'Not generated yet'
            : `${postsCount} draft${postsCount === 1 ? '' : 's'}`}
        </p>
      </div>
      <p
        className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-slate-900"
        title={topicDisplay}
      >
        {topicDisplay}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-600">
        <span className="tabular-nums">
          <span className="text-slate-400">Facts in use </span>
          {selectedFactsCount}
        </span>
        <span aria-hidden className="text-slate-300">
          |
        </span>
        <span>
          <span className="text-slate-400">Tone </span>
          {tone}
        </span>
        <span aria-hidden className="text-slate-300">
          |
        </span>
        <span>
          <span className="text-slate-400">Length </span>
          {length}
        </span>
      </div>
      <p
        className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600"
        title={stylesLine}
      >
        <span className="text-slate-400">Styles </span>
        {stylesLine}
      </p>
    </div>
  );
}
