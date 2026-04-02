'use client';

import type { FreshnessCategory } from '@/lib/sourceFreshness';
import { FRESHNESS_DISPLAY } from '@/lib/sourceFreshness';

const STYLES: Record<FreshnessCategory, string> = {
  very_recent:
    'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
  recent: 'bg-sky-50 text-sky-900 ring-sky-200/80',
  older: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  unknown_date: 'bg-slate-50 text-slate-600 ring-slate-200/70'
};

export function FreshnessBadge({ category }: { category: FreshnessCategory }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${STYLES[category]}`}
      title={titleFor(category)}
    >
      {FRESHNESS_DISPLAY[category]}
    </span>
  );
}

function titleFor(c: FreshnessCategory): string {
  switch (c) {
    case 'very_recent':
      return 'Published within the last ~14 days (when date is known)';
    case 'recent':
      return 'Published within the last ~180 days (when date is known)';
    case 'older':
      return 'Published more than ~180 days ago (when date is known)';
    case 'unknown_date':
      return 'No usable published date from the source';
    default:
      return '';
  }
}
