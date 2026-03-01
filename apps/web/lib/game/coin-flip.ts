/**
 * Coin Flip Module
 * Decides who plays first using fair coin flip logic
 */

import { COIN_FLIP } from './rules-constants';

export type CoinFace = 'heads' | 'tails';

export interface CoinFlipResult {
  timestamp: number;
  face: CoinFace;
  firstPlayer: 'player' | 'opponent';
  flipped: boolean; // Was it actually flipped (true) or manually set (false)?
  message: string;
}

/**
 * Perform a fair coin flip
 * Returns result with who plays first
 */
export function performCoinFlip(): CoinFlipResult {
  const timestamp = Date.now();
  const face = Math.random() < 0.5 ? 'heads' : 'tails';
  const firstPlayer = face === 'heads' ? COIN_FLIP.heads : COIN_FLIP.tails;

  return {
    timestamp,
    face,
    firstPlayer: firstPlayer as 'player' | 'opponent',
    flipped: true,
    message: `Coin flip: ${face.toUpperCase()}. ${
      firstPlayer === 'player' ? 'You go first!' : 'Opponent goes first.'
    }`,
  };
}

/**
 * Manual coin selection (for testing)
 * Allows specifying the result without random
 */
export function selectCoinFace(face: CoinFace): CoinFlipResult {
  const timestamp = Date.now();
  const firstPlayer = face === 'heads' ? COIN_FLIP.heads : COIN_FLIP.tails;

  return {
    timestamp,
    face,
    firstPlayer: firstPlayer as 'player' | 'opponent',
    flipped: false,
    message: `Coin selection: ${face.toUpperCase()} (manual). ${
      firstPlayer === 'player' ? 'You go first!' : 'Opponent goes first.'
    }`,
  };
}

/**
 * Choose which player goes first directly
 * Useful for testing and debugging
 */
export function chooseFirstPlayer(player: 'player' | 'opponent'): CoinFlipResult {
  const timestamp = Date.now();
  const face = player === 'player' ? 'heads' : 'tails';

  return {
    timestamp,
    face,
    firstPlayer: player,
    flipped: false,
    message: `First player selected: ${player === 'player' ? 'You' : 'Opponent'} goes first (manual).`,
  };
}

/**
 * Get who plays first based on result
 */
export function getFirstPlayer(result: CoinFlipResult): 'player1' | 'player2' {
  return result.firstPlayer === 'player' ? 'player1' : 'player2';
}

/**
 * Get opponent player ID
 */
export function getSecondPlayer(result: CoinFlipResult): 'player1' | 'player2' {
  return result.firstPlayer === 'player' ? 'player2' : 'player1';
}

/**
 * Format coin flip result for display
 */
export function formatCoinFlipResult(result: CoinFlipResult): string {
  let text = '== COIN FLIP ==\n';
  text += `Result: ${result.face.toUpperCase()}\n`;
  text += `First Player: ${result.firstPlayer}\n`;

  if (!result.flipped) {
    text += '(Manual selection - for testing)\n';
  }

  return text;
}

/**
 * Verify fair distribution of coin flips
 * Helper for testing - runs N flips and checks distribution
 */
export function testCoinFairness(trials: number = 1000): {
  heads: number;
  tails: number;
  fairness: number; // Percentage close to 50/50
} {
  let heads = 0;
  let tails = 0;

  for (let i = 0; i < trials; i++) {
    const result = performCoinFlip();
    result.face === 'heads' ? heads++ : tails++;
  }

  const headsPercent = (heads / trials) * 100;
  const fairness = Math.min(headsPercent, 100 - headsPercent); // Closest to 50%

  return {
    heads,
    tails,
    fairness,
  };
}
