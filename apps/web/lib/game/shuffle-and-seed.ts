/**
 * Deterministic Shuffle + Game Seed System
 * Ensures reproducible game sequences for testing and replay
 *
 * Uses Linear Congruential Generator (LCG) for seeded random number generation
 */

import { RNG_CONFIG } from './rules-constants';
import type { CardInstance } from './game-engine';

/**
 * Game seed represents the starting configuration
 * Used to reproduce exact game state
 */
export interface GameSeed {
  timestamp: number;
  deckId: string;
  randomComponent: number;
  value: number;
}

/**
 * RNG state for seeded random generation
 */
export interface RngState {
  seed: number;
  next: () => number; // Returns [0, 1)
}

/**
 * Create a game seed for reproducible game states
 * Formula: (timestamp + deckId.charCodeSum) * randomComponent
 */
export function createSeed(deckId: string, randomComponent?: number): GameSeed {
  const timestamp = Date.now();
  const random = randomComponent ?? Math.floor(Math.random() * (2 ** 31));

  // Create a deterministic component from deckId
  let deckIdComponent = 0;
  for (let i = 0; i < deckId.length; i++) {
    deckIdComponent += deckId.charCodeAt(i);
  }

  // Combine components into final seed
  const seed = ((timestamp + deckIdComponent) * random) % (2 ** 31);

  return {
    timestamp,
    deckId,
    randomComponent: random,
    value: seed,
  };
}

/**
 * Create RNG state from seed
 * Uses LCG algorithm for deterministic sequence
 */
export function createRng(seed: number): RngState {
  let state = seed;

  return {
    seed,
    next: () => {
      // LCG formula: next = (a * current + c) mod m
      state = (RNG_CONFIG.lcgA * state + RNG_CONFIG.lcgC) % RNG_CONFIG.lcgM;
      return state / RNG_CONFIG.lcgM;
    },
  };
}

/**
 * Fisher-Yates shuffle with seeded RNG
 * Always produces same order for given seed
 */
export function shuffleDeck<T extends { instanceId: string }>(
  deck: T[],
  seed: number,
): T[] {
  const shuffled = [...deck]; // Copy array
  const rng = createRng(seed);

  // Fisher-Yates algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Draw top card from deck
 * Removes from deck and returns card
 * @returns The top card or null if deck empty
 */
export function drawTopCard<T>(deck: T[]): T | null {
  return deck.length > 0 ? deck.pop() ?? null : null;
}

/**
 * Draw multiple cards from top of deck
 */
export function drawMultipleCards<T>(deck: T[], count: number): T[] {
  const drawn: T[] = [];
  for (let i = 0; i < count && deck.length > 0; i++) {
    const card = drawTopCard(deck);
    if (card) drawn.push(card);
  }
  return drawn;
}

/**
 * Move card to bottom of deck
 */
export function moveToBottom<T>(deck: T[], card: T): void {
  const index = deck.indexOf(card);
  if (index !== -1) {
    deck.splice(index, 1);
  }
  deck.unshift(card); // Add to bottom
}

/**
 * Reshuffle portion of deck (e.g., mulligan)
 * Combines cards back into deck and reshuffles with new seed
 */
export function reshuffleDeck<T>(
  deck: T[],
  cardsToShuffle: T[],
  newSeed: number,
): T[] {
  // Combine both parts
  const combined = [...deck, ...cardsToShuffle];

  // Reshuffle
  return shuffleDeck(combined, newSeed);
}

/**
 * Get the current top card without removing it
 */
export function peekTopCard<T>(deck: T[]): T | null {
  return deck.length > 0 ? deck[deck.length - 1] : null;
}

/**
 * Get deck size
 */
export function getDeckSize<T>(deck: T[]): number {
  return deck.length;
}

/**
 * Get seed from saved game state string
 * Format: "seed-${timestamp}-${deckId}-${randomComponent}"
 */
export function parseSeedString(seedString: string): GameSeed | null {
  const match = seedString.match(/^seed-(\d+)-(.+?)-(\d+)$/);
  if (!match) return null;

  return {
    timestamp: parseInt(match[1], 10),
    deckId: match[2],
    randomComponent: parseInt(match[3], 10),
    value: 0, // Will be recalculated
  };
}

/**
 * Convert seed to string for storage
 */
export function seedToString(seed: GameSeed): string {
  return `seed-${seed.timestamp}-${seed.deckId}-${seed.randomComponent}`;
}

/**
 * Verify shuffle reproducibility
 * Unit test helper - verifies that same seed produces same shuffle
 */
export function verifyShuffle<T extends { instanceId: string }>(
  deck: T[],
  seed: number,
): boolean {
  const shuffle1 = shuffleDeck(deck, seed);
  const shuffle2 = shuffleDeck(deck, seed);

  if (shuffle1.length !== shuffle2.length) return false;

  for (let i = 0; i < shuffle1.length; i++) {
    if (shuffle1[i].instanceId !== shuffle2[i].instanceId) {
      return false;
    }
  }

  return true;
}

/**
 * Example usage and test
 */
export function testDeterministicShuffle(): void {
  // Create a simple test deck
  const testDeck = Array.from({ length: 60 }, (_, i) => ({
    instanceId: `card-${i}`,
  }));

  // Create seed
  const seed = createSeed('test-deck-001');
  console.log('Created seed:', seed.value);

  // Shuffle with seed
  const shuffled1 = shuffleDeck(testDeck, seed.value);
  console.log('First shuffle top 5:', shuffled1.slice(-5).map((c) => c.instanceId));

  // Shuffle again with same seed
  const shuffled2 = shuffleDeck(testDeck, seed.value);
  console.log('Second shuffle top 5:', shuffled2.slice(-5).map((c) => c.instanceId));

  // Verify they're identical
  const same = shuffled1.every((c, i) => c.instanceId === shuffled2[i].instanceId);
  console.log('Both shuffles identical:', same); // Should be true

  // Draw from shuffled deck
  const drawn: typeof testDeck = [];
  const deckCopy = [...shuffled1];
  for (let i = 0; i < 7; i++) {
    const card = drawTopCard(deckCopy);
    if (card) drawn.push(card);
  }
  console.log('Drew 7 cards:', drawn.map((c) => c.instanceId));
  console.log('Deck after draw:', deckCopy.length); // Should be 53

  // Different seed produces different shuffle
  const differentSeed = createSeed('different-deck');
  const shuffled3 = shuffleDeck(testDeck, differentSeed.value);
  const different = shuffled1.some((c, i) => c.instanceId !== shuffled3[i].instanceId);
  console.log('Different seed produces different shuffle:', different); // Should be true
}
