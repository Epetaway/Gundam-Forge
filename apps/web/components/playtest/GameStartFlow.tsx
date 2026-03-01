/**
 * Game Start Flow Component
 * Orchestrates the full game initialization sequence:
 * 1. Coin flip (heads/tails) → winner chooses to go first or second
 * 2. Shuffle deck with animation
 * 3. Draw opening hand (5 cards)
 * 4. Mulligan option
 * 5. Shield placement (face-down, ×6 per 2025 rules)
 * 6. Game ready to play
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShuffleIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MulliganModal as SharedMulliganModal } from './MulliganModal';
import type { CardInstance } from '@/lib/game/game-engine';

export type GameStartPhase = 'coinFlip' | 'shuffle' | 'draw' | 'mulligan' | 'shields' | 'ready';

interface GameStartFlowProps {
  /** Current phase */
  phase: GameStartPhase;
  /** Player ID (for display) */
  playerId: string;
  /** Opponent ID (for display) */
  opponentId: string;
  /** Cards in hand after draw */
  handCards: CardInstance[];
  /** Card database for looking up details */
  cardDatabase: Record<string, any>;
  /** Callbacks */
  onCoinFlipResult: (isHeads: boolean, playerGoesFirst: boolean) => void;
  onShuffleComplete: () => void;
  onDrawComplete: () => void;
  onMulliganCards?: (cardIndices: number[]) => void;
  onMulliganSkip?: () => void;
  onShieldsPlaced?: () => void;
  onGameReady?: () => void;
  /** Disable animations for testing */
  disableAnimations?: boolean;
}

export function GameStartFlow({
  phase,
  playerId,
  opponentId,
  handCards,
  cardDatabase,
  onCoinFlipResult,
  onShuffleComplete,
  onDrawComplete,
  onMulliganCards,
  onMulliganSkip,
  onShieldsPlaced,
  onGameReady,
  disableAnimations = false,
}: GameStartFlowProps) {
  const [playerGoesFirst, setPlayerGoesFirst] = useState(true);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* PHASE 1: Coin Flip */}
        {phase === 'coinFlip' && (
          <CoinFlipModal
            key="coinFlip"
            playerId={playerId}
            opponentId={opponentId}
            onResult={(isHeads, goesFirst) => {
              setPlayerGoesFirst(goesFirst);
              onCoinFlipResult(isHeads, goesFirst);
            }}
            disableAnimations={disableAnimations}
          />
        )}

        {/* PHASE 2: Shuffle Deck */}
        {phase === 'shuffle' && (
          <ShuffleModal
            key="shuffle"
            onComplete={onShuffleComplete}
            disableAnimations={disableAnimations}
          />
        )}

        {/* PHASE 3: Draw Opening Hand */}
        {phase === 'draw' && (
          <DrawPhaseModal
            key="draw"
            cardCount={handCards.length}
            onComplete={onDrawComplete}
            disableAnimations={disableAnimations}
          />
        )}

        {/* PHASE 4: Mulligan Option */}
        {phase === 'mulligan' && (
          <SharedMulliganModal
            key="mulligan"
            hand={handCards}
            cardDatabase={cardDatabase}
            onMulliganAccept={() => onMulliganCards?.(handCards.map((_, index) => index))}
            onMulliganReject={() => onMulliganSkip?.()}
          />
        )}

        {/* PHASE 5: Shield Placement */}
        {phase === 'shields' && (
          <ShieldSetupModal
            key="shields"
            onComplete={onShieldsPlaced || (() => {})}
            disableAnimations={disableAnimations}
          />
        )}

        {/* PHASE 6: Ready to Play */}
        {phase === 'ready' && (
          <ReadyToPlayModal
            key="ready"
            playerGoesFirst={playerGoesFirst}
            playerId={playerId}
            opponentId={opponentId}
            onStartGame={() => onGameReady?.()}
            disableAnimations={disableAnimations}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Coin Flip Modal
 * After the flip, the winner chooses to go first or second.
 * If the opponent wins, they auto-choose first.
 */
function CoinFlipModal({
  playerId,
  opponentId,
  onResult,
  disableAnimations,
}: {
  playerId: string;
  opponentId: string;
  onResult: (isHeads: boolean, playerGoesFirst: boolean) => void;
  disableAnimations: boolean;
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  // heads = player1 won the flip
  const playerWon = result === 'heads';

  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setResult(null);

    setTimeout(() => {
      const isHeads = Math.random() > 0.5;
      setResult(isHeads ? 'heads' : 'tails');
      setIsFlipping(false);
    }, disableAnimations ? 100 : 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-md mx-auto w-full"
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/50 rounded-lg p-8 text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2">Coin Flip</h2>
        <p className="text-slate-400 text-sm mb-8">
          The winner chooses to go first or second
        </p>

        {/* Coin Display */}
        <div className="mb-8 flex items-center justify-center">
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-6xl font-bold text-yellow-900 border-4 border-yellow-400 shadow-2xl"
            animate={{
              rotateY: isFlipping ? 720 : 0,
              rotateX: isFlipping ? 360 : 0,
            }}
            transition={{ duration: disableAnimations ? 0.1 : 1.5, type: 'spring' }}
          >
            {result === 'heads' ? 'H' : result === 'tails' ? 'T' : '?'}
          </motion.div>
        </div>

        {/* Flip Button (shown before result) */}
        {!result && (
          <Button
            onClick={handleFlip}
            disabled={isFlipping}
            size="lg"
            className="w-full"
            variant={isFlipping ? 'secondary' : 'primary'}
          >
            {isFlipping ? 'Flipping...' : 'Flip Coin'}
          </Button>
        )}

        {/* Result + Choice */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Who won */}
              <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                <p className="text-white font-semibold">
                  {playerWon ? 'You won the flip!' : `${opponentId} won the flip!`}
                </p>
              </div>

              {/* Player won: give them the choice */}
              {playerWon && (
                <>
                  <p className="text-slate-300 text-sm">Choose your turn order:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => onResult(true, true)}
                      variant="primary"
                      size="sm"
                    >
                      Go First
                    </Button>
                    <Button
                      onClick={() => onResult(true, false)}
                      variant="secondary"
                      size="sm"
                    >
                      Go Second
                    </Button>
                  </div>
                </>
              )}

              {/* Opponent won: they auto-choose first */}
              {!playerWon && (
                <>
                  <p className="text-slate-400 text-sm">{opponentId} will go first.</p>
                  <Button
                    onClick={() => onResult(false, false)}
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    Continue
                  </Button>
                </>
              )}

              {/* Flip again option */}
              <button
                onClick={handleFlip}
                className="text-xs text-slate-500 hover:text-slate-300 underline transition"
              >
                Flip again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players */}
        {!result && (
          <div className="grid grid-cols-2 gap-4 text-sm mt-8">
            <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
              <p className="text-slate-400 text-xs uppercase mb-1">You</p>
              <p className="text-white font-semibold">{playerId}</p>
            </div>
            <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
              <p className="text-slate-400 text-xs uppercase mb-1">Opponent</p>
              <p className="text-white font-semibold">{opponentId}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Shuffle Deck Modal
 */
function ShuffleModal({
  onComplete,
  disableAnimations,
}: {
  onComplete: () => void;
  disableAnimations: boolean;
}) {
  const [shuffling, setShuffling] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShuffling(false);
      setTimeout(() => onComplete(), 500);
    }, disableAnimations ? 100 : 2000);

    return () => clearTimeout(timer);
  }, [onComplete, disableAnimations]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/50 rounded-lg p-8 text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-8">Shuffling Deck</h2>

        <div className="mb-8">
          <motion.div
            animate={{ rotate: shuffling ? 360 : 0 }}
            transition={{ duration: 0.6, repeat: shuffling ? Infinity : 0, ease: 'linear' }}
            className="w-24 h-32 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-xl"
          >
            <ShuffleIcon size={48} className="text-white" />
          </motion.div>
        </div>

        {shuffling ? (
          <p className="text-slate-400 text-sm">Randomizing deck order...</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-900/30 border border-green-600 rounded-lg"
          >
            <p className="text-green-300 font-semibold">Deck shuffled successfully</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Draw Phase Modal — animates drawing 5 cards
 */
function DrawPhaseModal({
  cardCount,
  onComplete,
  disableAnimations,
}: {
  cardCount: number;
  onComplete: () => void;
  disableAnimations: boolean;
}) {
  const [drawn, setDrawn] = useState(0);
  const total = Math.max(cardCount, 1); // guard against 0

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setDrawn(count);
      if (count >= total) {
        clearInterval(interval);
        setTimeout(() => onComplete(), 500);
      }
    }, disableAnimations ? 10 : 200);

    return () => clearInterval(interval);
  }, [total, onComplete, disableAnimations]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-lg p-8 text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-8">Drawing Opening Hand</h2>

        <div className="mb-8">
          <div className="flex justify-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: i < drawn ? 1 : 0.3, opacity: i < drawn ? 1 : 0.3 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-12 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-300"
              />
            ))}
          </div>
        </div>

        <p className="text-slate-300 text-lg font-semibold mb-2">
          {drawn} / {total} cards drawn
        </p>
        <p className="text-slate-400 text-sm">Setting up your opening hand...</p>
      </div>
    </motion.div>
  );
}

/**
 * Shield Setup Modal — places 6 shields face-down (2025 rules)
 */
function ShieldSetupModal({
  onComplete,
  disableAnimations,
}: {
  onComplete: () => void;
  disableAnimations: boolean;
}) {
  const [shieldsPlaced, setShieldsPlaced] = useState(0);
  const TARGET_SHIELDS = 6; // Official 2025 Gundam TCG

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setShieldsPlaced(count);
      if (count >= TARGET_SHIELDS) {
        clearInterval(interval);
        setTimeout(() => onComplete(), 500);
      }
    }, disableAnimations ? 10 : 300);

    return () => clearInterval(interval);
  }, [onComplete, disableAnimations]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/50 rounded-lg p-8 text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-8">Placing Shields</h2>

        <div className="mb-8">
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: TARGET_SHIELDS }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -90 }}
                animate={{
                  scale: i < shieldsPlaced ? 1 : 0.2,
                  rotate: 0,
                  opacity: i < shieldsPlaced ? 1 : 0.2,
                }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-12 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 border-2 border-purple-300 flex items-center justify-center text-white font-bold text-sm"
              >
                {i + 1}
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-slate-300 text-lg font-semibold mb-2">
          {shieldsPlaced} / {TARGET_SHIELDS} shields placed face-down
        </p>
        <p className="text-slate-400 text-sm">These will protect your base from damage</p>
      </div>
    </motion.div>
  );
}

/**
 * Ready to Play Modal
 */
function ReadyToPlayModal({
  playerGoesFirst,
  playerId,
  opponentId,
  onStartGame,
  disableAnimations,
}: {
  playerGoesFirst: boolean;
  playerId: string;
  opponentId: string;
  onStartGame: () => void;
  disableAnimations: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-green-500/50 rounded-lg p-8 text-center shadow-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-6xl mb-6"
        >
          ✓
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-4">Ready to Play!</h2>

        <p className="text-slate-300 text-lg mb-6">
          {playerGoesFirst
            ? 'You go first!'
            : `${opponentId} goes first`}
        </p>

        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600 text-left">
          <ul className="text-slate-300 text-sm space-y-2">
            <li>✓ Deck shuffled</li>
            <li>✓ Opening hand drawn (5 cards)</li>
            <li>✓ Shields placed (×6)</li>
            <li>✓ Turn order: <span className="text-white font-semibold">{playerGoesFirst ? playerId : opponentId}</span> goes first</li>
          </ul>
        </div>

        <Button onClick={onStartGame} size="lg" className="w-full">
          <Zap size={20} className="mr-2" />
          Start Game
        </Button>
      </div>
    </motion.div>
  );
}
