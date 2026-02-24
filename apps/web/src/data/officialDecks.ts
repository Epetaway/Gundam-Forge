/**
 * Official GCG prebuilt deck data scraped from https://www.gundam-gcg.com/en/decks/
 * Each deck includes card IDs, quantities, and boss/key cards identified from strategy text.
 */

export interface OfficialDeckCard {
  cardId: string;
  qty: number;
  isBoss: boolean;
}

export interface OfficialDeck {
  slug: string;
  name: string;
  description: string;
  archetype: string;
  colors: string[];
  sourceUrl: string;
  cards: OfficialDeckCard[];
}

export const OFFICIAL_DECKS: OfficialDeck[] = [
  // ─── deck-001 ───
  {
    slug: 'deck-001',
    name: 'Blue/White Midrange Deck',
    description:
      "Start strong with low-cost units in the early game, then strengthen your attacks mid-game by linking with pilots, and finish in style with the 'Aile Strike Gundam'!",
    archetype: 'Blue/White Midrange',
    colors: ['Blue', 'White'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-001.php',
    cards: [
      { cardId: 'ST01-001', qty: 1, isBoss: true },
      { cardId: 'ST01-002', qty: 2, isBoss: false },
      { cardId: 'ST01-005', qty: 2, isBoss: false },
      { cardId: 'ST04-001', qty: 1, isBoss: true },
      { cardId: 'ST04-005', qty: 2, isBoss: false },
      { cardId: 'GD01-004', qty: 2, isBoss: false },
      { cardId: 'GD01-005', qty: 2, isBoss: false },
      { cardId: 'GD01-009', qty: 3, isBoss: false },
      { cardId: 'GD01-011', qty: 2, isBoss: false },
      { cardId: 'GD01-013', qty: 2, isBoss: false },
      { cardId: 'GD01-018', qty: 3, isBoss: false },
      { cardId: 'GD01-068', qty: 2, isBoss: false },
      { cardId: 'GD01-077', qty: 2, isBoss: false },
      { cardId: 'ST01-010', qty: 2, isBoss: true },
      { cardId: 'ST04-010', qty: 2, isBoss: false },
      { cardId: 'GD01-088', qty: 2, isBoss: false },
      { cardId: 'GD01-089', qty: 2, isBoss: false },
      { cardId: 'ST01-012', qty: 2, isBoss: false },
      { cardId: 'ST01-013', qty: 2, isBoss: false },
      { cardId: 'ST04-013', qty: 3, isBoss: false },
      { cardId: 'GD01-100', qty: 1, isBoss: true },
      { cardId: 'GD01-118', qty: 2, isBoss: false },
      { cardId: 'ST01-015', qty: 2, isBoss: false },
      { cardId: 'ST04-015', qty: 2, isBoss: false },
      { cardId: 'GD01-124', qty: 2, isBoss: false },
    ],
  },

  // ─── deck-002 ───
  {
    slug: 'deck-002',
    name: 'Green/White Ramp Deck',
    description:
      "Build up resources to deploy powerful units, dominate the field with efficient moves in the mid-game, and crush your opponent in the late game with 'Wing Gundam' and 'Gundam Aerial'!",
    archetype: 'Green/White Ramp',
    colors: ['Green', 'White'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-002.php',
    cards: [
      { cardId: 'ST02-001', qty: 1, isBoss: true },
      { cardId: 'ST02-002', qty: 3, isBoss: true },
      { cardId: 'ST02-005', qty: 2, isBoss: false },
      { cardId: 'ST03-008', qty: 2, isBoss: false },
      { cardId: 'GD01-028', qty: 2, isBoss: true },
      { cardId: 'GD01-030', qty: 3, isBoss: false },
      { cardId: 'GD01-034', qty: 2, isBoss: false },
      { cardId: 'GD01-040', qty: 2, isBoss: false },
      { cardId: 'GD01-041', qty: 4, isBoss: true },
      { cardId: 'GD01-070', qty: 1, isBoss: true },
      { cardId: 'GD01-075', qty: 3, isBoss: false },
      { cardId: 'GD01-076', qty: 3, isBoss: false },
      { cardId: 'ST01-011', qty: 2, isBoss: false },
      { cardId: 'ST02-010', qty: 2, isBoss: true },
      { cardId: 'GD01-091', qty: 2, isBoss: false },
      { cardId: 'GD01-097', qty: 2, isBoss: false },
      { cardId: 'ST02-012', qty: 2, isBoss: false },
      { cardId: 'ST02-013', qty: 2, isBoss: false },
      { cardId: 'GD01-107', qty: 2, isBoss: true },
      { cardId: 'GD01-117', qty: 1, isBoss: false },
      { cardId: 'GD01-118', qty: 3, isBoss: false },
      { cardId: 'ST02-015', qty: 2, isBoss: false },
      { cardId: 'ST04-015', qty: 2, isBoss: false },
    ],
  },

  // ─── deck-003 ───
  {
    slug: 'deck-003',
    name: 'Blue-Green Breach Link Unit Deck',
    description:
      'In the early game, use low-cost Units to chip away at your opponent\'s shields. In the midgame, break through defenses with Link Unit and Breach effects! Finish the game in style with powerful Link Units in the late game!',
    archetype: 'Blue/Green Breach',
    colors: ['Blue', 'Green'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-003.php',
    cards: [
      { cardId: 'ST01-001', qty: 1, isBoss: true },
      { cardId: 'ST01-002', qty: 3, isBoss: true },
      { cardId: 'ST01-005', qty: 2, isBoss: true },
      { cardId: 'ST01-010', qty: 3, isBoss: true },
      { cardId: 'ST01-013', qty: 2, isBoss: false },
      { cardId: 'ST01-015', qty: 3, isBoss: false },
      { cardId: 'ST02-001', qty: 1, isBoss: false },
      { cardId: 'ST02-005', qty: 3, isBoss: false },
      { cardId: 'ST02-010', qty: 2, isBoss: false },
      { cardId: 'ST03-007', qty: 2, isBoss: false },
      { cardId: 'ST03-008', qty: 2, isBoss: false },
      { cardId: 'ST03-011', qty: 3, isBoss: false },
      { cardId: 'ST03-016', qty: 3, isBoss: false },
      { cardId: 'GD01-004', qty: 2, isBoss: false },
      { cardId: 'GD01-015', qty: 2, isBoss: false },
      { cardId: 'GD01-016', qty: 2, isBoss: false },
      { cardId: 'GD01-026', qty: 2, isBoss: false },
      { cardId: 'GD01-030', qty: 2, isBoss: false },
      { cardId: 'GD01-031', qty: 3, isBoss: false },
      { cardId: 'GD01-040', qty: 3, isBoss: false },
      { cardId: 'GD01-099', qty: 1, isBoss: false },
      { cardId: 'GD01-100', qty: 2, isBoss: false },
      { cardId: 'GD01-105', qty: 1, isBoss: false },
    ],
  },

  // ─── deck-004 ───
  {
    slug: 'deck-004',
    name: 'ST01 Earth Federation / Academy',
    description:
      "Amuro and Suletta collaborate for total control of the field! This deck uses Gundam's overall strength and Gundam Aerial (Permet Score Six)'s effects to give you the advantage on the field.",
    archetype: 'Earth Federation',
    colors: ['Blue', 'White'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-004.php',
    cards: [
      { cardId: 'ST01-001', qty: 4, isBoss: true },
      { cardId: 'ST01-002', qty: 4, isBoss: false },
      { cardId: 'ST01-003', qty: 2, isBoss: false },
      { cardId: 'ST01-004', qty: 4, isBoss: false },
      { cardId: 'ST01-005', qty: 4, isBoss: true },
      { cardId: 'ST01-006', qty: 4, isBoss: true },
      { cardId: 'ST01-007', qty: 4, isBoss: false },
      { cardId: 'ST01-009', qty: 4, isBoss: true },
      { cardId: 'ST01-010', qty: 4, isBoss: false },
      { cardId: 'ST01-011', qty: 4, isBoss: false },
      { cardId: 'ST01-012', qty: 4, isBoss: false },
      { cardId: 'ST01-014', qty: 4, isBoss: false },
      { cardId: 'ST01-015', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-005 ───
  {
    slug: 'deck-005',
    name: 'ST02 Operation Meteor / OZ',
    description:
      "If you make your timing, it can't be beat! Hammer away with Tallgeese! Survive early turns with smaller units, then gain strength as you level up to unleash Tallgeese's sustained offense against the opponent's base.",
    archetype: 'Operation Meteor',
    colors: ['Green'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-005.php',
    cards: [
      { cardId: 'ST02-001', qty: 4, isBoss: true },
      { cardId: 'ST02-002', qty: 4, isBoss: true },
      { cardId: 'ST02-003', qty: 4, isBoss: false },
      { cardId: 'ST02-005', qty: 4, isBoss: false },
      { cardId: 'ST02-006', qty: 4, isBoss: true },
      { cardId: 'ST02-008', qty: 4, isBoss: false },
      { cardId: 'ST02-009', qty: 4, isBoss: false },
      { cardId: 'ST02-010', qty: 4, isBoss: true },
      { cardId: 'ST02-011', qty: 4, isBoss: false },
      { cardId: 'ST02-012', qty: 4, isBoss: false },
      { cardId: 'ST02-014', qty: 4, isBoss: false },
      { cardId: 'ST02-015', qty: 3, isBoss: false },
      { cardId: 'ST02-016', qty: 3, isBoss: false },
    ],
  },

  // ─── deck-006 ───
  {
    slug: 'deck-006',
    name: 'ST03 Zeon / Neo Zeon',
    description:
      'Quickly assault their Shields, then evade with maneuverability! This deck takes advantage in the early game with Sinanju and Char\'s Zaku II to grab the lead and win.',
    archetype: 'Neo Zeon',
    colors: ['Red'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-006.php',
    cards: [
      { cardId: 'ST03-001', qty: 4, isBoss: true },
      { cardId: 'ST03-002', qty: 4, isBoss: false },
      { cardId: 'ST03-003', qty: 4, isBoss: false },
      { cardId: 'ST03-004', qty: 4, isBoss: false },
      { cardId: 'ST03-006', qty: 4, isBoss: true },
      { cardId: 'ST03-007', qty: 4, isBoss: false },
      { cardId: 'ST03-008', qty: 4, isBoss: true },
      { cardId: 'ST03-009', qty: 4, isBoss: true },
      { cardId: 'ST03-010', qty: 4, isBoss: false },
      { cardId: 'ST03-011', qty: 4, isBoss: false },
      { cardId: 'ST03-013', qty: 4, isBoss: false },
      { cardId: 'ST03-014', qty: 2, isBoss: false },
      { cardId: 'ST03-015', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-007 ───
  {
    slug: 'deck-007',
    name: 'ST04 Earth Alliance / ZAFT',
    description:
      'A SEED deck with ZAFT offense and Earth Alliance defense! This deck can remove threats with attacks from Aegis Gundam while protecting Archangel and going on the offensive with Aile Strike Gundam.',
    archetype: 'SEED',
    colors: ['Red', 'White'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-007.php',
    cards: [
      { cardId: 'ST04-001', qty: 4, isBoss: true },
      { cardId: 'ST04-002', qty: 4, isBoss: true },
      { cardId: 'ST04-003', qty: 4, isBoss: false },
      { cardId: 'ST04-004', qty: 2, isBoss: false },
      { cardId: 'ST04-005', qty: 4, isBoss: true },
      { cardId: 'ST04-006', qty: 4, isBoss: true },
      { cardId: 'ST04-007', qty: 4, isBoss: false },
      { cardId: 'ST04-008', qty: 4, isBoss: false },
      { cardId: 'ST04-010', qty: 4, isBoss: false },
      { cardId: 'ST04-011', qty: 4, isBoss: false },
      { cardId: 'ST04-012', qty: 4, isBoss: false },
      { cardId: 'ST04-013', qty: 4, isBoss: false },
      { cardId: 'ST04-015', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-008 ───
  {
    slug: 'deck-008',
    name: 'GD01 Freedom Gundam',
    description:
      'Gain the advantage by taking control of the battlefield! This is a control deck that uses Blocker to defend against enemy Units while increasing its advantage with the When Paired effect on Amuro Ray and A Show of Resolve until the end game.',
    archetype: 'Blue/White Midrange',
    colors: ['Blue', 'White'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-008.php',
    cards: [
      { cardId: 'GD01-004', qty: 4, isBoss: false },
      { cardId: 'GD01-065', qty: 4, isBoss: true },
      { cardId: 'GD01-066', qty: 3, isBoss: false },
      { cardId: 'GD01-067', qty: 3, isBoss: true },
      { cardId: 'GD01-086', qty: 4, isBoss: false },
      { cardId: 'GD01-100', qty: 2, isBoss: true },
      { cardId: 'GD01-118', qty: 4, isBoss: false },
      { cardId: 'ST01-009', qty: 4, isBoss: false },
      { cardId: 'ST01-010', qty: 4, isBoss: false },
      { cardId: 'ST01-011', qty: 4, isBoss: false },
      { cardId: 'ST04-001', qty: 4, isBoss: true },
      { cardId: 'ST04-010', qty: 4, isBoss: false },
      { cardId: 'ST04-012', qty: 2, isBoss: false },
      { cardId: 'ST04-015', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-009 ───
  {
    slug: 'deck-009',
    name: 'ST03 Enhanced Neo Zeon Mid-Range',
    description:
      'Punch through with firepower for an early game victory! This deck emphasizes aggressive early-game pressure using eight Lv.2 one-cost Units, followed by mid-game powerhouses like Kshatriya and Sinanju to sustain momentum.',
    archetype: 'Neo Zeon',
    colors: ['Red'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-009.php',
    cards: [
      { cardId: 'GD01-035', qty: 4, isBoss: false },
      { cardId: 'GD01-044', qty: 4, isBoss: true },
      { cardId: 'GD01-051', qty: 4, isBoss: false },
      { cardId: 'GD01-052', qty: 4, isBoss: false },
      { cardId: 'GD01-093', qty: 4, isBoss: true },
      { cardId: 'GD01-111', qty: 2, isBoss: false },
      { cardId: 'GD01-128', qty: 4, isBoss: false },
      { cardId: 'ST03-001', qty: 4, isBoss: true },
      { cardId: 'ST03-003', qty: 4, isBoss: false },
      { cardId: 'ST03-006', qty: 4, isBoss: true },
      { cardId: 'ST03-008', qty: 4, isBoss: false },
      { cardId: 'ST03-010', qty: 4, isBoss: false },
      { cardId: 'ST03-013', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-010 ───
  {
    slug: 'deck-010',
    name: 'ST05 Tekkadan Aggro',
    description:
      'A Tekkadan deck that damages its own Units to grow stronger, focusing on activating effects by self-damage, with Isaribi as a pivotal support card and Gundam Barbatos 4th Form as the finisher.',
    archetype: 'Tekkadan Aggro',
    colors: ['Red'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-010.php',
    cards: [
      { cardId: 'ST05-001', qty: 4, isBoss: true },
      { cardId: 'ST05-002', qty: 4, isBoss: false },
      { cardId: 'ST05-003', qty: 4, isBoss: false },
      { cardId: 'ST05-004', qty: 4, isBoss: false },
      { cardId: 'ST05-005', qty: 4, isBoss: false },
      { cardId: 'ST05-006', qty: 4, isBoss: false },
      { cardId: 'ST05-010', qty: 4, isBoss: true },
      { cardId: 'ST05-011', qty: 2, isBoss: true },
      { cardId: 'ST05-013', qty: 3, isBoss: false },
      { cardId: 'ST05-014', qty: 3, isBoss: false },
      { cardId: 'ST05-015', qty: 4, isBoss: true },
      { cardId: 'GD01-060', qty: 4, isBoss: false },
      { cardId: 'GD01-111', qty: 4, isBoss: false },
      { cardId: 'ST04-008', qty: 2, isBoss: false },
    ],
  },

  // ─── deck-011 ───
  {
    slug: 'deck-011',
    name: 'GD02 AEUG / Earth Alliance',
    description:
      'An iron wall of blockers rebuffs all attacks! Solidly defensive, this deck denies enemy attacks with numerous Blocker Units early, uses removal effects mid-game, then deploys finisher units for victory.',
    archetype: 'AEUG',
    colors: ['Blue', 'White'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-011.php',
    cards: [
      { cardId: 'GD02-129', qty: 2, isBoss: false },
      { cardId: 'GD02-097', qty: 4, isBoss: true },
      { cardId: 'GD02-069', qty: 4, isBoss: true },
      { cardId: 'GD02-075', qty: 2, isBoss: false },
      { cardId: 'GD02-079', qty: 4, isBoss: false },
      { cardId: 'GD02-059', qty: 3, isBoss: false },
      { cardId: 'GD01-118', qty: 4, isBoss: false },
      { cardId: 'GD01-065', qty: 3, isBoss: true },
      { cardId: 'GD01-086', qty: 4, isBoss: false },
      { cardId: 'ST04-001', qty: 4, isBoss: true },
      { cardId: 'ST04-010', qty: 4, isBoss: false },
      { cardId: 'ST04-012', qty: 3, isBoss: false },
      { cardId: 'ST04-015', qty: 4, isBoss: false },
      { cardId: 'ST05-014', qty: 2, isBoss: false },
      { cardId: 'ST01-014', qty: 3, isBoss: false },
    ],
  },

  // ─── deck-012 ───
  {
    slug: 'deck-012',
    name: 'GD02 Tekkadan x Vagan',
    description:
      'Tekkadan is even stronger when teamed with Vagan! This deck adds Vagan\'s destructive power to Tekkadan. Deploy Vagan units early, block with Gundam Gusion Rebake, destroy neutralized enemies, then finish with Gundam Barbatos 4th Form.',
    archetype: 'Tekkadan Aggro',
    colors: ['Red', 'Green'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-012.php',
    cards: [
      { cardId: 'GD02-054', qty: 4, isBoss: false },
      { cardId: 'GD02-055', qty: 4, isBoss: false },
      { cardId: 'GD02-057', qty: 4, isBoss: false },
      { cardId: 'GD02-058', qty: 4, isBoss: false },
      { cardId: 'GD02-066', qty: 4, isBoss: false },
      { cardId: 'GD02-067', qty: 4, isBoss: false },
      { cardId: 'GD02-096', qty: 4, isBoss: true },
      { cardId: 'GD02-110', qty: 2, isBoss: false },
      { cardId: 'GD02-112', qty: 2, isBoss: false },
      { cardId: 'ST05-001', qty: 4, isBoss: true },
      { cardId: 'ST05-002', qty: 4, isBoss: false },
      { cardId: 'ST05-010', qty: 4, isBoss: true },
      { cardId: 'ST05-014', qty: 2, isBoss: false },
      { cardId: 'ST05-015', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-013 ───
  {
    slug: 'deck-013',
    name: 'GD02 Qubeley Control',
    description:
      'Deal damage, deal damage, then deal even more damage! From start to finish, this deck controls the battlefield with damage dealt to enemy Units.',
    archetype: 'Qubeley Control',
    colors: ['Red', 'Purple'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-013.php',
    cards: [
      { cardId: 'GD01-044', qty: 4, isBoss: true },
      { cardId: 'GD01-051', qty: 4, isBoss: false },
      { cardId: 'GD01-093', qty: 4, isBoss: false },
      { cardId: 'GD01-035', qty: 4, isBoss: false },
      { cardId: 'GD02-036', qty: 4, isBoss: true },
      { cardId: 'GD02-039', qty: 4, isBoss: false },
      { cardId: 'GD02-091', qty: 4, isBoss: false },
      { cardId: 'GD02-107', qty: 4, isBoss: true },
      { cardId: 'ST03-001', qty: 3, isBoss: true },
      { cardId: 'ST03-006', qty: 4, isBoss: false },
      { cardId: 'ST03-008', qty: 4, isBoss: false },
      { cardId: 'ST03-010', qty: 3, isBoss: false },
      { cardId: 'ST03-015', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-014 ───
  {
    slug: 'deck-014',
    name: 'GD02 AGE x Wing',
    description:
      'Crush with Lv.8 Units after ramping up the power! This ramp deck increases your EX Resources with Gundam AGE-1 Normal, Wing Gundam (Bird Mode), and AGE Device for rapid deployment of Gundam Epyon and Wing Gundam Zero.',
    archetype: 'Green/White Ramp',
    colors: ['Green', 'White'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-014.php',
    cards: [
      { cardId: 'ST02-002', qty: 4, isBoss: false },
      { cardId: 'ST02-011', qty: 4, isBoss: true },
      { cardId: 'GD02-002', qty: 3, isBoss: true },
      { cardId: 'GD02-005', qty: 3, isBoss: false },
      { cardId: 'ST02-006', qty: 2, isBoss: false },
      { cardId: 'GD02-021', qty: 4, isBoss: false },
      { cardId: 'GD02-023', qty: 3, isBoss: false },
      { cardId: 'GD02-027', qty: 4, isBoss: false },
      { cardId: 'GD02-031', qty: 4, isBoss: false },
      { cardId: 'GD02-035', qty: 4, isBoss: false },
      { cardId: 'GD02-088', qty: 4, isBoss: false },
      { cardId: 'GD02-103', qty: 3, isBoss: false },
      { cardId: 'GD02-124', qty: 4, isBoss: false },
      { cardId: 'GD01-024', qty: 2, isBoss: true },
      { cardId: 'GD01-100', qty: 2, isBoss: false },
    ],
  },

  // ─── deck-015 ───
  {
    slug: 'deck-015',
    name: 'GD02 Titans x Cyber-Newtype',
    description:
      'Deal damage while recovering to gain the advantage! This moderately fast deck deals damage to enemy Units with cards like Kshatriya and Guntank, targeting the battlefield as well as the shield area.',
    archetype: 'Titans',
    colors: ['Red', 'Purple'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-015.php',
    cards: [
      { cardId: 'GD02-001', qty: 4, isBoss: true },
      { cardId: 'GD01-044', qty: 3, isBoss: true },
      { cardId: 'GD02-007', qty: 3, isBoss: false },
      { cardId: 'GD01-051', qty: 4, isBoss: false },
      { cardId: 'GD02-008', qty: 2, isBoss: false },
      { cardId: 'GD02-015', qty: 4, isBoss: false },
      { cardId: 'GD02-016', qty: 4, isBoss: false },
      { cardId: 'GD02-013', qty: 4, isBoss: false },
      { cardId: 'GD01-008', qty: 4, isBoss: true },
      { cardId: 'GD02-086', qty: 4, isBoss: false },
      { cardId: 'GD02-085', qty: 4, isBoss: true },
      { cardId: 'GD01-093', qty: 4, isBoss: false },
      { cardId: 'ST02-014', qty: 2, isBoss: false },
      { cardId: 'GD01-124', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-016 ───
  {
    slug: 'deck-016',
    name: 'ST06xGD02 GQuuuuuuX',
    description:
      'The Clan attacks and wins with overwhelming power! Your opponent will never gain the initiative when you hold the battlefield advantage while attacking their shield area.',
    archetype: 'Red Aggro',
    colors: ['Red'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-016.php',
    cards: [
      { cardId: 'GD02-038', qty: 4, isBoss: true },
      { cardId: 'GD02-041', qty: 2, isBoss: false },
      { cardId: 'GD02-109', qty: 3, isBoss: false },
      { cardId: 'ST06-001', qty: 4, isBoss: true },
      { cardId: 'ST06-002', qty: 3, isBoss: false },
      { cardId: 'ST06-005', qty: 4, isBoss: true },
      { cardId: 'ST06-006', qty: 2, isBoss: false },
      { cardId: 'ST06-007', qty: 4, isBoss: false },
      { cardId: 'ST06-008', qty: 4, isBoss: false },
      { cardId: 'ST06-009', qty: 4, isBoss: false },
      { cardId: 'ST06-010', qty: 4, isBoss: false },
      { cardId: 'ST06-014', qty: 4, isBoss: false },
      { cardId: 'GD01-035', qty: 4, isBoss: false },
      { cardId: 'ST03-008', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-017 ───
  {
    slug: 'deck-017',
    name: 'ST07xGD03 Purple-Green Celestial Being Enhanced',
    description:
      'This midrange deck uses Gundam Dynames and Gundam Exia to grab control of the battlefield mid game then achieves victory in the last half with Gundam Exia (Trans-Am).',
    archetype: 'Celestial Being',
    colors: ['Purple', 'Green'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-017.php',
    cards: [
      { cardId: 'ST07-001', qty: 4, isBoss: false },
      { cardId: 'ST07-002', qty: 4, isBoss: false },
      { cardId: 'ST07-004', qty: 4, isBoss: true },
      { cardId: 'ST07-005', qty: 4, isBoss: true },
      { cardId: 'ST07-007', qty: 4, isBoss: true },
      { cardId: 'ST07-009', qty: 4, isBoss: false },
      { cardId: 'ST07-011', qty: 4, isBoss: false },
      { cardId: 'ST07-014', qty: 3, isBoss: false },
      { cardId: 'ST07-015', qty: 4, isBoss: false },
      { cardId: 'GD03-026', qty: 4, isBoss: false },
      { cardId: 'GD03-049', qty: 4, isBoss: true },
      { cardId: 'GD03-057', qty: 3, isBoss: false },
      { cardId: 'GD03-063', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-018 ───
  {
    slug: 'deck-018',
    name: 'ST08xGD03 Red-Blue Hathaway Deck',
    description:
      'Your opponent will feel it when this deck lays on the pressure using super-heavyweight hitters like Penelope and Xi Gundam.',
    archetype: 'Red/Blue Control',
    colors: ['Red', 'Blue'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-018.php',
    cards: [
      { cardId: 'ST08-001', qty: 3, isBoss: true },
      { cardId: 'ST08-002', qty: 3, isBoss: false },
      { cardId: 'ST08-004', qty: 4, isBoss: true },
      { cardId: 'ST08-005', qty: 4, isBoss: false },
      { cardId: 'ST08-006', qty: 3, isBoss: true },
      { cardId: 'ST08-008', qty: 3, isBoss: true },
      { cardId: 'ST08-009', qty: 3, isBoss: false },
      { cardId: 'ST08-010', qty: 4, isBoss: false },
      { cardId: 'ST08-011', qty: 3, isBoss: false },
      { cardId: 'ST08-012', qty: 2, isBoss: false },
      { cardId: 'ST08-013', qty: 3, isBoss: false },
      { cardId: 'ST08-014', qty: 3, isBoss: false },
      { cardId: 'ST08-015', qty: 1, isBoss: false },
      { cardId: 'GD03-006', qty: 3, isBoss: false },
      { cardId: 'GD03-036', qty: 3, isBoss: false },
      { cardId: 'GD03-043', qty: 2, isBoss: false },
      { cardId: 'GD03-103', qty: 3, isBoss: false },
    ],
  },

  // ─── deck-019 ───
  {
    slug: 'deck-019',
    name: 'GD03 Blue-Green Cyclops Team Deck',
    description:
      'Cyclops Team overruns your enemy with Unit tokens! This deck fights using a steady supply of Cyclops Team Unit tokens and Link Units. Bernie is there to hit that final grand slam!',
    archetype: 'Blue/Green Breach',
    colors: ['Blue', 'Green'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-019.php',
    cards: [
      { cardId: 'GD03-017', qty: 4, isBoss: true },
      { cardId: 'GD03-020', qty: 4, isBoss: false },
      { cardId: 'GD03-024', qty: 4, isBoss: false },
      { cardId: 'GD03-027', qty: 4, isBoss: false },
      { cardId: 'GD03-089', qty: 4, isBoss: true },
      { cardId: 'GD03-090', qty: 4, isBoss: false },
      { cardId: 'GD03-107', qty: 4, isBoss: true },
      { cardId: 'GD03-108', qty: 4, isBoss: false },
      { cardId: 'GD01-030', qty: 4, isBoss: false },
      { cardId: 'GD01-031', qty: 4, isBoss: false },
      { cardId: 'GD01-035', qty: 2, isBoss: false },
      { cardId: 'ST02-016', qty: 4, isBoss: false },
      { cardId: 'ST03-008', qty: 4, isBoss: false },
    ],
  },

  // ─── deck-020 ───
  {
    slug: 'deck-020',
    name: 'GD03 The-O Repair Deck',
    description:
      "Using The-O's ability to rest enemy Units, this deck can exercise complete control over your opponent's field. A unique control deck that tacks on resting to the already powerful Repair ability.",
    archetype: 'Purple Control',
    colors: ['Purple', 'Blue'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-020.php',
    cards: [
      { cardId: 'GD03-001', qty: 3, isBoss: false },
      { cardId: 'GD03-002', qty: 4, isBoss: true },
      { cardId: 'GD03-003', qty: 4, isBoss: false },
      { cardId: 'GD03-008', qty: 4, isBoss: false },
      { cardId: 'GD03-009', qty: 2, isBoss: false },
      { cardId: 'GD03-012', qty: 4, isBoss: false },
      { cardId: 'GD03-013', qty: 3, isBoss: false },
      { cardId: 'GD03-084', qty: 4, isBoss: true },
      { cardId: 'GD03-087', qty: 4, isBoss: false },
      { cardId: 'GD03-104', qty: 2, isBoss: false },
      { cardId: 'GD03-123', qty: 4, isBoss: false },
      { cardId: 'GD02-079', qty: 4, isBoss: false },
      { cardId: 'ST01-001', qty: 3, isBoss: true },
      { cardId: 'ST01-010', qty: 3, isBoss: true },
      { cardId: 'ST01-014', qty: 2, isBoss: false },
    ],
  },

  // ─── deck-021 ───
  {
    slug: 'deck-021',
    name: 'GD03 Red-White SEED Deck',
    description:
      'A ZAFT deck made stronger by the inclusion of Providence Gundam! It shows great synergy with fellow ZAFT Units, powering them up so they annihilate their enemies.',
    archetype: 'ZAFT',
    colors: ['Red', 'White'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-021.php',
    cards: [
      { cardId: 'GD03-033', qty: 4, isBoss: true },
      { cardId: 'GD03-038', qty: 2, isBoss: true },
      { cardId: 'GD03-042', qty: 2, isBoss: false },
      { cardId: 'GD03-070', qty: 3, isBoss: false },
      { cardId: 'GD03-091', qty: 4, isBoss: true },
      { cardId: 'GD03-118', qty: 4, isBoss: false },
      { cardId: 'GD03-127', qty: 2, isBoss: true },
      { cardId: 'GD01-046', qty: 2, isBoss: false },
      { cardId: 'GD01-050', qty: 4, isBoss: false },
      { cardId: 'GD01-054', qty: 4, isBoss: false },
      { cardId: 'GD01-066', qty: 2, isBoss: false },
      { cardId: 'GD01-118', qty: 2, isBoss: false },
      { cardId: 'GD01-127', qty: 2, isBoss: false },
      { cardId: 'ST04-006', qty: 3, isBoss: false },
      { cardId: 'ST04-008', qty: 4, isBoss: false },
      { cardId: 'ST04-010', qty: 3, isBoss: false },
      { cardId: 'ST04-011', qty: 3, isBoss: false },
    ],
  },

  // ─── deck-022 ───
  {
    slug: 'deck-022',
    name: 'GD03 Jupitris (Team Battle Version)',
    description:
      "Rest with the best to carve a path for your allies! With The-O as its ace, this deck is particularly adept at resting enemy Units.",
    archetype: 'Jupitris',
    colors: ['Purple'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-022.php',
    cards: [
      { cardId: 'GD03-002', qty: 4, isBoss: true },
      { cardId: 'GD03-003', qty: 4, isBoss: true },
      { cardId: 'GD03-004', qty: 2, isBoss: false },
      { cardId: 'GD03-008', qty: 3, isBoss: true },
      { cardId: 'GD03-009', qty: 3, isBoss: false },
      { cardId: 'GD03-012', qty: 4, isBoss: false },
      { cardId: 'GD03-084', qty: 4, isBoss: true },
      { cardId: 'GD03-086', qty: 2, isBoss: false },
      { cardId: 'GD03-087', qty: 4, isBoss: false },
      { cardId: 'GD03-104', qty: 2, isBoss: false },
      { cardId: 'GD03-118', qty: 4, isBoss: false },
      { cardId: 'GD03-123', qty: 2, isBoss: false },
      { cardId: 'GD02-008', qty: 2, isBoss: false },
      { cardId: 'GD02-015', qty: 2, isBoss: false },
      { cardId: 'ST01-014', qty: 3, isBoss: false },
      { cardId: 'ST02-014', qty: 2, isBoss: false },
      { cardId: 'ST04-012', qty: 3, isBoss: false },
    ],
  },

  // ─── deck-023 ───
  {
    slug: 'deck-023',
    name: 'Dynames x Altron (Team Battle Version)',
    description:
      "Smash enemy defensive lines with this battle veteran! With Altron Gundam as its ace, battling enemy Units is this deck's major strength.",
    archetype: 'Celestial Being',
    colors: ['Green', 'Purple'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-023.php',
    cards: [
      { cardId: 'ST03-008', qty: 4, isBoss: false },
      { cardId: 'GD01-030', qty: 4, isBoss: false },
      { cardId: 'ST07-005', qty: 4, isBoss: true },
      { cardId: 'GD01-041', qty: 3, isBoss: false },
      { cardId: 'GD03-026', qty: 3, isBoss: false },
      { cardId: 'GD01-025', qty: 4, isBoss: true },
      { cardId: 'GD03-018', qty: 4, isBoss: true },
      { cardId: 'GD01-090', qty: 4, isBoss: false },
      { cardId: 'GD01-091', qty: 4, isBoss: false },
      { cardId: 'ST07-011', qty: 4, isBoss: false },
      { cardId: 'GD03-117', qty: 3, isBoss: true },
      { cardId: 'GD03-106', qty: 3, isBoss: false },
      { cardId: 'GD03-105', qty: 3, isBoss: false },
      { cardId: 'GD03-126', qty: 3, isBoss: false },
    ],
  },

  // ─── deck-024 ───
  {
    slug: 'deck-024',
    name: 'Triple Ship Alliance x AGE 2 (Team Battle Version)',
    description:
      'Shield your allies with this champion defender! With Freedom Gundam as its ace, this deck provides exceptional defense.',
    archetype: 'SEED',
    colors: ['White', 'Red'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-024.php',
    cards: [
      { cardId: 'GD01-081', qty: 4, isBoss: false },
      { cardId: 'GD01-069', qty: 4, isBoss: true },
      { cardId: 'GD03-072', qty: 4, isBoss: false },
      { cardId: 'GD01-068', qty: 2, isBoss: false },
      { cardId: 'GD03-019', qty: 4, isBoss: true },
      { cardId: 'GD03-070', qty: 4, isBoss: true },
      { cardId: 'GD01-065', qty: 3, isBoss: false },
      { cardId: 'GD01-066', qty: 2, isBoss: false },
      { cardId: 'GD03-076', qty: 2, isBoss: true },
      { cardId: 'ST04-010', qty: 4, isBoss: false },
      { cardId: 'GD03-088', qty: 4, isBoss: false },
      { cardId: 'GD03-118', qty: 4, isBoss: false },
      { cardId: 'GD03-105', qty: 2, isBoss: false },
      { cardId: 'ST01-014', qty: 2, isBoss: false },
      { cardId: 'GD02-129', qty: 3, isBoss: false },
      { cardId: 'ST04-015', qty: 2, isBoss: false },
    ],
  },

  // ─── deck-025 ───
  {
    slug: 'deck-025',
    name: 'Xi Gundam x Qubeley (Team Battle Version)',
    description:
      "With Xi Gundam as its ace, this deck excels at using effect damage to remove enemy Units and control the battlefield. Qubeley's suppression effect clinches victory.",
    archetype: 'Qubeley Control',
    colors: ['Red', 'Purple'],
    sourceUrl: 'https://www.gundam-gcg.com/en/decks/deck-025.php',
    cards: [
      { cardId: 'ST08-005', qty: 4, isBoss: false },
      { cardId: 'GD03-056', qty: 4, isBoss: true },
      { cardId: 'ST08-002', qty: 3, isBoss: false },
      { cardId: 'GD03-036', qty: 2, isBoss: false },
      { cardId: 'GD02-036', qty: 3, isBoss: true },
      { cardId: 'ST08-001', qty: 4, isBoss: true },
      { cardId: 'ST08-010', qty: 4, isBoss: true },
      { cardId: 'GD02-091', qty: 4, isBoss: false },
      { cardId: 'GD01-111', qty: 3, isBoss: false },
      { cardId: 'GD02-107', qty: 2, isBoss: false },
      { cardId: 'GD02-110', qty: 2, isBoss: false },
      { cardId: 'ST05-014', qty: 3, isBoss: false },
      { cardId: 'GD03-109', qty: 4, isBoss: false },
      { cardId: 'GD03-113', qty: 2, isBoss: false },
      { cardId: 'ST08-013', qty: 4, isBoss: false },
      { cardId: 'GD02-126', qty: 2, isBoss: false },
    ],
  },
];
