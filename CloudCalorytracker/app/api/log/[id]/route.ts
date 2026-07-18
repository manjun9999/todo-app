import { NextResponse } from 'next/server';
import { deleteEntry, updateQuantity } from '@/lib/db';

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>).quantity;
  const quantity = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: 'quantity must be a positive number' },
      { status: 400 }
    );
  }

  const updated = updateQuantity(id, quantity);
  if (!updated) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const removed = deleteEntry(id);
  if (!removed) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
