import { NextResponse } from 'next/server';
import type { CardColor, CardType } from '@gundam-forge/shared';
import { getCards, type CatalogFilters } from '@/lib/data/cards';

const CARD_COLORS: Array<CardColor | 'All'> = ['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
const CARD_TYPES: Array<CardType | 'All'> = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];
export const dynamic = 'force-static';
export const revalidate = false;

function parseFilters(searchParams: URLSearchParams): CatalogFilters {
  const query = searchParams.get('q') ?? undefined;
  const color = searchParams.get('color');
  const type = searchParams.get('type');
  const set = searchParams.get('set');

  return {
    query,
    color: color && CARD_COLORS.includes(color as CardColor | 'All') ? (color as CardColor | 'All') : undefined,
    type: type && CARD_TYPES.includes(type as CardType | 'All') ? (type as CardType | 'All') : undefined,
    set: set ?? undefined,
  };
}

export async function GET(request: Request): Promise<Response> {
  const searchParams =
    process.env.NEXT_OUTPUT_MODE === 'export'
      ? new URLSearchParams()
      : new URL(request.url).searchParams;
  const filters = parseFilters(searchParams);
  const cards = getCards(filters);
  return NextResponse.json({ cards });
}
