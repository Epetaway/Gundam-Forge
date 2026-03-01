/**
 * Game Start Flow Component
 * Orchestrates the full game initialization sequence:
 * 1. Coin flip (heads/tails for first player)
 * 2. Shuffle deck with animation
 * 3. Draw opening hand (7 cards)
 * 4. Mulligan option
 * 5. Shield placement (face-down)
 * 6. Game ready to play
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ShuffleIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
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
  onCoinFlipResult: (isHeads: boolean) => void;
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
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
  const [selectedMulliganCards, setSelectedMulliganCards] = useState<Set<number>>(new Set());
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* PHASE 1: Coin Flip */}
        {phase === 'coinFlip' && (
          <CoinFlipModal
            key="coinFlip"
            playerId={playerId}
            opponentId={opponentId}
            onResult={(isHeads) => {
              setCoinResult(isHeads ? 'heads' : 'tails');
              onCoinFlipResult(isHeads);
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
          <MulliganModal
            key="mulligan"
            handCards={handCards}
            cardDatabase={cardDatabase}
            selectedCards={selectedMulliganCards}
            onSelectCard={(index) => {
              const newSet = new Set(selectedMulliganCards);
              if (newSet.has(index)) {
                newSet.delete(index);
              } else {
                newSet.add(index);
              }
              setSelectedMulliganCards(newSet);
            }}
            onConfirm={() => {
              onMulliganCards?.(Array.from(selectedMulliganCards));
              setSelectedMulliganCards(new Set());
            }}
            onSkip={() => onMulliganSkip?.()}
          />
        )}

        {/* PHASE 5: Shield Placement */}
        {phase === 'shields' && (
          <ShieldSetupModal
            key="shields"
            onComplete={onShieldsPlaced}
            disableAnimations={disableAnimations}
          />
        )}

        {/* PHASE 6: Ready to Play */}
        {phase === 'ready' && (
          <ReadyToPlayModal
            key="ready"
            firstPlayer={coinResult === 'heads' ? playerId : opponentId}
            playerId={playerId}
            onStartGame={() => {
              setGameStarted(true);
              onGameReady?.();
            }}
            disableAnimations={disableAnimations}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Coin Flip Modal
 */
function CoinFlipModal({
  playerId,
  opponentId,
  onResult,
  disableAnimations,
}: {
  playerId: string;
  opponentId: string;
  onResult: (isHeads: boolean) => void;
  disableAnimations: boolean;
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);

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

  const handleResults = (isHeads: boolean) => {
    onResult(isHeads);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/50 rounded-lg p-8 text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 font-display">Coin Flip</h2>
        <p className="text-slate-400 text-sm mb-8">
          Determine who plays first
        </p>

        {/* Coin Display */}
        <div className="mb-8 flex items-center justify-center">
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-6xl font-bold text-yellow-900 border-4 border-yellow-400 shadow-2xl"
            animate={{
              rotateY: isFlipping ? 720 : result ? 0 : 0,
              rotateX: isFlipping ? 360 : 0,
            }}
            transition={{
              duration: disableAnimations ? 0.1 : 1.5,
              type: 'spring',
            }}
          >
            {result === 'heads' ? 'H' : result === 'tails' ? 'T' : '?'}
          </motion.div>
        </div>

        {/* Flip Button */}
        <Button
          onClick={handleFlip}
          disabled={isFlipping}
          size="lg"
          className="mb-6 w-full"
          variant={isFlipping ? 'outline' : 'default'}
        >
          {isFlipping ? 'Flipping...' : 'Flip Coin'}
        </Button>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
            >
              <p className="text-slate-300 text-sm mb-4">
                {result === 'heads'
                  ? `${playerId} plays first`
                  : `${opponentId} plays first`}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleResults(result === 'heads')}
                  variant="default"
                  size="sm"
                >
                  Continue
                </Button>
                <Button
                  onClick={handleFlip}
                  variant="outline"
                  size="sm"
                >
                  Flip Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players */}
        <div className="grid grid-cols-2 gap-4 text-sm mt-8">
          <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
            <p className="text-slate-400 text-xs uppercase mb-1">Player</p>
            <p className="text-white font-semibold">{playerId}</p>
          </div>
          <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
            <p className="text-slate-400 text-xs uppercase mb-1">Opponent</p>
            <p className="text-white font-semibold">{opponentId}</p>
          </div>
        </div>
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
        <h2 className="text-3xl font-bold text-white mb-8 font-display">
          Shuffling Deck
        </h2>

        {/* Shuffling Animation */}
        <div className="mb-8">
          <motion.div
            animate={{ rotate: shuffling ? 360 : 0, scale: shuffling ? 1 : 1 }}
            transition={{
              duration: 0.6,
              repeat: shuffling ? Infinity : 0,
              ease: 'linear',
            }}
            className="w-24 h-32 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-xl"
          >
            <ShuffleIcon size={48} className="text-white" />
          </motion.div>
        </div>

        <motion.div
          animate={{ opacity: shuffling ? 1 : 0 }}
          className="text-slate-400 text-sm"
        >
          Randomizing deck order...
        </motion.div>

        {!shuffling && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-green-900/30 border border-green-600 rounded-lg"
          >
            <p className="text-green-300 font-semibold">Deck shuffled successfully</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Draw Phase Modal
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

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setDrawn(count);
      if (count >= cardCount) {
        clearInterval(interval);
        setTimeout(() => onComplete(), 500);
      }
    }, disableAnimations ? 10 : 200);

    return () => clearInterval(interval);
  }, [cardCount, onComplete, disableAnimations]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-lg p-8 text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-8 font-display">
          Drawing Opening Hand
        </h2>

        {/* Card Draw Counter */}
        <div className="mb-8">
          <div className="flex justify-center gap-2">
            {Array.from({ length: cardCount }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: i < drawn ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-12 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-cyan-300"
              />
            ))}
          </div>
        </div>

        <p className="text-slate-300 text-lg font-semibold mb-2">
          {drawn} / {cardCount} cards drawn
        </p>
        <p className="text-slate-400 text-sm">
          Setting up your opening hand...
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Mulligan Modal
 */
function MulliganModal({
  handCards,
  cardDatabase,
  selectedCards,
  onSelectCard,
  onConfirm,
  onSkip,
}: {
  handCards: CardInstance[];
  cardDatabase: Record<string, any>;
  selectedCards: Set<number>;
  onSelectCard: (index: number) => void;
  onConfirm: () => void;
  onSkip: () => void;
}) {
  return (
    <Dialog open={true}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mulligan Option</DialogTitle>
          <DialogDescription>
            Select cards to put back (shuffle back into deck and redraw). Leave blank to keep opening hand.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-7 gap-3 my-6">
          {handCards.map((card, index) => {
            const cardData = cardDatabase[card.cardId];
            const isSelected = selectedCards.has(index);

            return (
              <motion.button
                key={index}
                onClick={() => onSelectCard(index)}
                className={`aspect-[5/7] rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-red-500 ring-2 ring-red-400 scale-105'
                    : 'border-slate-600 hover:border-slate-400'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cardData ? (
                  <img
                    src={cardData.imageUrl || cardData.placeholderArt}
                    alt={cardData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-400">
                    ?
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                    <span className="text-white font-bold">×</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onSkip}
            variant="outline"
            className="flex-1"
          >
            Keep Hand
          </Button>
          <Button
            onClick={onConfirm}
            disabled={selectedCards.size === 0}
            className="flex-1"
          >
            Mulligan {selectedCards.size} Card{selectedCards.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Shield Setup Modal
 */
function ShieldSetupModal({
  onComplete,
  disableAnimations,
}: {
  onComplete: () => void;
  disableAnimations: boolean;
}) {
  const [shieldsPlaced, setShieldsPlaced] = useState(0);
  const targetShields = 5;

  useEffect(() => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setShieldsPlaced(count);
      if (count >= targetShields) {
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
        <h2 className="text-3xl font-bold text-white mb-8 font-display">
          Placing Shields
        </h2>

        {/* Shield Display */}
        <div className="mb-8">
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: targetShields }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: i < shieldsPlaced ? 1 : 0, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-12 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 border-2 border-purple-300 flex items-center justify-center text-white font-bold"
              >
                {i + 1}
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-slate-300 text-lg font-semibold mb-2">
          {shieldsPlaced} / {targetShields} shields placed face-down
        </p>
        <p className="text-slate-400 text-sm">
          These will protect your base from damage
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Ready to Play Modal
 */
function ReadyToPlayModal({
  firstPlayer,
  playerId,
  onStartGame,
  disableAnimations,
}: {
  firstPlayer: string;
  playerId: string;
  onStartGame: () => void;
  disableAnimations: boolean;
}) {
  const isPlayerFirst = firstPlayer === playerId;

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

        <h2 className="text-3xl font-bold text-white mb-4 font-display">
          Ready to Play!
        </h2>

        <p className="text-slate-300 text-lg mb-6">
          {isPlayerFirst ? 'You play first!' : 'Opponent plays first'}
        </p>

        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <ul className="text-left text-slate-300 text-sm space-y-2">
            <li>✓ Deck shuffled</li>
            <li>✓ Opening hand drawn</li>
            <li>✓ Shields placed (×5)</li>
            <li>✓ All rules in effect</li>
          </ul>
        </div>

        <Button
          onClick={onStartGame}
          size="lg"
          className="w-full"
        >
          <Zap size={20} className="mr-2" />
          Start Game
        </Button>
      </div>
    </motion.div>
  );
}
