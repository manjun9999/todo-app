import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/db';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get('days'));
  const days = Number.isFinite(raw) ? Math.min(90, Math.max(1, raw)) : 14;
  return NextResponse.json(getHistory(days));
}
