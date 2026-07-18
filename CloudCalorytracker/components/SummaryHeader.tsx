'use client';

import { useEffect, useState } from 'react';
import type { Totals } from '@/lib/types';

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-semibold text-white">{value} g</span>
      <span className="text-xs uppercase tracking-wide text-emerald-100">
        {label}
      </span>
    </div>
  );
}

function GoalEditor({
  goal,
  onGoalChange,
}: {
  goal: number;
  onGoalChange: (goal: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));

  // Keep the draft in sync when the goal changes from outside.
  useEffect(() => {
    setDraft(String(goal));
  }, [goal]);

  function commit() {
    const next = Number(draft);
    if (Number.isFinite(next) && next > 0 && next !== goal) {
      onGoalChange(next);
    } else {
      setDraft(String(goal)); // reset invalid/unchanged input
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="number"
        autoFocus
        value={draft}
        min={500}
        max={10000}
        step={50}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(String(goal));
            setEditing(false);
          }
        }}
        aria-label="Daily calorie goal"
        className="w-24 rounded-lg bg-white/90 px-2 py-1 text-right text-sm font-semibold text-slate-900 outline-none ring-2 ring-white/60"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="rounded-lg px-2 py-1 text-sm font-medium text-emerald-50 transition hover:bg-white/15"
      aria-label="Edit daily calorie goal"
    >
      Goal: {goal.toLocaleString()} kcal ✎
    </button>
  );
}

export default function SummaryHeader({
  totals,
  goal,
  onGoalChange,
  dateLabel = 'Today',
}: {
  totals: Totals;
  goal: number;
  onGoalChange: (goal: number) => void;
  dateLabel?: string;
}) {
  const consumed = totals.calories;
  const remaining = goal - consumed;
  const over = remaining < 0;
  const pct = goal > 0 ? (consumed / goal) * 100 : 0;
  const barWidth = Math.min(100, Math.max(0, pct));

  return (
    <header className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-100">
            {dateLabel}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-bold tabular-nums">{consumed}</span>
            <span className="text-lg font-medium text-emerald-100">
              / {goal.toLocaleString()} kcal
            </span>
          </div>
        </div>
        <GoalEditor goal={goal} onGoalChange={onGoalChange} />
      </div>

      {/* Progress toward the daily goal */}
      <div className="mt-4">
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-white/25"
          role="progressbar"
          aria-valuenow={Math.round(consumed)}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-label="Calories consumed toward daily goal"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              over ? 'bg-amber-300' : 'bg-white'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <p className="mt-1.5 text-sm font-medium text-emerald-50">
          {over
            ? `${Math.abs(remaining).toLocaleString()} kcal over goal`
            : `${remaining.toLocaleString()} kcal left`}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 rounded-xl bg-white/15 p-4 backdrop-blur">
        <Macro label="Protein" value={totals.protein} />
        <Macro label="Carbs" value={totals.carbs} />
        <Macro label="Fat" value={totals.fat} />
      </div>
    </header>
  );
}
