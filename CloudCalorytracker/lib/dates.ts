// Local-date helpers. Dates are handled as YYYY-MM-DD strings in local time so
// day-grouping matches what the user sees on their own calendar.

function toStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today as a local YYYY-MM-DD string. */
export function todayStr(): string {
  return toStr(new Date());
}

/** Add (or subtract) whole days to a YYYY-MM-DD string, staying in local time. */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return toStr(dt);
}

/** True if the date is after today (used to block navigating into the future). */
export function isFuture(dateStr: string): boolean {
  return dateStr > todayStr();
}

/** Human label: "Today", "Yesterday", or e.g. "Wed, Jul 16". */
export function formatDayLabel(dateStr: string): string {
  const today = todayStr();
  if (dateStr === today) return 'Today';
  if (dateStr === addDays(today, -1)) return 'Yesterday';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Basic YYYY-MM-DD shape check for untrusted input. */
export function isValidDateStr(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
