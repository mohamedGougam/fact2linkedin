import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { getFactDisplayOrder } from '@/lib/factDisplayOrder';
import { HIGH_CONFIDENCE_THRESHOLD } from '@/lib/factSelection';
import { describeConfidenceFactors } from '@/lib/services/research/factConfidence';
import type { Fact, FactVerificationStatus, SourceCategory, SourceType } from '@/lib/types/fact';

type FactsListProps = {
  facts: Fact[];
  /** One boolean per fact: is this row checked? */
  selected: boolean[];
  /** One boolean per fact: pinned rows render at the top (same index as facts). */
  pinned: boolean[];
  onToggle: (index: number) => void;
  onTogglePin: (index: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectHighConfidence: () => void;
  emptyHint: string;
};

const linkClass =
  'break-all text-slate-700 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-500';

/** Facts with checkboxes; claim + structured source metadata for live research. */
export function FactsList({
  facts,
  selected,
  pinned,
  onToggle,
  onTogglePin,
  onSelectAll,
  onDeselectAll,
  onSelectHighConfidence,
  emptyHint
}: FactsListProps) {
  if (facts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-sm text-slate-500">
        {emptyHint}
      </p>
    );
  }

  const displayOrder = getFactDisplayOrder(facts.length, pinned);

  return (
    <div className="rounded-lg border border-slate-200 bg-white text-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Bulk selection
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            suppressHydrationWarning
            onClick={onSelectAll}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            Select all
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={onDeselectAll}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            Deselect all
          </button>
          <button
            type="button"
            suppressHydrationWarning
            onClick={onSelectHighConfidence}
            title={`Select facts with confidence ≥ ${HIGH_CONFIDENCE_THRESHOLD}`}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            High confidence only (≥{HIGH_CONFIDENCE_THRESHOLD})
          </button>
        </div>
      </div>
      <ul className="space-y-3">
        {displayOrder.map((originalIndex, pos) => {
          const fact = facts[originalIndex];
          const isPinned = pinned[originalIndex] ?? false;
          const showPinnedDivider =
            pos > 0 &&
            (pinned[displayOrder[pos - 1]!] ?? false) &&
            !isPinned;

          return (
            <li
              key={fact.id ?? `fact-row-${originalIndex}`}
              className={[
                'border-b border-slate-100 px-4 py-4 last:border-0',
                showPinnedDivider ? 'border-t-2 border-t-slate-200 pt-5' : '',
                isPinned ? 'bg-amber-50/40' : ''
              ].join(' ')}
            >
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  checked={selected[originalIndex] ?? false}
                  onChange={() => onToggle(originalIndex)}
                  className="mt-1.5 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                  aria-label={`Include fact ${originalIndex + 1} in posts`}
                  suppressHydrationWarning
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <p className="leading-relaxed text-slate-900">{fact.text}</p>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:mt-0.5">
                      <ConfidenceBadge
                        score={fact.confidence}
                        detail={describeConfidenceFactors(fact)}
                      />
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => onTogglePin(originalIndex)}
                        aria-pressed={isPinned}
                        title={isPinned ? 'Unpin from top' : 'Pin to top of list'}
                        className={[
                          'rounded-md border px-2 py-1 text-xs font-medium',
                          isPinned
                            ? 'border-amber-300 bg-amber-100/80 text-amber-950 hover:bg-amber-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        ].join(' ')}
                      >
                        {isPinned ? 'Pinned' : 'Pin'}
                      </button>
                    </div>
                  </div>

                  <SourceMetaBlock fact={fact} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SourceMetaBlock({ fact }: { fact: Fact }) {
  const title = (fact.sourceTitle?.trim() || fact.sourceName).trim();
  const host = safeHostname(fact.sourceUrl);
  const publisherLine = fact.publisher?.trim() || host;

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-3 py-3">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-xs sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Source title
          </dt>
          <dd className="mt-1 text-sm font-medium leading-snug text-slate-900">{title}</dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Publisher / domain
          </dt>
          <dd className="mt-1 text-slate-800">
            <span className="text-slate-800">{publisherLine}</span>
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Primary URL
          </dt>
          <dd className="mt-1">
            <a
              href={fact.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {host}
            </a>
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Source type
          </dt>
          <dd className="mt-1 capitalize text-slate-800">{formatSourceType(fact.sourceType)}</dd>
        </div>

        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Source class
          </dt>
          <dd className="mt-1">
            <span className="inline-flex rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200/80">
              {sourceCategoryLabel(fact.sourceCategory ?? 'unknown')}
            </span>
          </dd>
        </div>

        {fact.publishedAt?.trim() ? (
          <div className="sm:col-span-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Published
            </dt>
            <dd className="mt-1 text-slate-800">{fact.publishedAt.trim()}</dd>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Verification
          </dt>
          <dd className="mt-1 text-slate-800">{verificationShort(fact.verificationStatus ?? 'unverified')}</dd>
        </div>
      </dl>

      {fact.additionalSourceRefs && fact.additionalSourceRefs.length > 0 ? (
        <div className="mt-3 border-t border-slate-200/80 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Also cited
          </p>
          <ul className="mt-2 space-y-2">
            {fact.additionalSourceRefs.map((ref) => {
              const refHost = safeHostname(ref.sourceUrl);
              const refTitle = (ref.sourceTitle?.trim() || ref.sourceName).trim();
              return (
                <li key={ref.sourceUrl} className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-baseline sm:gap-2">
                  <span className="min-w-0 shrink font-medium text-slate-800">{refTitle}</span>
                  <span className="hidden text-slate-300 sm:inline" aria-hidden>
                    ·
                  </span>
                  <a
                    href={ref.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`min-w-0 shrink sm:ml-auto ${linkClass}`}
                  >
                    {refHost}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatSourceType(t: SourceType): string {
  const labels: Record<SourceType, string> = {
    article: 'Article',
    report: 'Report',
    documentation: 'Documentation',
    dataset: 'Dataset',
    mock: 'Mock'
  };
  return labels[t] ?? t;
}

function sourceCategoryLabel(cat: SourceCategory): string {
  switch (cat) {
    case 'official':
      return 'Official';
    case 'research':
      return 'Research';
    case 'publication':
      return 'Publication';
    case 'blog':
      return 'Blog';
    case 'unknown':
      return 'Unknown';
    default:
      return 'Unknown';
  }
}

function verificationShort(status: FactVerificationStatus): string {
  switch (status) {
    case 'supported_snippet':
      return 'Grounded in search snippet (verbatim sentence)';
    case 'supported_snippet_full':
      return 'Grounded in full search snippet';
    case 'supported_title':
      return 'Grounded in result title only (weaker)';
    case 'mock':
      return 'Offline mock template (not from the web)';
    case 'unverified':
      return 'Not recorded';
    default:
      return 'Not recorded';
  }
}
