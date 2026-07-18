import { NextResponse } from 'next/server';
import { getCustomFoods, addCustomFood } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(getCustomFoods());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const serving = typeof b.serving === 'string' ? b.serving.trim() : '';
  // Keep the emoji short; fall back to a generic plate.
  const emojiRaw = typeof b.emoji === 'string' ? b.emoji.trim() : '';
  const emoji = emojiRaw ? Array.from(emojiRaw).slice(0, 2).join('') : '🍽️';

  // Coerce macros to non-negative finite numbers.
  const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const food = addCustomFood({
    name,
    emoji,
    serving,
    calories: num(b.calories),
    protein: num(b.protein),
    carbs: num(b.carbs),
    fat: num(b.fat),
  });

  return NextResponse.json(food, { status: 201 });
}
