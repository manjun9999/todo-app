import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import type {
  LogEntry,
  Totals,
  LogResponse,
  CatalogFood,
  NewCustomFood,
  DaySummary,
} from './types';

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

    CREATE TABLE IF NOT EXISTS custom_foods (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      emoji      TEXT NOT NULL DEFAULT '🍽️',
      serving    TEXT NOT NULL DEFAULT '',
      calories   REAL NOT NULL,
      protein    REAL NOT NULL,
      carbs      REAL NOT NULL,
      fat        REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Lightweight migrations: add columns that older databases won't have.
  // calories/protein/carbs/fat store the PER-SERVING (base) values; the eaten
  // amount is base * quantity, computed on read. Existing rows default to 1.
  ensureColumn(db, 'log_entries', 'quantity', 'quantity REAL NOT NULL DEFAULT 1');

  // log_date (local YYYY-MM-DD) is the authoritative day-grouping key. Backfill
  // older rows from the timestamp's date portion.
  ensureColumn(db, 'log_entries', 'log_date', "log_date TEXT NOT NULL DEFAULT ''");
  db.exec(
    `UPDATE log_entries SET log_date = substr(logged_at, 1, 10)
     WHERE log_date = '' OR log_date IS NULL`
  );

  return db;
}

/** Add a column if the table doesn't already have it (idempotent migration). */
function ensureColumn(
  db: Database.Database,
  table: string,
  column: string,
  ddl: string
): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

const db = global.__trackerDb ?? initDb();
if (process.env.NODE_ENV !== 'production') global.__trackerDb = db;

interface Row {
  id: number;
  food_name: string;
  serving: string;
  calories: number; // per serving (base)
  protein: number; // per serving (base)
  carbs: number; // per serving (base)
  fat: number; // per serving (base)
  quantity: number;
  logged_at: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// Scale the stored per-serving values by quantity to get the eaten amount.
function rowToEntry(row: Row): LogEntry {
  const q = row.quantity;
  return {
    id: row.id,
    foodName: row.food_name,
    serving: row.serving,
    quantity: q,
    calories: Math.round(row.calories * q),
    protein: round1(row.protein * q),
    carbs: round1(row.carbs * q),
    fat: round1(row.fat * q),
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

/** Fetch a single day's log entries (newest first) plus aggregate totals. */
export function getLog(date?: string): LogResponse {
  const day = date ?? todayKey();
  const rows = db
    .prepare(
      `SELECT * FROM log_entries
       WHERE log_date = ?
       ORDER BY id DESC`
    )
    .all(day) as Row[];
  const entries = rows.map(rowToEntry);
  return { entries, totals: computeTotals(entries), goal: getGoal() };
}

/** Convenience wrapper for today's log. */
export function getTodayLog(): LogResponse {
  return getLog();
}

/** Per-day rollups for the most recent `days` days that have entries. */
export function getHistory(days: number): DaySummary[] {
  const rows = db
    .prepare(
      `SELECT log_date                AS date,
              SUM(calories * quantity) AS calories,
              SUM(protein  * quantity) AS protein,
              SUM(carbs    * quantity) AS carbs,
              SUM(fat      * quantity) AS fat,
              COUNT(*)                 AS count
       FROM log_entries
       GROUP BY log_date
       ORDER BY log_date DESC
       LIMIT ?`
    )
    .all(days) as Array<
    DaySummary & {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }
  >;
  return rows.map((r) => ({
    date: r.date,
    calories: Math.round(r.calories),
    protein: round1(r.protein),
    carbs: round1(r.carbs),
    fat: round1(r.fat),
    count: r.count,
  }));
}

export const MIN_QTY = 0.25;
export const MAX_QTY = 100;

/** Clamp a quantity to a sane range, rounded to 2 decimals. */
export function clampQty(q: number): number {
  const clamped = Math.min(MAX_QTY, Math.max(MIN_QTY, q));
  return Math.round(clamped * 100) / 100;
}

export interface NewEntry {
  foodName: string;
  serving: string;
  calories: number; // per serving (base)
  protein: number; // per serving (base)
  carbs: number; // per serving (base)
  fat: number; // per serving (base)
  quantity: number;
  date?: string; // YYYY-MM-DD to log to; defaults to today
}

/** Insert a new log entry (storing per-serving values + quantity). */
export function addEntry(entry: NewEntry): LogEntry {
  const logDate = entry.date ?? todayKey();
  // Keep the current time-of-day but stamp it onto the chosen day, so a
  // backfilled entry shows a sensible time and its date matches log_date.
  const loggedAt = logDate + new Date().toISOString().slice(10);
  const quantity = clampQty(entry.quantity);
  const result = db
    .prepare(
      `INSERT INTO log_entries (food_name, serving, calories, protein, carbs, fat, quantity, log_date, logged_at)
       VALUES (@foodName, @serving, @calories, @protein, @carbs, @fat, @quantity, @logDate, @loggedAt)`
    )
    .run({ ...entry, quantity, logDate, loggedAt });
  const row = db
    .prepare(`SELECT * FROM log_entries WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as Row;
  return rowToEntry(row);
}

/** Update an entry's quantity. Returns the updated (scaled) entry, or null. */
export function updateQuantity(id: number, quantity: number): LogEntry | null {
  const result = db
    .prepare(`UPDATE log_entries SET quantity = ? WHERE id = ?`)
    .run(clampQty(quantity), id);
  if (result.changes === 0) return null;
  const row = db.prepare(`SELECT * FROM log_entries WHERE id = ?`).get(id) as Row;
  return rowToEntry(row);
}

/** Delete an entry by id. Returns true if a row was removed. */
export function deleteEntry(id: number): boolean {
  const result = db.prepare(`DELETE FROM log_entries WHERE id = ?`).run(id);
  return result.changes > 0;
}

// ---------------------------------------------------------------------------
// Custom foods
// ---------------------------------------------------------------------------

interface CustomFoodRow {
  id: number;
  name: string;
  emoji: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

function customRowToFood(row: CustomFoodRow): CatalogFood {
  return {
    id: `custom-${row.id}`,
    dbId: row.id,
    custom: true,
    name: row.name,
    emoji: row.emoji,
    category: 'Custom',
    serving: row.serving,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
  };
}

/** All user-defined foods, newest first. */
export function getCustomFoods(): CatalogFood[] {
  const rows = db
    .prepare(`SELECT * FROM custom_foods ORDER BY id DESC`)
    .all() as CustomFoodRow[];
  return rows.map(customRowToFood);
}

/** Create a custom food and return it in catalog shape. */
export function addCustomFood(input: NewCustomFood): CatalogFood {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO custom_foods (name, emoji, serving, calories, protein, carbs, fat, created_at)
       VALUES (@name, @emoji, @serving, @calories, @protein, @carbs, @fat, @createdAt)`
    )
    .run({ ...input, createdAt });
  const row = db
    .prepare(`SELECT * FROM custom_foods WHERE id = ?`)
    .get(Number(result.lastInsertRowid)) as CustomFoodRow;
  return customRowToFood(row);
}

/** Delete a custom food. Past log entries that referenced it are unaffected. */
export function deleteCustomFood(id: number): boolean {
  const result = db.prepare(`DELETE FROM custom_foods WHERE id = ?`).run(id);
  return result.changes > 0;
}
