'use client';

import type { Tone } from '@/lib/tone';
import { TONES } from '@/lib/tone';

type ToneSelectProps = {
  value: Tone;
  onChange: (tone: Tone) => void;
  disabled?: boolean;
};

const LABELS: Record<Tone, string> = {
  professional: 'Professional',
  educational: 'Educational',
  bold: 'Bold',
  conversational: 'Conversational'
};

/** Dropdown to pick how template wording should sound. */
export function ToneSelect({ value, onChange, disabled = false }: ToneSelectProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      Tone
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Tone)}
        suppressHydrationWarning
        className="max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {TONES.map((t) => (
          <option key={t} value={t}>
            {LABELS[t]}
          </option>
        ))}
      </select>
    </label>
  );
}
