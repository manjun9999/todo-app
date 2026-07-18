'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FOODS } from '@/lib/foods';
import type {
  CatalogFood,
  DaySummary,
  LogResponse,
  NewCustomFood,
} from '@/lib/types';
import { formatDayLabel, todayStr } from '@/lib/dates';
import SummaryHeader from '@/components/SummaryHeader';
import DateNav from '@/components/DateNav';
import SearchBar from '@/components/SearchBar';
import FoodCard from '@/components/FoodCard';
import AddFoodForm from '@/components/AddFoodForm';
import DailyLog from '@/components/DailyLog';
import HistoryPanel from '@/components/HistoryPanel';

const EMPTY: LogResponse = {
  entries: [],
  totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  goal: 2000,
};

export default function Home() {
  const [log, setLog] = useState<LogResponse>(EMPTY);
  const [customFoods, setCustomFoods] = useState<CatalogFood[]>([]);
  const [history, setHistory] = useState<DaySummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => todayStr());
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLog = useCallback(async (date: string) => {
    const data: LogResponse = await fetch(`/api/log?date=${date}`).then((r) =>
      r.json()
    );
    setLog(data);
  }, []);

  const loadHistory = useCallback(async () => {
    const data: DaySummary[] = await fetch('/api/history?days=14').then((r) =>
      r.json()
    );
    setHistory(Array.isArray(data) ? data : []);
  }, []);

  // Custom foods never change with the date — load them once on mount.
  useEffect(() => {
    fetch('/api/foods')
      .then((r) => r.json())
      .then((foods: CatalogFood[]) =>
        setCustomFoods(Array.isArray(foods) ? foods : [])
      )
      .catch(() => setCustomFoods([]));
  }, []);

  // Load the selected day's log + history whenever the date changes.
  useEffect(() => {
    setLoading(true);
    Promise.all([loadLog(selectedDate), loadHistory()])
      .catch(() => setLog(EMPTY))
      .finally(() => setLoading(false));
  }, [selectedDate, loadLog, loadHistory]);

  // Custom foods come first so they're easy to find.
  const allFoods = useMemo<CatalogFood[]>(
    () => [...customFoods, ...FOODS],
    [customFoods]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allFoods;
    return allFoods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [query, allFoods]);

  async function createCustomFood(input: NewCustomFood): Promise<boolean> {
    try {
      const res = await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('create failed');
      const food: CatalogFood = await res.json();
      setCustomFoods((prev) => [food, ...prev]);
      return true;
    } catch {
      return false;
    }
  }

  async function deleteCustomFood(food: CatalogFood) {
    if (food.dbId === undefined) return;
    const prev = customFoods;
    setCustomFoods((cur) => cur.filter((f) => f.dbId !== food.dbId));
    try {
      const res = await fetch(`/api/foods/${food.dbId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
    } catch {
      setCustomFoods(prev); // roll back on failure
    }
  }

  async function addFood(food: CatalogFood, quantity: number) {
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
          date: selectedDate, // log to whichever day is being viewed
        }),
      });
      if (!res.ok) throw new Error('add failed');
      await Promise.all([loadLog(selectedDate), loadHistory()]);
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
      await Promise.all([loadLog(selectedDate), loadHistory()]);
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
      await Promise.all([loadLog(selectedDate), loadHistory()]);
    } catch {
      setLog(prev); // roll back on failure
    }
  }

  const dateLabel = formatDayLabel(selectedDate);
  // "Today" / "Yesterday" read naturally with a possessive; dates don't.
  const logHeading =
    dateLabel === 'Today' || dateLabel === 'Yesterday'
      ? `${dateLabel}'s Log`
      : `Log for ${dateLabel}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-center text-2xl font-bold tracking-tight">
        🥗 Calorie Tracker
      </h1>

      <DateNav date={selectedDate} onChange={setSelectedDate} />
      <SummaryHeader
        totals={log.totals}
        goal={log.goal}
        onGoalChange={updateGoal}
        dateLabel={dateLabel}
      />

      <section className="mt-8">
        <SearchBar value={query} onChange={setQuery} />
        <div className="mt-4">
          <AddFoodForm onCreate={createCustomFood} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onAdd={addFood}
              onDelete={food.custom ? deleteCustomFood : undefined}
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
          {logHeading}{' '}
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

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Last 14 days</h2>
        <HistoryPanel
          days={history}
          goal={log.goal}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
      </section>

      <footer className="mt-10 text-center text-xs text-slate-400">
        Data stored locally in SQLite · grouped by day
      </footer>
    </main>
  );
}
