import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cards } from '@/lib/data/cards';
import { parseDeckList } from '@/app/forge/parseDeckList';
import { matchDeckEntries } from '@/app/forge/cardMatching';

const ImportBodySchema = z.object({
  text: z.string().min(1, 'Deck list cannot be empty').max(10_000, 'Deck list too long'),
});

export const dynamic =
  process.env.NEXT_OUTPUT_MODE === 'export' ? 'force-static' : 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ImportBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const entries = parseDeckList(parsed.data.text);
  const results = matchDeckEntries(entries, cards);

  return NextResponse.json(results);
}
