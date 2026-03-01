'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameState } from '@/lib/game/game-engine';

interface PlaytestActionPanelProps {
  gameState: GameState;
  onAction?: (actionType: string, payload?: Record<string, unknown>) => void;
  botAutoplay?: boolean;
  onToggleBotAutoplay?: () => void;
  onBotStep?: () => void;
  canBotStep?: boolean;
}

export default function PlaytestActionPanel({
  gameState,
  onAction,
  botAutoplay = false,
  onToggleBotAutoplay,
  onBotStep,
  canBotStep = false,
}: PlaytestActionPanelProps) {
  const currentPlayer = gameState.players[gameState.activePlayerId];
  const opponentId = useMemo(
    () => Object.keys(gameState.players).find((id) => id !== gameState.activePlayerId),
    [gameState.players, gameState.activePlayerId],
  );
  const opponentPlayer = opponentId ? gameState.players[opponentId] : undefined;

  const readyAttackers = useMemo(
    () => currentPlayer.battleArea.filter((unit) => unit.state === 'ready'),
    [currentPlayer.battleArea],
  );
  const readyBlockers = useMemo(
    () => opponentPlayer?.battleArea.filter((unit) => unit.state === 'ready') ?? [],
    [opponentPlayer?.battleArea],
  );

  const [selectedAttacker, setSelectedAttacker] = useState<string>('');
  const [selectedBlocker, setSelectedBlocker] = useState<string>('');

  useEffect(() => {
    if (readyAttackers.length === 0) {
      setSelectedAttacker('');
      return;
    }

    if (!readyAttackers.some((unit) => unit.instanceId === selectedAttacker)) {
      setSelectedAttacker(readyAttackers[0].instanceId);
    }
  }, [readyAttackers, selectedAttacker]);

  useEffect(() => {
    if (readyBlockers.length === 0) {
      setSelectedBlocker('');
      return;
    }

    if (!readyBlockers.some((unit) => unit.instanceId === selectedBlocker)) {
      setSelectedBlocker(readyBlockers[0].instanceId);
    }
  }, [readyBlockers, selectedBlocker]);

  const handleAction = (actionType: string, payload?: Record<string, unknown>) => {
    onAction?.(actionType, payload);
  };

  const handlePlayCard = () => {
    if (!currentPlayer.hand.length) return;
    handleAction('PLAY_CARD', { cardInstanceId: currentPlayer.hand[0].instanceId });
  };

  const handleDeclareAttack = () => {
    if (!selectedAttacker || !opponentId) return;

    handleAction('DECLARE_ATTACK', {
      attackerInstanceIds: [selectedAttacker],
      attackerInstanceId: selectedAttacker,
      attackerPlayerId: gameState.activePlayerId,
      defenderPlayerId: opponentId,
      target: opponentPlayer && opponentPlayer.shields.length > 0 ? 'shield' : 'base',
    });
  };

  const handleDeclareBlock = () => {
    if (!selectedAttacker || !selectedBlocker || !opponentId) return;

    handleAction('DECLARE_BLOCK', {
      defenderId: opponentId,
      attackerPlayerId: gameState.activePlayerId,
      attackerInstanceId: selectedAttacker,
      blockerId: selectedBlocker,
    });
  };

  const handleResolveCombat = () => {
    if (!selectedAttacker || !opponentId) return;

    handleAction('RESOLVE_COMBAT', {
      attackerPlayerId: gameState.activePlayerId,
      defenderPlayerId: opponentId,
      attackerInstanceId: selectedAttacker,
      blockerInstanceIds: selectedBlocker ? [selectedBlocker] : [],
      target: opponentPlayer && opponentPlayer.shields.length > 0 ? 'shield' : 'base',
    });
  };

  const combatResult = gameState.currentCombat?.result;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h3 className="font-semibold mb-4 text-slate-300">Actions</h3>

      <div className="mb-4 space-y-2">
        <label className="block text-xs font-semibold text-slate-400">Attacker</label>
        <select
          value={selectedAttacker}
          onChange={(event) => setSelectedAttacker(event.target.value)}
          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-sm text-slate-200"
          disabled={readyAttackers.length === 0}
        >
          {readyAttackers.length === 0 ? (
            <option value="">No ready attackers</option>
          ) : (
            readyAttackers.map((unit) => (
              <option key={unit.instanceId} value={unit.instanceId}>
                {unit.cardId}
              </option>
            ))
          )}
        </select>

        <label className="block text-xs font-semibold text-slate-400">Blocker (Opponent)</label>
        <select
          value={selectedBlocker}
          onChange={(event) => setSelectedBlocker(event.target.value)}
          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-sm text-slate-200"
          disabled={readyBlockers.length === 0}
        >
          {readyBlockers.length === 0 ? (
            <option value="">No ready blockers</option>
          ) : (
            readyBlockers.map((unit) => (
              <option key={unit.instanceId} value={unit.instanceId}>
                {unit.cardId}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Draw Card */}
        <button
          onClick={() => handleAction('DRAW')}
          disabled={gameState.phase !== 'draw' || currentPlayer.deck.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Draw Card
        </button>

        {/* Play Card */}
        <button
          onClick={handlePlayCard}
          disabled={gameState.phase !== 'main' || currentPlayer.hand.length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Play Card
        </button>

        {/* Declare Attack */}
        <button
          onClick={handleDeclareAttack}
          disabled={gameState.phase !== 'main' || !selectedAttacker}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Declare Attack
        </button>

        {/* Activate Ability */}
        <button
          onClick={() => handleAction('ACTIVATE_ABILITY')}
          disabled={gameState.phase !== 'main' && gameState.phase !== 'action'}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Activate Ability
        </button>

        {/* Pair Pilot */}
        <button
          onClick={() => handleAction('PAIR_PILOT', { mode: 'pair' })}
          disabled={gameState.phase !== 'main' || currentPlayer.battleArea.length < 2}
          className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Pair Pilot
        </button>

        {/* Link Pilot */}
        <button
          onClick={() => handleAction('PAIR_PILOT', { mode: 'link' })}
          disabled={gameState.phase !== 'main' || currentPlayer.battleArea.length < 2}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Link Pilot
        </button>

        {/* Declare Block */}
        <button
          onClick={handleDeclareBlock}
          disabled={gameState.phase !== 'battle' || !selectedAttacker || !selectedBlocker}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Declare Block
        </button>

        {/* Resolve Combat */}
        <button
          onClick={handleResolveCombat}
          disabled={gameState.phase !== 'battle' || !selectedAttacker}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Resolve Combat
        </button>

        {/* Resolve Trigger */}
        <button
          onClick={() =>
            gameState.stack.length > 0 &&
            handleAction('RESOLVE_TRIGGER', { triggerId: gameState.stack[0].id, chooseResolve: true })
          }
          disabled={gameState.stack.length === 0}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Resolve Trigger
        </button>

        {/* Resolve All Triggers */}
        <button
          onClick={() => handleAction('RESOLVE_ALL_TRIGGERS')}
          disabled={gameState.stack.length === 0}
          className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Resolve All Triggers
        </button>

        <button
          onClick={() => onBotStep?.()}
          disabled={!canBotStep}
          className="px-4 py-2 bg-fuchsia-700 hover:bg-fuchsia-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition"
        >
          Bot Step
        </button>

        <button
          onClick={onToggleBotAutoplay}
          className="px-4 py-2 bg-fuchsia-900 hover:bg-fuchsia-800 text-white rounded font-medium transition"
        >
          {botAutoplay ? 'Autoplay: On' : 'Autoplay: Off'}
        </button>

        {/* End Phase */}
        <button
          onClick={() => handleAction('ADVANCE_PHASE')}
          disabled={gameState.phase === 'gameOver'}
          className="px-4 py-2 col-span-1 sm:col-span-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded font-medium transition"
        >
          End Phase ({gameState.phase})
        </button>
      </div>

      {combatResult && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-1">
          <p className="text-xs font-semibold text-slate-400">Combat Result</p>
          <p className="text-xs text-slate-300">Attacker Damage: {combatResult.attackerDamage}</p>
          <p className="text-xs text-slate-300">Shield Damage: {combatResult.shieldDamage || 0}</p>
          <p className="text-xs text-slate-300">Base Damage: {combatResult.baseDamage || 0}</p>
          {Array.isArray(combatResult.revealedShieldIds) && combatResult.revealedShieldIds.length > 0 && (
            <p className="text-xs text-slate-300">
              Revealed Shields: {combatResult.revealedShieldIds.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Rules Trace */}
      {gameState.log.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs font-semibold text-slate-400 mb-2">Last Action (Rules Trace)</p>
          <p className="text-xs bg-slate-900 rounded p-2 text-slate-300">
            {gameState.log[gameState.log.length - 1].rulesTrace}
          </p>
        </div>
      )}
    </div>
  );
}
