-- ============================================================
-- Seed Official GCG Decks
-- Uses uuid_generate_v5 for deterministic, idempotent IDs
-- Re-runnable: ON CONFLICT DO UPDATE
-- ============================================================

-- Fixed namespace UUID for official decks
-- Generated from: uuid_generate_v5(uuid_ns_url(), 'gundam-forge-official-decks')
DO $$
DECLARE
  ns uuid := '6ba7b811-9dad-11d1-80b4-00c04fd430c8'; -- UUID_NS_URL
  base_url text := 'https://gundam-forge.app/official-decks/';
  v_deck_id uuid;
BEGIN

  -- ─── deck-001: Blue/White Midrange Deck ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-001');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'Blue/White Midrange Deck',
    'Start strong with low-cost units in the early game, then strengthen your attacks mid-game by linking with pilots, and finish in style with the Aile Strike Gundam!',
    true, ARRAY['Blue','White'], 'Blue/White Midrange', 'official', 'https://www.gundam-gcg.com/en/decks/deck-001.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST01-001', 1, true), (v_deck_id, 'ST01-002', 2, false), (v_deck_id, 'ST01-005', 2, false),
    (v_deck_id, 'ST04-001', 1, true), (v_deck_id, 'ST04-005', 2, false), (v_deck_id, 'GD01-004', 2, false),
    (v_deck_id, 'GD01-005', 2, false), (v_deck_id, 'GD01-009', 3, false), (v_deck_id, 'GD01-011', 2, false),
    (v_deck_id, 'GD01-013', 2, false), (v_deck_id, 'GD01-018', 3, false), (v_deck_id, 'GD01-068', 2, false),
    (v_deck_id, 'GD01-077', 2, false), (v_deck_id, 'ST01-010', 2, true), (v_deck_id, 'ST04-010', 2, false),
    (v_deck_id, 'GD01-088', 2, false), (v_deck_id, 'GD01-089', 2, false), (v_deck_id, 'ST01-012', 2, false),
    (v_deck_id, 'ST01-013', 2, false), (v_deck_id, 'ST04-013', 3, false), (v_deck_id, 'GD01-100', 1, true),
    (v_deck_id, 'GD01-118', 2, false), (v_deck_id, 'ST01-015', 2, false), (v_deck_id, 'ST04-015', 2, false),
    (v_deck_id, 'GD01-124', 2, false);

  -- ─── deck-002: Green/White Ramp Deck ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-002');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'Green/White Ramp Deck',
    'Build up resources to deploy powerful units, dominate the field with efficient moves in the mid-game, and crush your opponent in the late game with Wing Gundam and Gundam Aerial!',
    true, ARRAY['Green','White'], 'Green/White Ramp', 'official', 'https://www.gundam-gcg.com/en/decks/deck-002.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST02-001', 1, true), (v_deck_id, 'ST02-002', 3, true), (v_deck_id, 'ST02-005', 2, false),
    (v_deck_id, 'ST03-008', 2, false), (v_deck_id, 'GD01-028', 2, true), (v_deck_id, 'GD01-030', 3, false),
    (v_deck_id, 'GD01-034', 2, false), (v_deck_id, 'GD01-040', 2, false), (v_deck_id, 'GD01-041', 4, true),
    (v_deck_id, 'GD01-070', 1, true), (v_deck_id, 'GD01-075', 3, false), (v_deck_id, 'GD01-076', 3, false),
    (v_deck_id, 'ST01-011', 2, false), (v_deck_id, 'ST02-010', 2, true), (v_deck_id, 'GD01-091', 2, false),
    (v_deck_id, 'GD01-097', 2, false), (v_deck_id, 'ST02-012', 2, false), (v_deck_id, 'ST02-013', 2, false),
    (v_deck_id, 'GD01-107', 2, true), (v_deck_id, 'GD01-117', 1, false), (v_deck_id, 'GD01-118', 3, false),
    (v_deck_id, 'ST02-015', 2, false), (v_deck_id, 'ST04-015', 2, false);

  -- ─── deck-003: Blue-Green Breach Link Unit Deck ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-003');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'Blue-Green Breach Link Unit Deck',
    'Use low-cost Units to chip away at shields early, break through defenses with Link Unit and Breach effects mid-game, finish with powerful Link Units late game!',
    true, ARRAY['Blue','Green'], 'Blue/Green Breach', 'official', 'https://www.gundam-gcg.com/en/decks/deck-003.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST01-001', 1, true), (v_deck_id, 'ST01-002', 3, true), (v_deck_id, 'ST01-005', 2, true),
    (v_deck_id, 'ST01-010', 3, true), (v_deck_id, 'ST01-013', 2, false), (v_deck_id, 'ST01-015', 3, false),
    (v_deck_id, 'ST02-001', 1, false), (v_deck_id, 'ST02-005', 3, false), (v_deck_id, 'ST02-010', 2, false),
    (v_deck_id, 'ST03-007', 2, false), (v_deck_id, 'ST03-008', 2, false), (v_deck_id, 'ST03-011', 3, false),
    (v_deck_id, 'ST03-016', 3, false), (v_deck_id, 'GD01-004', 2, false), (v_deck_id, 'GD01-015', 2, false),
    (v_deck_id, 'GD01-016', 2, false), (v_deck_id, 'GD01-026', 2, false), (v_deck_id, 'GD01-030', 2, false),
    (v_deck_id, 'GD01-031', 3, false), (v_deck_id, 'GD01-040', 3, false), (v_deck_id, 'GD01-099', 1, false),
    (v_deck_id, 'GD01-100', 2, false), (v_deck_id, 'GD01-105', 1, false);

  -- ─── deck-004: ST01 Earth Federation / Academy ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-004');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'ST01 Earth Federation / Academy',
    'Amuro and Suletta collaborate for total control of the field! Uses Gundam overall strength and Gundam Aerial effects to give you the advantage.',
    true, ARRAY['Blue','White'], 'Earth Federation', 'official', 'https://www.gundam-gcg.com/en/decks/deck-004.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST01-001', 4, true), (v_deck_id, 'ST01-002', 4, false), (v_deck_id, 'ST01-003', 2, false),
    (v_deck_id, 'ST01-004', 4, false), (v_deck_id, 'ST01-005', 4, true), (v_deck_id, 'ST01-006', 4, true),
    (v_deck_id, 'ST01-007', 4, false), (v_deck_id, 'ST01-009', 4, true), (v_deck_id, 'ST01-010', 4, false),
    (v_deck_id, 'ST01-011', 4, false), (v_deck_id, 'ST01-012', 4, false), (v_deck_id, 'ST01-014', 4, false),
    (v_deck_id, 'ST01-015', 4, false);

  -- ─── deck-005: ST02 Operation Meteor / OZ ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-005');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'ST02 Operation Meteor / OZ',
    'Hammer away with Tallgeese! Survive early turns with smaller units, then unleash Tallgeese sustained offense.',
    true, ARRAY['Green'], 'Operation Meteor', 'official', 'https://www.gundam-gcg.com/en/decks/deck-005.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST02-001', 4, true), (v_deck_id, 'ST02-002', 4, true), (v_deck_id, 'ST02-003', 4, false),
    (v_deck_id, 'ST02-005', 4, false), (v_deck_id, 'ST02-006', 4, true), (v_deck_id, 'ST02-008', 4, false),
    (v_deck_id, 'ST02-009', 4, false), (v_deck_id, 'ST02-010', 4, true), (v_deck_id, 'ST02-011', 4, false),
    (v_deck_id, 'ST02-012', 4, false), (v_deck_id, 'ST02-014', 4, false), (v_deck_id, 'ST02-015', 3, false),
    (v_deck_id, 'ST02-016', 3, false);

  -- ─── deck-006: ST03 Zeon / Neo Zeon ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-006');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'ST03 Zeon / Neo Zeon',
    'Quickly assault their Shields, then evade with maneuverability! Takes advantage with Sinanju and Char Zaku II.',
    true, ARRAY['Red'], 'Neo Zeon', 'official', 'https://www.gundam-gcg.com/en/decks/deck-006.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST03-001', 4, true), (v_deck_id, 'ST03-002', 4, false), (v_deck_id, 'ST03-003', 4, false),
    (v_deck_id, 'ST03-004', 4, false), (v_deck_id, 'ST03-006', 4, true), (v_deck_id, 'ST03-007', 4, false),
    (v_deck_id, 'ST03-008', 4, true), (v_deck_id, 'ST03-009', 4, true), (v_deck_id, 'ST03-010', 4, false),
    (v_deck_id, 'ST03-011', 4, false), (v_deck_id, 'ST03-013', 4, false), (v_deck_id, 'ST03-014', 2, false),
    (v_deck_id, 'ST03-015', 4, false);

  -- ─── deck-007: ST04 Earth Alliance / ZAFT ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-007');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'ST04 Earth Alliance / ZAFT',
    'A SEED deck with ZAFT offense and Earth Alliance defense! Remove threats with Aegis Gundam while protecting Archangel.',
    true, ARRAY['Red','White'], 'SEED', 'official', 'https://www.gundam-gcg.com/en/decks/deck-007.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST04-001', 4, true), (v_deck_id, 'ST04-002', 4, true), (v_deck_id, 'ST04-003', 4, false),
    (v_deck_id, 'ST04-004', 2, false), (v_deck_id, 'ST04-005', 4, true), (v_deck_id, 'ST04-006', 4, true),
    (v_deck_id, 'ST04-007', 4, false), (v_deck_id, 'ST04-008', 4, false), (v_deck_id, 'ST04-010', 4, false),
    (v_deck_id, 'ST04-011', 4, false), (v_deck_id, 'ST04-012', 4, false), (v_deck_id, 'ST04-013', 4, false),
    (v_deck_id, 'ST04-015', 4, false);

  -- ─── deck-008: GD01 Freedom Gundam ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-008');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD01 Freedom Gundam',
    'A control deck that uses Blocker to defend while increasing advantage with When Paired effects until the end game.',
    true, ARRAY['Blue','White'], 'Blue/White Midrange', 'official', 'https://www.gundam-gcg.com/en/decks/deck-008.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD01-004', 4, false), (v_deck_id, 'GD01-065', 4, true), (v_deck_id, 'GD01-066', 3, false),
    (v_deck_id, 'GD01-067', 3, true), (v_deck_id, 'GD01-086', 4, false), (v_deck_id, 'GD01-100', 2, true),
    (v_deck_id, 'GD01-118', 4, false), (v_deck_id, 'ST01-009', 4, false), (v_deck_id, 'ST01-010', 4, false),
    (v_deck_id, 'ST01-011', 4, false), (v_deck_id, 'ST04-001', 4, true), (v_deck_id, 'ST04-010', 4, false),
    (v_deck_id, 'ST04-012', 2, false), (v_deck_id, 'ST04-015', 4, false);

  -- ─── deck-009: ST03 Enhanced Neo Zeon Mid-Range ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-009');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'ST03 Enhanced Neo Zeon Mid-Range',
    'Aggressive early-game pressure with eight Lv.2 one-cost Units, followed by Kshatriya and Sinanju to sustain momentum.',
    true, ARRAY['Red'], 'Neo Zeon', 'official', 'https://www.gundam-gcg.com/en/decks/deck-009.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD01-035', 4, false), (v_deck_id, 'GD01-044', 4, true), (v_deck_id, 'GD01-051', 4, false),
    (v_deck_id, 'GD01-052', 4, false), (v_deck_id, 'GD01-093', 4, true), (v_deck_id, 'GD01-111', 2, false),
    (v_deck_id, 'GD01-128', 4, false), (v_deck_id, 'ST03-001', 4, true), (v_deck_id, 'ST03-003', 4, false),
    (v_deck_id, 'ST03-006', 4, true), (v_deck_id, 'ST03-008', 4, false), (v_deck_id, 'ST03-010', 4, false),
    (v_deck_id, 'ST03-013', 4, false);

  -- ─── deck-010: ST05 Tekkadan Aggro ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-010');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'ST05 Tekkadan Aggro',
    'A Tekkadan deck that damages its own Units to grow stronger, with Isaribi and Gundam Barbatos 4th Form as the finisher.',
    true, ARRAY['Red'], 'Tekkadan Aggro', 'official', 'https://www.gundam-gcg.com/en/decks/deck-010.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST05-001', 4, true), (v_deck_id, 'ST05-002', 4, false), (v_deck_id, 'ST05-003', 4, false),
    (v_deck_id, 'ST05-004', 4, false), (v_deck_id, 'ST05-005', 4, false), (v_deck_id, 'ST05-006', 4, false),
    (v_deck_id, 'ST05-010', 4, true), (v_deck_id, 'ST05-011', 2, true), (v_deck_id, 'ST05-013', 3, false),
    (v_deck_id, 'ST05-014', 3, false), (v_deck_id, 'ST05-015', 4, true), (v_deck_id, 'GD01-060', 4, false),
    (v_deck_id, 'GD01-111', 4, false), (v_deck_id, 'ST04-008', 2, false);

  -- ─── deck-011: GD02 AEUG / Earth Alliance ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-011');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD02 AEUG / Earth Alliance',
    'An iron wall of blockers rebuffs all attacks! Deny enemy attacks early, use removal mid-game, then deploy finisher units.',
    true, ARRAY['Blue','White'], 'AEUG', 'official', 'https://www.gundam-gcg.com/en/decks/deck-011.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD02-129', 2, false), (v_deck_id, 'GD02-097', 4, true), (v_deck_id, 'GD02-069', 4, true),
    (v_deck_id, 'GD02-075', 2, false), (v_deck_id, 'GD02-079', 4, false), (v_deck_id, 'GD02-059', 3, false),
    (v_deck_id, 'GD01-118', 4, false), (v_deck_id, 'GD01-065', 3, true), (v_deck_id, 'GD01-086', 4, false),
    (v_deck_id, 'ST04-001', 4, true), (v_deck_id, 'ST04-010', 4, false), (v_deck_id, 'ST04-012', 3, false),
    (v_deck_id, 'ST04-015', 4, false), (v_deck_id, 'ST05-014', 2, false), (v_deck_id, 'ST01-014', 3, false);

  -- ─── deck-012: GD02 Tekkadan x Vagan ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-012');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD02 Tekkadan x Vagan',
    'Tekkadan is even stronger when teamed with Vagan! Deploy Vagan units early, block with Gundam Gusion Rebake, then finish with Barbatos.',
    true, ARRAY['Red','Green'], 'Tekkadan Aggro', 'official', 'https://www.gundam-gcg.com/en/decks/deck-012.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD02-054', 4, false), (v_deck_id, 'GD02-055', 4, false), (v_deck_id, 'GD02-057', 4, false),
    (v_deck_id, 'GD02-058', 4, false), (v_deck_id, 'GD02-066', 4, false), (v_deck_id, 'GD02-067', 4, false),
    (v_deck_id, 'GD02-096', 4, true), (v_deck_id, 'GD02-110', 2, false), (v_deck_id, 'GD02-112', 2, false),
    (v_deck_id, 'ST05-001', 4, true), (v_deck_id, 'ST05-002', 4, false), (v_deck_id, 'ST05-010', 4, true),
    (v_deck_id, 'ST05-014', 2, false), (v_deck_id, 'ST05-015', 4, false);

  -- ─── deck-013: GD02 Qubeley Control ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-013');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD02 Qubeley Control',
    'Deal damage, deal damage, then deal even more damage! Controls the battlefield with damage dealt to enemy Units.',
    true, ARRAY['Red','Purple'], 'Qubeley Control', 'official', 'https://www.gundam-gcg.com/en/decks/deck-013.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD01-044', 4, true), (v_deck_id, 'GD01-051', 4, false), (v_deck_id, 'GD01-093', 4, false),
    (v_deck_id, 'GD01-035', 4, false), (v_deck_id, 'GD02-036', 4, true), (v_deck_id, 'GD02-039', 4, false),
    (v_deck_id, 'GD02-091', 4, false), (v_deck_id, 'GD02-107', 4, true), (v_deck_id, 'ST03-001', 3, true),
    (v_deck_id, 'ST03-006', 4, false), (v_deck_id, 'ST03-008', 4, false), (v_deck_id, 'ST03-010', 3, false),
    (v_deck_id, 'ST03-015', 4, false);

  -- ─── deck-014: GD02 AGE x Wing ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-014');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD02 AGE x Wing',
    'Crush with Lv.8 Units after ramping up! Increases EX Resources for rapid deployment of Gundam Epyon and Wing Gundam Zero.',
    true, ARRAY['Green','White'], 'Green/White Ramp', 'official', 'https://www.gundam-gcg.com/en/decks/deck-014.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST02-002', 4, false), (v_deck_id, 'ST02-011', 4, true), (v_deck_id, 'GD02-002', 3, true),
    (v_deck_id, 'GD02-005', 3, false), (v_deck_id, 'ST02-006', 2, false), (v_deck_id, 'GD02-021', 4, false),
    (v_deck_id, 'GD02-023', 3, false), (v_deck_id, 'GD02-027', 4, false), (v_deck_id, 'GD02-031', 4, false),
    (v_deck_id, 'GD02-035', 4, false), (v_deck_id, 'GD02-088', 4, false), (v_deck_id, 'GD02-103', 3, false),
    (v_deck_id, 'GD02-124', 4, false), (v_deck_id, 'GD01-024', 2, true), (v_deck_id, 'GD01-100', 2, false);

  -- ─── deck-015: GD02 Titans x Cyber-Newtype ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-015');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD02 Titans x Cyber-Newtype',
    'Deal damage while recovering to gain the advantage! Targets the battlefield and shield area with Kshatriya and Guntank.',
    true, ARRAY['Red','Purple'], 'Titans', 'official', 'https://www.gundam-gcg.com/en/decks/deck-015.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD02-001', 4, true), (v_deck_id, 'GD01-044', 3, true), (v_deck_id, 'GD02-007', 3, false),
    (v_deck_id, 'GD01-051', 4, false), (v_deck_id, 'GD02-008', 2, false), (v_deck_id, 'GD02-015', 4, false),
    (v_deck_id, 'GD02-016', 4, false), (v_deck_id, 'GD02-013', 4, false), (v_deck_id, 'GD01-008', 4, true),
    (v_deck_id, 'GD02-086', 4, false), (v_deck_id, 'GD02-085', 4, true), (v_deck_id, 'GD01-093', 4, false),
    (v_deck_id, 'ST02-014', 2, false), (v_deck_id, 'GD01-124', 4, false);

  -- ─── deck-016: ST06xGD02 GQuuuuuuX ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-016');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'ST06xGD02 GQuuuuuuX',
    'The Clan attacks and wins with overwhelming power! Hold the battlefield advantage while attacking their shield area.',
    true, ARRAY['Red'], 'Red Aggro', 'official', 'https://www.gundam-gcg.com/en/decks/deck-016.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD02-038', 4, true), (v_deck_id, 'GD02-041', 2, false), (v_deck_id, 'GD02-109', 3, false),
    (v_deck_id, 'ST06-001', 4, true), (v_deck_id, 'ST06-002', 3, false), (v_deck_id, 'ST06-005', 4, true),
    (v_deck_id, 'ST06-006', 2, false), (v_deck_id, 'ST06-007', 4, false), (v_deck_id, 'ST06-008', 4, false),
    (v_deck_id, 'ST06-009', 4, false), (v_deck_id, 'ST06-010', 4, false), (v_deck_id, 'ST06-014', 4, false),
    (v_deck_id, 'GD01-035', 4, false), (v_deck_id, 'ST03-008', 4, false);

  -- ─── deck-017: ST07xGD03 Purple-Green Celestial Being Enhanced ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-017');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'ST07xGD03 Purple-Green Celestial Being Enhanced',
    'Midrange deck using Gundam Dynames and Gundam Exia to control mid game, then achieves victory with Gundam Exia (Trans-Am).',
    true, ARRAY['Purple','Green'], 'Celestial Being', 'official', 'https://www.gundam-gcg.com/en/decks/deck-017.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST07-001', 4, false), (v_deck_id, 'ST07-002', 4, false), (v_deck_id, 'ST07-004', 4, true),
    (v_deck_id, 'ST07-005', 4, true), (v_deck_id, 'ST07-007', 4, true), (v_deck_id, 'ST07-009', 4, false),
    (v_deck_id, 'ST07-011', 4, false), (v_deck_id, 'ST07-014', 3, false), (v_deck_id, 'ST07-015', 4, false),
    (v_deck_id, 'GD03-026', 4, false), (v_deck_id, 'GD03-049', 4, true), (v_deck_id, 'GD03-057', 3, false),
    (v_deck_id, 'GD03-063', 4, false);

  -- ─── deck-018: ST08xGD03 Red-Blue Hathaway Deck ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-018');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'ST08xGD03 Red-Blue Hathaway Deck',
    'Lays on the pressure using super-heavyweight hitters like Penelope and Xi Gundam.',
    true, ARRAY['Red','Blue'], 'Red/Blue Control', 'official', 'https://www.gundam-gcg.com/en/decks/deck-018.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST08-001', 3, true), (v_deck_id, 'ST08-002', 3, false), (v_deck_id, 'ST08-004', 4, true),
    (v_deck_id, 'ST08-005', 4, false), (v_deck_id, 'ST08-006', 3, true), (v_deck_id, 'ST08-008', 3, true),
    (v_deck_id, 'ST08-009', 3, false), (v_deck_id, 'ST08-010', 4, false), (v_deck_id, 'ST08-011', 3, false),
    (v_deck_id, 'ST08-012', 2, false), (v_deck_id, 'ST08-013', 3, false), (v_deck_id, 'ST08-014', 3, false),
    (v_deck_id, 'ST08-015', 1, false), (v_deck_id, 'GD03-006', 3, false), (v_deck_id, 'GD03-036', 3, false),
    (v_deck_id, 'GD03-043', 2, false), (v_deck_id, 'GD03-103', 3, false);

  -- ─── deck-019: GD03 Blue-Green Cyclops Team Deck ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-019');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD03 Blue-Green Cyclops Team Deck',
    'Cyclops Team overruns your enemy with Unit tokens! Bernie is there to hit that final grand slam!',
    true, ARRAY['Blue','Green'], 'Blue/Green Breach', 'official', 'https://www.gundam-gcg.com/en/decks/deck-019.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD03-017', 4, true), (v_deck_id, 'GD03-020', 4, false), (v_deck_id, 'GD03-024', 4, false),
    (v_deck_id, 'GD03-027', 4, false), (v_deck_id, 'GD03-089', 4, true), (v_deck_id, 'GD03-090', 4, false),
    (v_deck_id, 'GD03-107', 4, true), (v_deck_id, 'GD03-108', 4, false), (v_deck_id, 'GD01-030', 4, false),
    (v_deck_id, 'GD01-031', 4, false), (v_deck_id, 'GD01-035', 2, false), (v_deck_id, 'ST02-016', 4, false),
    (v_deck_id, 'ST03-008', 4, false);

  -- ─── deck-020: GD03 The-O Repair Deck ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-020');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD03 The-O Repair Deck',
    'Using The-O ability to rest enemy Units for complete field control. A unique control deck combining resting and Repair.',
    true, ARRAY['Purple','Blue'], 'Purple Control', 'official', 'https://www.gundam-gcg.com/en/decks/deck-020.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD03-001', 3, false), (v_deck_id, 'GD03-002', 4, true), (v_deck_id, 'GD03-003', 4, false),
    (v_deck_id, 'GD03-008', 4, false), (v_deck_id, 'GD03-009', 2, false), (v_deck_id, 'GD03-012', 4, false),
    (v_deck_id, 'GD03-013', 3, false), (v_deck_id, 'GD03-084', 4, true), (v_deck_id, 'GD03-087', 4, false),
    (v_deck_id, 'GD03-104', 2, false), (v_deck_id, 'GD03-123', 4, false), (v_deck_id, 'GD02-079', 4, false),
    (v_deck_id, 'ST01-001', 3, true), (v_deck_id, 'ST01-010', 3, true), (v_deck_id, 'ST01-014', 2, false);

  -- ─── deck-021: GD03 Red-White SEED Deck ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-021');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD03 Red-White SEED Deck',
    'A ZAFT deck made stronger by Providence Gundam! Great synergy with ZAFT Units, powering them up.',
    true, ARRAY['Red','White'], 'ZAFT', 'official', 'https://www.gundam-gcg.com/en/decks/deck-021.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD03-033', 4, true), (v_deck_id, 'GD03-038', 2, true), (v_deck_id, 'GD03-042', 2, false),
    (v_deck_id, 'GD03-070', 3, false), (v_deck_id, 'GD03-091', 4, true), (v_deck_id, 'GD03-118', 4, false),
    (v_deck_id, 'GD03-127', 2, true), (v_deck_id, 'GD01-046', 2, false), (v_deck_id, 'GD01-050', 4, false),
    (v_deck_id, 'GD01-054', 4, false), (v_deck_id, 'GD01-066', 2, false), (v_deck_id, 'GD01-118', 2, false),
    (v_deck_id, 'GD01-127', 2, false), (v_deck_id, 'ST04-006', 3, false), (v_deck_id, 'ST04-008', 4, false),
    (v_deck_id, 'ST04-010', 3, false), (v_deck_id, 'ST04-011', 3, false);

  -- ─── deck-022: GD03 Jupitris (Team Battle Version) ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-022');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'GD03 Jupitris (Team Battle Version)',
    'Rest with the best to carve a path for your allies! With The-O as its ace, adept at resting enemy Units.',
    true, ARRAY['Purple'], 'Jupitris', 'official', 'https://www.gundam-gcg.com/en/decks/deck-022.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD03-002', 4, true), (v_deck_id, 'GD03-003', 4, true), (v_deck_id, 'GD03-004', 2, false),
    (v_deck_id, 'GD03-008', 3, true), (v_deck_id, 'GD03-009', 3, false), (v_deck_id, 'GD03-012', 4, false),
    (v_deck_id, 'GD03-084', 4, true), (v_deck_id, 'GD03-086', 2, false), (v_deck_id, 'GD03-087', 4, false),
    (v_deck_id, 'GD03-104', 2, false), (v_deck_id, 'GD03-118', 4, false), (v_deck_id, 'GD03-123', 2, false),
    (v_deck_id, 'GD02-008', 2, false), (v_deck_id, 'GD02-015', 2, false), (v_deck_id, 'ST01-014', 3, false),
    (v_deck_id, 'ST02-014', 2, false), (v_deck_id, 'ST04-012', 3, false);

  -- ─── deck-023: Dynames x Altron (Team Battle Version) ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-023');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'Dynames x Altron (Team Battle Version)',
    'Smash enemy defensive lines with Altron Gundam as its ace! Battling enemy Units is this deck major strength.',
    true, ARRAY['Green','Purple'], 'Celestial Being', 'official', 'https://www.gundam-gcg.com/en/decks/deck-023.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST03-008', 4, false), (v_deck_id, 'GD01-030', 4, false), (v_deck_id, 'ST07-005', 4, true),
    (v_deck_id, 'GD01-041', 3, false), (v_deck_id, 'GD03-026', 3, false), (v_deck_id, 'GD01-025', 4, true),
    (v_deck_id, 'GD03-018', 4, true), (v_deck_id, 'GD01-090', 4, false), (v_deck_id, 'GD01-091', 4, false),
    (v_deck_id, 'ST07-011', 4, false), (v_deck_id, 'GD03-117', 3, true), (v_deck_id, 'GD03-106', 3, false),
    (v_deck_id, 'GD03-105', 3, false), (v_deck_id, 'GD03-126', 3, false);

  -- ─── deck-024: Triple Ship Alliance x AGE 2 (Team Battle Version) ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-024');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'Triple Ship Alliance x AGE 2 (Team Battle Version)',
    'Shield your allies with this champion defender! With Freedom Gundam as its ace for exceptional defense.',
    true, ARRAY['White','Red'], 'SEED', 'official', 'https://www.gundam-gcg.com/en/decks/deck-024.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'GD01-081', 4, false), (v_deck_id, 'GD01-069', 4, true), (v_deck_id, 'GD03-072', 4, false),
    (v_deck_id, 'GD01-068', 2, false), (v_deck_id, 'GD03-019', 4, true), (v_deck_id, 'GD03-070', 4, true),
    (v_deck_id, 'GD01-065', 3, false), (v_deck_id, 'GD01-066', 2, false), (v_deck_id, 'GD03-076', 2, true),
    (v_deck_id, 'ST04-010', 4, false), (v_deck_id, 'GD03-088', 4, false), (v_deck_id, 'GD03-118', 4, false),
    (v_deck_id, 'GD03-105', 2, false), (v_deck_id, 'ST01-014', 2, false), (v_deck_id, 'GD02-129', 3, false),
    (v_deck_id, 'ST04-015', 2, false);

  -- ─── deck-025: Xi Gundam x Qubeley (Team Battle Version) ───
  v_deck_id := uuid_generate_v5(ns, base_url || 'deck-025');
  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)
  VALUES (v_deck_id, NULL, 'Xi Gundam x Qubeley (Team Battle Version)',
    'With Xi Gundam as its ace, excels at using effect damage to remove enemy Units. Qubeley suppression clinches victory.',
    true, ARRAY['Red','Purple'], 'Qubeley Control', 'official', 'https://www.gundam-gcg.com/en/decks/deck-025.php')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;

  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;
  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES
    (v_deck_id, 'ST08-005', 4, false), (v_deck_id, 'GD03-056', 4, true), (v_deck_id, 'ST08-002', 3, false),
    (v_deck_id, 'GD03-036', 2, false), (v_deck_id, 'GD02-036', 3, true), (v_deck_id, 'ST08-001', 4, true),
    (v_deck_id, 'ST08-010', 4, true), (v_deck_id, 'GD02-091', 4, false), (v_deck_id, 'GD01-111', 3, false),
    (v_deck_id, 'GD02-107', 2, false), (v_deck_id, 'GD02-110', 2, false), (v_deck_id, 'ST05-014', 3, false),
    (v_deck_id, 'GD03-109', 4, false), (v_deck_id, 'GD03-113', 2, false), (v_deck_id, 'ST08-013', 4, false),
    (v_deck_id, 'GD02-126', 2, false);

END $$;
