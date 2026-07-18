import { NextResponse } from 'next/server';
import { getGoal, setGoal } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ goal: getGoal() });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>).goal;
  const goal = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(goal) || goal <= 0) {
    return NextResponse.json(
      { error: 'goal must be a positive number' },
      { status: 400 }
    );
  }

  // setGoal clamps to a sane range and returns the stored value.
  return NextResponse.json({ goal: setGoal(goal) });
}
