import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCardList } from '@/lib/data/cards'; // You must implement this

const searchSchema = z.object({
  q: z.string().optional(),
  limit: z.string().transform(Number).default('30'),
  cursor: z.string().optional(),
  // Add filter fields as needed
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = searchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 });
  }
  const { q, limit, cursor } = parsed.data;
  // TODO: implement getCardList with search, filters, pagination
  const { results, nextCursor } = await getCardList({ q, limit, cursor });
  return NextResponse.json({ results, nextCursor });
}
