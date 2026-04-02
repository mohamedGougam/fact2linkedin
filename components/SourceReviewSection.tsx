import { FreshnessBadge } from '@/components/FreshnessBadge';
import { uniqueSourcesFromFacts, type SourceReviewRow } from '@/lib/sourcesFromFacts';
import { classifyFreshness } from '@/lib/sourceFreshness';
import type { Fact, SourceType } from '@/lib/types/fact';

type SourceReviewSectionProps = {
  facts: Fact[];
  className?: string;
};

const linkClass =
  'break-all text-slate-600 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-900 hover:decoration-slate-500';

/** Collapsible list of unique fetched sources (deduped URLs), separate from fact claims. */
export function SourceReviewSection({ facts, className = '' }: SourceReviewSectionProps) {
  const rows = uniqueSourcesFromFacts(facts);
  if (rows.length === 0) {
    return null;
  }

  return (
    <details
      className={`rounded-lg border border-slate-200 bg-slate-50/80 text-sm text-slate-700 ${className}`}
    >
      <summary className="cursor-pointer list-none px-3 py-2.5 text-slate-600 outline-none marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Source review
        </span>
        <span className="ml-2 text-slate-500">
          ({rows.length} {rows.length === 1 ? 'source' : 'sources'})
        </span>
        <span className="ml-1 text-slate-400">— expand to see titles and links</span>
      </summary>
      <ul className="space-y-0 divide-y divide-slate-200/90 border-t border-slate-200/90 px-3 pb-3 pt-1">
        {rows.map((row) => (
          <SourceRow key={row.url} row={row} />
        ))}
      </ul>
    </details>
  );
}

function SourceRow({ row }: { row: SourceReviewRow }) {
  const freshness = classifyFreshness(row.publishedAt);

  return (
    <li className="grid gap-1 py-3 first:pt-2 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-x-4">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 font-medium leading-snug text-slate-900">{row.title}</p>
          <FreshnessBadge category={freshness} />
        </div>
        <p className="text-xs text-slate-500">
          <span className="text-slate-500">{formatSourceType(row.sourceType)}</span>
          <span className="mx-1.5 text-slate-300" aria-hidden>
            ·
          </span>
          <span>{row.publisherOrDomain}</span>
          {row.publishedAt ? (
            <>
              <span className="mx-1.5 text-slate-300" aria-hidden>
                ·
              </span>
              <time className="text-slate-500">{row.publishedAt}</time>
            </>
          ) : null}
        </p>
      </div>
      <div className="min-w-0 sm:text-right">
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs ${linkClass}`}
        >
          {row.url}
        </a>
      </div>
    </li>
  );
}

function formatSourceType(t: SourceType | null): string {
  if (!t) return '—';
  const labels: Record<SourceType, string> = {
    article: 'Article',
    report: 'Report',
    documentation: 'Documentation',
    dataset: 'Dataset',
    mock: 'Mock'
  };
  return labels[t] ?? t;
}
