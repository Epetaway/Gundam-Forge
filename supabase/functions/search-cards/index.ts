import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') ?? '';
    const color = url.searchParams.get('color');
    const cardType = url.searchParams.get('type');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    if (!query && !color && !cardType) {
      return new Response(
        JSON.stringify({ error: 'At least one search parameter (q, color, type) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let dbQuery = supabase
      .from('cards')
      .select('id, name, color, cost, type, set, text, ap, hp, level, traits, rarity, image_url')
      .range(offset, offset + limit - 1);

    // Full-text search if query provided
    if (query) {
      dbQuery = dbQuery.textSearch('search_vector', query, { type: 'websearch' });
    }


    if (color) {
      dbQuery = dbQuery.eq('color', color);
    }

    if (cardType) {
      dbQuery = dbQuery.eq('type', cardType);
    }

    // Exclude EX, EX Base, and Resource cards from main deck search unless explicitly requested
    const excludeEX = url.searchParams.get('includeEX') !== 'true';
    if (excludeEX) {
      dbQuery = dbQuery.not('type', 'in', ['EX', 'EX Base', 'Resource']);
    }

    const { data, error, count } = await dbQuery;

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        cards: data ?? [],
        total: count ?? (data ?? []).length,
        limit,
        offset,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
