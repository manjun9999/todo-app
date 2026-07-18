'use client';

import { useEffect, useMemo, useState } from 'react';
import { FOODS } from '@/lib/foods';
import type { Food, LogResponse } from '@/lib/types';
import SummaryHeader from '@/components/SummaryHeader';
import SearchBar from '@/components/SearchBar';
import FoodCard from '@/components/FoodCard';
import DailyLog from '@/components/DailyLog';

const EMPTY: LogResponse = {
  entries: [],
  totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  goal: 2000,
};

export default function Home() {
  const [log, setLog] = useState<LogResponse>(EMPTY);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load today's log on mount.
  useEffect(() => {
    fetch('/api/log')
      .then((r) => r.json())
      .then((data: LogResponse) => setLog(data))
      .catch(() => setLog(EMPTY))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FOODS;
    return FOODS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [query]);

  async function addFood(food: Food, quantity: number) {
    setBusyId(food.id);
    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: food.name,
          serving: food.serving,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          quantity,
        }),
      });
      if (!res.ok) throw new Error('add failed');
      // Re-fetch to get authoritative totals from the server.
      const data: LogResponse = await fetch('/api/log').then((r) => r.json());
      setLog(data);
    } catch {
      // Keep the UI responsive; a real app would surface a toast here.
    } finally {
      setBusyId(null);
    }
  }

  async function updateGoal(goal: number) {
    // Optimistically show the new goal, then persist and reconcile.
    const prev = log;
    setLog((cur) => ({ ...cur, goal }));
    try {
      const res = await fetch('/api/goal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      if (!res.ok) throw new Error('goal update failed');
      const { goal: saved }: { goal: number } = await res.json();
      setLog((cur) => ({ ...cur, goal: saved })); // server clamps to valid range
    } catch {
      setLog(prev); // roll back on failure
    }
  }

  async function changeQuantity(id: number, quantity: number) {
    // Optimistically bump the entry's quantity + scaled macros, then reconcile.
    const prev = log;
    const target = prev.entries.find((e) => e.id === id);
    if (target) {
      const factor = quantity / target.quantity;
      const r1 = (n: number) => Math.round(n * 10) / 10;
      setLog((cur) => ({
        ...cur,
        entries: cur.entries.map((e) =>
          e.id === id
            ? {
                ...e,
                quantity,
                calories: Math.round(e.calories * factor),
                protein: r1(e.protein * factor),
                carbs: r1(e.carbs * factor),
                fat: r1(e.fat * factor),
              }
            : e
        ),
      }));
    }
    try {
      const res = await fetch(`/api/log/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error('quantity update failed');
      // Re-fetch for authoritative totals (server rounds from base values).
      const data: LogResponse = await fetch('/api/log').then((r) => r.json());
      setLog(data);
    } catch {
      setLog(prev); // roll back on failure
    }
  }

  async function removeEntry(id: number) {
    // Optimistic removal, then reconcile with the server.
    const prev = log;
    setLog((cur) => ({
      ...cur,
      entries: cur.entries.filter((e) => e.id !== id),
    }));
    try {
      const res = await fetch(`/api/log/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      const data: LogResponse = await fetch('/api/log').then((r) => r.json());
      setLog(data);
    } catch {
      setLog(prev); // roll back on failure
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold tracking-tight">
        🥗 CloudCaloryTracker
      </h1>

      <SummaryHeader totals={log.totals} goal={log.goal} onGoalChange={updateGoal} />

      <section className="mt-8">
        <SearchBar value={query} onChange={setQuery} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onAdd={addFood}
              disabled={busyId === food.id}
            />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-6 text-center text-slate-500 dark:text-slate-400">
              No foods match “{query}”.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">
          Today&rsquo;s Log{' '}
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
            ({log.entries.length})
          </span>
        </h2>
        {loading ? (
          <p className="py-6 text-center text-slate-500 dark:text-slate-400">Loading…</p>
        ) : (
          <DailyLog
            entries={log.entries}
            onRemove={removeEntry}
            onQuantityChange={changeQuantity}
          />
        )}
      </section>

      <footer className="mt-10 text-center text-xs text-slate-400">
        Data stored locally in SQLite · resets by day
      </footer>
    </main>
  );
}
