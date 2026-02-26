import { NextResponse } from 'next/server';
import { getCard } from '@/lib/data/cards';

export const dynamic =
  process.env.NEXT_OUTPUT_MODE === 'export' ? 'force-static' : 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return NextResponse.json({ error: 'Missing card id' }, { status: 400 });
  }

  const card = getCard(decodeURIComponent(id));
  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  return NextResponse.json({ card });
}
