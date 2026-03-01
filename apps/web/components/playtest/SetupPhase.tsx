/**
 * Setup Phase Component
 * Orchestrates the official 7-step setup sequence
 */

'use client';

import React, { useEffect, useState } from 'react';
import { GameEngine } from '@/lib/game/game-engine';
import { MulliganModal } from './MulliganModal';

interface SetupPhaseProps {
  engine: GameEngine;
  cardDatabase: Record<string, any>;
  onSetupComplete: () => void;
  onError: (error: string) => void;
}

const SETUP_STEPS = [
  { id: 'shuffle', label: 'Shuffling decks...', description: 'Randomizing cards with deterministic seed' },
  { id: 'draw', label: 'Drawing opening hand...', description: '5 cards drawn for each player' },
  { id: 'mulligan', label: 'Mulligan option...', description: 'Option to redraw hand one time' },
  { id: 'shields', label: 'Placing shields...', description: '6 shield cards placed face-down' },
  { id: 'base', label: 'Setting base...', description: 'Base health set to 20' },
  { id: 'coinflip', label: 'Coin flip...', description: 'Determining first player' },
  { id: 'ready', label: 'Game ready!', description: 'Ready to begin' },
];

export function SetupPhase({ engine, cardDatabase, onSetupComplete, onError }: SetupPhaseProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMulliganModal, setShowMulliganModal] = useState(false);
  const [mulliganInProgress, setMulliganInProgress] = useState(false);

  useEffect(() => {
    // CRITICAL: Execute DRAW actions during draw phase (step 1)
    if (currentStep === 1) {
      setIsAnimating(true);

      // Must advance to draw phase first (game starts in setup phase)
      if (engine.getState().phase === 'setup') {
        engine.executeAction({
          type: 'ADVANCE_PHASE',
          playerId: 'player1',
          timestamp: Date.now(),
        });
      }
      
      // Official 2025 Gundam TCG: Draw 5 cards for opening hand
      for (let i = 0; i < 5; i++) {
        engine.executeAction({
          type: 'DRAW',
          playerId: 'player1',
          timestamp: Date.now(),
        });
      }

      // Auto-advance after draw is complete
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsAnimating(false);
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Pause on mulligan step
    if (currentStep === 2 && !showMulliganModal) {
      setShowMulliganModal(true);
      return;
    }

    // Auto-advance through other steps
    if (currentStep < SETUP_STEPS.length && !showMulliganModal && currentStep !== 1) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsAnimating(false);

        if (currentStep === SETUP_STEPS.length - 1) {
          setTimeout(() => onSetupComplete(), 800);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentStep, onSetupComplete, showMulliganModal, engine]);

  const handleMulliganAccept = () => {
    setMulliganInProgress(true);
    const result = engine.executeAction({
      type: 'MULLIGAN',
      playerId: 'player1',
      timestamp: Date.now(),
    });

    if (!result.valid) {
      setMulliganInProgress(false);
      onError(result.error || 'Mulligan failed');
      return;
    }

    setTimeout(() => {
      setShowMulliganModal(false);
      setMulliganInProgress(false);
      setCurrentStep((prev) => prev + 1);
    }, 500);
  };

  const handleMulliganReject = () => {
    setMulliganInProgress(true);
    setTimeout(() => {
      setShowMulliganModal(false);
      setMulliganInProgress(false);
      setCurrentStep((prev) => prev + 1);
    }, 500);
  };

  return (
    <div className="flex items-center justify-center h-full">
      {/* Mulligan Modal */}
      {showMulliganModal && (
        <MulliganModal
          hand={engine.getState().players['player1'].hand}
          cardDatabase={cardDatabase}
          onMulliganAccept={handleMulliganAccept}
          onMulliganReject={handleMulliganReject}
          isLoading={mulliganInProgress}
        />
      )}

      <div className="max-w-md w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-4">Game Setup</h2>
          <p className="text-slate-400 text-center text-sm">
            Initializing Gundam TCG playtester with official rules...
          </p>
        </div>

        {/* Setup Steps */}
        <div className="space-y-3">
          {SETUP_STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                idx < currentStep
                  ? 'border-green-600 bg-green-900/30'
                  : idx === currentStep
                    ? 'border-purple-600 bg-purple-900/30'
                    : 'border-slate-700 bg-slate-900/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition ${
                    idx < currentStep
                      ? 'bg-green-600 text-white'
                      : idx === currentStep
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {idx < currentStep ? '✓' : idx + 1}
                </div>

                <div className="flex-grow">
                  <div className="font-semibold text-white">{step.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{step.description}</div>

                  {idx === currentStep && isAnimating && (
                    <div className="mt-2 flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / SETUP_STEPS.length) * 100}%` }}
            />
          </div>
          <div className="text-center text-xs text-slate-400 mt-2">
            {currentStep + 1} / {SETUP_STEPS.length}
          </div>
        </div>
      </div>
    </div>
  );
}
