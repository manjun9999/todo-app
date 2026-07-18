import { NextResponse } from 'next/server';
import { deleteCustomFood } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const removed = deleteCustomFood(id);
  if (!removed) {
    return NextResponse.json({ error: 'Custom food not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
