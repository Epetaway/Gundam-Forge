import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeckCardInput {
  card_id: string;
  qty: number;
  is_boss?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  metrics: {
    total_cards: number;
    main_deck_cards: number;
    resource_deck_cards: number;
    unique_colors: string[];
    boss_count: number;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { deck_id, cards } = await req.json() as {
      deck_id?: string;
      cards: DeckCardInput[];
    };

    if (!cards || !Array.isArray(cards)) {
      return new Response(
        JSON.stringify({ valid: false, errors: ['cards array is required'] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch card definitions for validation
    const cardIds = cards.map((c) => c.card_id);
    const { data: cardDefs, error: cardError } = await supabase
      .from('cards')
      .select('id, name, color, type')
      .in('id', cardIds);

    if (cardError) {
      return new Response(
        JSON.stringify({ valid: false, errors: [`Failed to fetch cards: ${cardError.message}`] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cardMap = new Map((cardDefs ?? []).map((c: { id: string; name: string; color: string; type: string }) => [c.id, c]));
    const errors: string[] = [];

    // Validate all card IDs exist
    for (const c of cards) {
      if (!cardMap.has(c.card_id)) {
        errors.push(`Card ${c.card_id} not found in database`);
      }
    }

    // Calculate metrics
    let mainDeckCards = 0;
    let resourceDeckCards = 0;
    const colorSet = new Set<string>();
    let bossCount = 0;

    for (const c of cards) {
      const def = cardMap.get(c.card_id);
      if (!def) continue;

      if (def.type === 'Resource' || def.type === 'Base') {
        resourceDeckCards += c.qty;
      } else {
        mainDeckCards += c.qty;
      }

      if (def.color && def.color !== 'Colorless') {
        colorSet.add(def.color);
      }

      if (c.qty > 4) {
        errors.push(`${def.name} exceeds max 4 copies (has ${c.qty})`);
      }

      if (c.is_boss) bossCount++;
    }

    const totalCards = mainDeckCards + resourceDeckCards;

    // Rule 6-1-1: Main deck must be exactly 50
    if (mainDeckCards !== 50) {
      errors.push(`Main deck must be exactly 50 cards (has ${mainDeckCards})`);
    }

    // Rule 6-1-1: Resource deck must be exactly 10
    if (resourceDeckCards !== 10) {
      errors.push(`Resource deck must be exactly 10 cards (has ${resourceDeckCards})`);
    }

    // Rule 6-1-1-2: Max 2 colors excluding Colorless
    if (colorSet.size > 2) {
      errors.push(`Deck can have at most 2 colors (has ${[...colorSet].join(', ')})`);
    }

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      metrics: {
        total_cards: totalCards,
        main_deck_cards: mainDeckCards,
        resource_deck_cards: resourceDeckCards,
        unique_colors: [...colorSet],
        boss_count: bossCount,
      },
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, errors: [(err as Error).message] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
