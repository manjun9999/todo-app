import { NextResponse } from 'next/server';
import { getTodayLog, addEntry } from '@/lib/db';

// Always run fresh — the log changes as the user eats.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(getTodayLog());
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
  const entry = addEntry({
    foodName,
    serving,
    calories: num(b.calories),
    protein: num(b.protein),
    carbs: num(b.carbs),
    fat: num(b.fat),
  });

  return NextResponse.json(entry, { status: 201 });
}
