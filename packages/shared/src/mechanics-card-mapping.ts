/**
 * Mechanics-to-CardIds Mapping
 * Maps TCG mechanics keywords to the card IDs that bear them
 * 
 * Source: Gundam Card Game mechanics research + card database curation
 * This mapping enables filtering and synergy detection in the deck builder
 */

/**
 * Comprehensive mapping of mechanics keywords to card IDs
 * Each key is a mechanic tag; each value is an array of card IDs that feature it
 * 
 * Mechanics included:
 * - Keywords: repair, breach, support, blocker, first_strike, high_maneuver, suppression
 * - Triggers: burst, deploy, attack_trigger, destroyed
 * - Activated: activate_main, activate_action
 * - Pairing/Linking: paired, link
 */
export const MECHANICS_TO_CARDS: Record<string, string[]> = {
  // Keywords: Battle Abilities
  'repair': [
    'GD03-001', // Gundam NT-1 (Steel Requiem)
    'ST08-018', // Gundam Geminass (Flash of Radiance)
    // Add more cards with Repair as they are identified
  ],

  'breach': [
    'GD03-022', // Gundam Kyrios
    'GD03-018', // Kshatriya Besserung
    // Add more cards with Breach as they are identified
  ],

  'support': [
    'ST01-009', // AEU-01 (Heroic Beginnings)
    'ST07-045', // Athrun Zala
    // Add more cards with Support as they are identified
  ],

  'blocker': [
    'GD02-021', // Pepperoni's Convoy (Dual Impact)
    'GD03-072', // Aile Strike Gundam
    // Add more cards with Blocker as they are identified
  ],

  'first_strike': [
    'GD01-014', // MBF-P02 Gundam Astray Red Frame
    'GD03-049', // Gundam Exia (Trans-Am)
    // Add more cards with First Strike as they are identified
  ],

  'high_maneuver': [
    'ST01-051', // Kshatriya (Heroic Beginnings)
    // Add more cards with High-Maneuver as they are identified
  ],

  'suppression': [
    'GD03-025', // Gundam Sandrock Custom
    'ST02-036', // Rock Rommel
    // Add more cards with Suppression as they are identified
  ],

  // Triggers: Shield-Related
  'burst': [
    'ST05-016', // Look of Determination (Iron Bloom, Command)
    'GD03-173', // Distant Reunion (Command)
    // Add more cards with Burst as they are identified
  ],

  // Triggers: Deployment
  'deploy': [
    'GD03-051', // Gundam X Divider
    'ST05-014', // Improved Technique (Resource)
    // Add more cards with Deploy as they are identified
  ],

  // Triggers: Attack
  'attack_trigger': [
    'GD03-086', // Yazan Gable (Pilot)
    'GD03-073', // Carta Issue (Command)
    // Add more cards with Attack triggers as they are identified
  ],

  // Triggers: Destruction
  'destroyed': [
    'ST03-044', // Reccoa Londe (Command)
    'GD03-059', // Zedas R
    // Add more cards with Destroyed triggers as they are identified
  ],

  // Activated Abilities: Main Phase
  'activate_main': [
    'ST01-009', // AEU-01 (overlaps with Support)
    'ST05-022', // G-Defenser
    // Add more cards with Activate:Main as they are identified
  ],

  // Activated Abilities: Action Step
  'activate_action': [
    'ST06-010', // Gundam Barbatos (Orga Pilot)
    // Add more cards with Activate:Action as they are identified
  ],

  // Pairing/Linking Effects
  'paired': [
    'ST01-020', // Proto Zero (pairing-based effect)
    'GD03-106', // Sergei Smirnov (pairing condition)
    // Add more cards with pairing synergies as they are identified
  ],

  'link': [
    'ST03-035', // Sieg Zeon (link condition effect)
    'ST02-051', // Chang Wufei (link condition)
    // Add more cards with link synergies as they are identified
  ],

  // Limited Activation (once-per-turn)
  'limited': [
    'ST07-052', // Banagher Links (marked as Limited)
    // Add more cards marked Limited as they are identified
  ],
};

/**
 * Get all cards with a specific mechanic
 */
export function getCardsByMechanic(mechanic: string): string[] {
  return MECHANICS_TO_CARDS[mechanic] ?? [];
}

/**
 * Get all cards with any of the specified mechanics
 * (Union of all card IDs across the provided mechanics)
 */
export function getCardsByMechanics(mechanics: string[]): string[] {
  const cardSet = new Set<string>();
  mechanics.forEach((mechanic) => {
    getCardsByMechanic(mechanic).forEach((cardId) => cardSet.add(cardId));
  });
  return Array.from(cardSet);
}

/**
 * Check if a card has a specific mechanic
 */
export function cardHasMechanic(cardId: string, mechanic: string): boolean {
  const cards = getCardsByMechanic(mechanic);
  return cards.includes(cardId);
}

/**
 * Check if a card has any of the specified mechanics
 */
export function cardHasAnyMechanic(cardId: string, mechanics: string[]): boolean {
  return mechanics.some((mechanic) => cardHasMechanic(cardId, mechanic));
}

/**
 * Get all mechanics that a specific card possesses
 */
export function getCardMechanics(cardId: string): string[] {
  return Object.entries(MECHANICS_TO_CARDS)
    .filter(([, cardIds]) => cardIds.includes(cardId))
    .map(([mechanic]) => mechanic);
}
