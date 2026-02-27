import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseDeckList } from '@/app/forge/parseDeckList';
import { matchDeckEntries } from '@/app/forge/cardMatching';

const importSchema = z.object({
  decklist: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 });
  }
  const { decklist } = parsed.data;
  const entries = parseDeckList(decklist);
  const result = await matchDeckEntries(entries, []); // TODO: pass cardDb
  return NextResponse.json(result);
}
