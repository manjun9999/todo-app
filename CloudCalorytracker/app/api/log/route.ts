import { NextResponse } from 'next/server';
import { getLog, addEntry } from '@/lib/db';
import { isValidDateStr } from '@/lib/dates';

// Always run fresh — the log changes as the user eats.
export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('date');
  const date = isValidDateStr(raw) ? raw : undefined; // fall back to today
  return NextResponse.json(getLog(date));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const foodName = typeof b.foodName === 'string' ? b.foodName.trim() : '';
  const serving = typeof b.serving === 'string' ? b.serving.trim() : '';

  if (!foodName) {
    return NextResponse.json({ error: 'foodName is required' }, { status: 400 });
  }

  const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : 0);
  const rawQty = num(b.quantity);
  const date = isValidDateStr(b.date) ? b.date : undefined; // else today
  const entry = addEntry({
    foodName,
    serving,
    calories: num(b.calories),
    protein: num(b.protein),
    carbs: num(b.carbs),
    fat: num(b.fat),
    quantity: rawQty > 0 ? rawQty : 1, // default to one serving
    date,
  });

  return NextResponse.json(entry, { status: 201 });
}
