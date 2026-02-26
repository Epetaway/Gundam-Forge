import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCards } from '@/lib/data/cards';
import type { CardColor, CardType } from '@gundam-forge/shared';

// Minimal projection returned in list results — keeps payload small
export interface CardSummary {
  id: string;
  name: string;
  cost: number;
  type: string;
  color: string;
  set: string;
  imageUrl?: string;
}

export interface CardSearchResponse {
  cards: CardSummary[];
  cursor: number;
  hasMore: boolean;
  total: number;
}

const COLORS = ['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'] as const;
const TYPES = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'] as const;

const SearchParamsSchema = z.object({
  q: z.string().max(200).optional(),
  color: z.enum([...COLORS, 'All']).optional(),
  type: z.enum([...TYPES, 'All']).optional(),
  set: z.string().max(50).optional(),
  cursor: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

// force-static in export mode so the build doesn't break; in server mode this is dynamic
export const dynamic =
  process.env.NEXT_OUTPUT_MODE === 'export' ? 'force-static' : 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const url =
    process.env.NEXT_OUTPUT_MODE === 'export'
      ? new URL('http://localhost/')
      : new URL(request.url);

  const raw = {
    q: url.searchParams.get('q') ?? undefined,
    color: url.searchParams.get('color') ?? undefined,
    type: url.searchParams.get('type') ?? undefined,
    set: url.searchParams.get('set') ?? undefined,
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  };

  const parsed = SearchParamsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { q, color, type, set, cursor, limit } = parsed.data;

  // Require at least one filter so we never dump the whole database
  const hasFilter =
    (q && q.trim().length > 0) ||
    (color && color !== 'All') ||
    (type && type !== 'All') ||
    (set && set !== 'All');

  if (!hasFilter) {
    return NextResponse.json<CardSearchResponse>({
      cards: [],
      cursor: 0,
      hasMore: false,
      total: 0,
    });
  }

  const allMatched = getCards({
    query: q?.trim(),
    color: (color as CardColor | 'All') ?? undefined,
    type: (type as CardType | 'All') ?? undefined,
    set,
  });

  const total = allMatched.length;
  const page = allMatched.slice(cursor, cursor + limit);
  const nextCursor = cursor + page.length;

  const cards: CardSummary[] = page.map((card) => ({
    id: card.id,
    name: card.name,
    cost: card.cost,
    type: card.type,
    color: card.color,
    set: card.set,
    imageUrl: card.imageUrl,
  }));

  return NextResponse.json<CardSearchResponse>({
    cards,
    cursor: nextCursor,
    hasMore: nextCursor < total,
    total,
  });
}
