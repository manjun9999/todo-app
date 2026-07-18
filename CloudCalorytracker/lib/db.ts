import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import type { LogEntry, Totals, LogResponse } from './types';

// Store the SQLite file under ./data so it's easy to find and .gitignore.
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'tracker.db');

// Reuse a single connection across hot reloads in dev (Next re-imports modules).
declare global {
  // eslint-disable-next-line no-var
  var __trackerDb: Database.Database | undefined;
}

function initDb(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS log_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      food_name  TEXT    NOT NULL,
      serving    TEXT    NOT NULL,
      calories   REAL    NOT NULL,
      protein    REAL    NOT NULL,
      carbs      REAL    NOT NULL,
      fat        REAL    NOT NULL,
      logged_at  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

const db = global.__trackerDb ?? initDb();
if (process.env.NODE_ENV !== 'production') global.__trackerDb = db;

interface Row {
  id: number;
  food_name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

function rowToEntry(row: Row): LogEntry {
  return {
    id: row.id,
    foodName: row.food_name,
    serving: row.serving,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    loggedAt: row.logged_at,
  };
}

const GOAL_KEY = 'daily_calorie_goal';
const DEFAULT_GOAL = 2000;
export const MIN_GOAL = 500;
export const MAX_GOAL = 10000;

/** Read the daily calorie goal, falling back to the default if unset. */
export function getGoal(): number {
  const row = db
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(GOAL_KEY) as { value: string } | undefined;
  const parsed = row ? Number(row.value) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_GOAL;
}

/** Persist the daily calorie goal (clamped to a sane range) and return it. */
export function setGoal(goal: number): number {
  const clamped = Math.round(Math.min(MAX_GOAL, Math.max(MIN_GOAL, goal)));
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (@key, @value)
     ON CONFLICT(key) DO UPDATE SET value = @value`
  ).run({ key: GOAL_KEY, value: String(clamped) });
  return clamped;
}

/** Local YYYY-MM-DD for "today", used to scope the log to the current day. */
function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeTotals(entries: LogEntry[]): Totals {
  const round = (n: number) => Math.round(n * 10) / 10;
  return entries.reduce<Totals>(
    (acc, e) => ({
      calories: Math.round(acc.calories + e.calories),
      protein: round(acc.protein + e.protein),
      carbs: round(acc.carbs + e.carbs),
      fat: round(acc.fat + e.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** Fetch today's log entries (newest first) plus aggregate totals. */
export function getTodayLog(): LogResponse {
  const rows = db
    .prepare(
      `SELECT * FROM log_entries
       WHERE substr(logged_at, 1, 10) = ?
       ORDER BY id DESC`
    )
    .all(todayKey()) as Row[];
  const entries = rows.map(rowToEntry);
  return { entries, totals: computeTotals(entries), goal: getGoal() };
}

export interface NewEntry {
  foodName: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Insert a new log entry and return it. */
export function addEntry(entry: NewEntry): LogEntry {
  const loggedAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO log_entries (food_name, serving, calories, protein, carbs, fat, logged_at)
       VALUES (@foodName, @serving, @calories, @protein, @carbs, @fat, @loggedAt)`
    )
    .run({ ...entry, loggedAt });
  return { id: Number(result.lastInsertRowid), ...entry, loggedAt };
}

/** Delete an entry by id. Returns true if a row was removed. */
export function deleteEntry(id: number): boolean {
  const result = db.prepare(`DELETE FROM log_entries WHERE id = ?`).run(id);
  return result.changes > 0;
}
