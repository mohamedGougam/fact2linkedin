'use client';

import { POST_STYLES, POST_STYLE_LABELS, type PostStyle } from '@/lib/postStyle';

type PostStyleSelectProps = {
  value: PostStyle[];
  onChange: (next: PostStyle[]) => void;
  disabled?: boolean;
};

/** Multi-select for which draft archetypes to generate (one post per selected style). */
export function PostStyleSelect({ value, onChange, disabled = false }: PostStyleSelectProps) {
  function toggle(style: PostStyle) {
    const set = new Set(value);
    if (set.has(style)) {
      if (set.size <= 1) return;
      set.delete(style);
    } else {
      set.add(style);
    }
    onChange(POST_STYLES.filter((s) => set.has(s)));
  }

  return (
    <fieldset className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-3">
      <legend className="text-sm font-medium text-slate-800">Post styles</legend>
      <p className="mb-2 text-xs text-slate-600">
        Choose one or more. Each style produces one draft (tone and length apply to all).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {POST_STYLES.map((style) => {
          const checked = value.includes(style);
          return (
            <label
              key={style}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
                checked
                  ? 'border-slate-800 bg-white text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(style)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
                suppressHydrationWarning
              />
              <span>{POST_STYLE_LABELS[style]}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
