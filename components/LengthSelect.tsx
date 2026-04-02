'use client';

import type { PostLength } from '@/lib/post-length';
import { POST_LENGTHS } from '@/lib/post-length';

type LengthSelectProps = {
  value: PostLength;
  onChange: (length: PostLength) => void;
  disabled?: boolean;
};

const LABELS: Record<PostLength, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long'
};

/** Dropdown for how much template padding each draft gets. */
export function LengthSelect({ value, onChange, disabled = false }: LengthSelectProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      Length
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as PostLength)}
        suppressHydrationWarning
        className="max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {POST_LENGTHS.map((len) => (
          <option key={len} value={len}>
            {LABELS[len]}
          </option>
        ))}
      </select>
    </label>
  );
}
