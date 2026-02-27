
import { NextResponse } from 'next/server';
import type { CardColor, CardType } from '@gundam-forge/shared';
import { getCardList } from '@/lib/data/cards';

const CARD_COLORS: Array<CardColor | 'All'> = ['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
const CARD_TYPES: Array<CardType | 'All'> = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];
export const dynamic = 'force-static';
export const revalidate = false;

function parseQueryParams(searchParams: URLSearchParams) {
  const q = searchParams.get('q') ?? undefined;
  const color = searchParams.get('color');
  const type = searchParams.get('type');
  const set = searchParams.get('set');
  const limit = parseInt(searchParams.get('limit') || '30', 10);
  const cursor = searchParams.get('cursor') || undefined;
  const excludeTypes = searchParams.get('excludeTypes')?.split(',') || [];
  return { q, color, type, set, limit, cursor, excludeTypes };
}

export async function GET(request: Request): Promise<Response> {
  const searchParams =
    process.env.NEXT_OUTPUT_MODE === 'export'
      ? new URLSearchParams()
      : new URL(request.url).searchParams;
  const { q, limit, cursor, excludeTypes } = parseQueryParams(searchParams);
  let { results, nextCursor } = getCardList({ q, limit, cursor });
  // Exclude EX/EX Base/resource-only cards if requested
  if (excludeTypes && excludeTypes.length > 0) {
    results = results.filter(card => !excludeTypes.includes(card.type));
  }
  return NextResponse.json({ cards: results, nextCursor });
}
