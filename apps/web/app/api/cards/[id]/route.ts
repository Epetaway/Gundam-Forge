import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCardById } from '@/lib/data/cards'; // You must implement this

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Missing card id' }, { status: 400 });
  const card = await getCardById(id);
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  return NextResponse.json(card);
}
