'use client';

import { stripHtmlTags } from '@/lib/stripHtml';

export function ContentBriefPanel({
  brief,
  loading,
  error
}: {
  brief: string | null;
  loading: boolean;
  error: string | null;
}) {
  if (!brief && !loading && !error) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Content brief</p>
        {loading ? (
          <span className="text-xs font-medium text-slate-600">Working…</span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-sm text-amber-800" role="status">
          {error}
        </p>
      ) : null}
      {brief ? (
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-800">
          {stripHtmlTags(brief)}
        </pre>
      ) : null}
    </div>
  );
}

