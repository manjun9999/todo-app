import type { Totals } from '@/lib/types';

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-lg font-semibold ${color}`}>{value} g</span>
      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}

export default function SummaryHeader({ totals }: { totals: Totals }) {
  return (
    <header className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-100">
        Today
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-5xl font-bold tabular-nums">{totals.calories}</span>
        <span className="text-lg font-medium text-emerald-100">kcal</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 rounded-xl bg-white/15 p-4 backdrop-blur">
        <Macro label="Protein" value={totals.protein} color="text-white" />
        <Macro label="Carbs" value={totals.carbs} color="text-white" />
        <Macro label="Fat" value={totals.fat} color="text-white" />
      </div>
    </header>
  );
}
