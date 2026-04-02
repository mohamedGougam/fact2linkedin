import { getConfidenceBand } from '@/lib/confidenceLevel';

type ConfidenceBadgeProps = {
  score: number;
  /** Optional explanation (shown on hover) — e.g. rule-based factors. */
  detail?: string;
  className?: string;
};

/**
 * Small label for trust level + numeric score (rule-based, no ML).
 */
export function ConfidenceBadge({ score, detail, className = '' }: ConfidenceBadgeProps) {
  const band = getConfidenceBand(score);
  const rounded = Math.round(score);

  const style =
    band === 'high'
      ? 'border-emerald-200/90 bg-emerald-50 text-emerald-900'
      : band === 'medium'
        ? 'border-amber-200/90 bg-amber-50 text-amber-900'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  const label =
    band === 'high' ? 'High confidence' : band === 'medium' ? 'Medium' : 'Low confidence';

  const tip = detail?.trim() ? detail : `Confidence score: ${rounded}/100 (rule-based)`;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none ${style} ${className}`}
      title={tip}
    >
      <span className="sr-only">Confidence: </span>
      {label}
      <span className="mx-1 text-[10px] opacity-50" aria-hidden>
        ·
      </span>
      {rounded}%
    </span>
  );
}
