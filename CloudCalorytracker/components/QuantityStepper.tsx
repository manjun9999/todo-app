'use client';

/** Format a quantity: integers as-is, otherwise trimmed to ≤2 decimals. */
export function formatQty(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

export default function QuantityStepper({
  value,
  onChange,
  min = 0.5,
  step = 0.5,
  tone = 'light',
  ariaLabel = 'Quantity',
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  tone?: 'light' | 'dark';
  ariaLabel?: string;
}) {
  const canDecrease = value - step >= min - 1e-9;

  // "dark" tone sits on the emerald header; "light" on white cards.
  const btn =
    tone === 'dark'
      ? 'text-white hover:bg-white/20 disabled:opacity-40'
      : 'text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-slate-800';
  const box =
    tone === 'dark'
      ? 'border-white/40'
      : 'border-slate-300 dark:border-slate-700';

  function change(delta: number) {
    const next = Math.round((value + delta) * 100) / 100;
    if (next >= min - 1e-9) onChange(next);
  }

  return (
    <div
      className={`inline-flex items-center rounded-lg border ${box}`}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={() => change(-step)}
        disabled={!canDecrease}
        aria-label="Decrease quantity"
        className={`h-7 w-7 rounded-l-lg text-lg leading-none transition ${btn}`}
      >
        −
      </button>
      <span
        className="min-w-[2rem] px-1 text-center text-sm font-semibold tabular-nums"
        aria-live="polite"
      >
        {formatQty(value)}
      </span>
      <button
        type="button"
        onClick={() => change(step)}
        aria-label="Increase quantity"
        className={`h-7 w-7 rounded-r-lg text-lg leading-none transition ${btn}`}
      >
        +
      </button>
    </div>
  );
}
