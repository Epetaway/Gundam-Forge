/**
 * Combat Display Component
 * Shows combat results with animation
 */

'use client';

import React from 'react';

interface CombatDisplayProps {
  combatResult: any;
}

export function CombatDisplay({ combatResult }: CombatDisplayProps) {
  if (!combatResult) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center pointer-events-auto">
      <div className="bg-slate-900 border-2 border-yellow-500 rounded-lg p-6 max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">Combat Result</h2>

        <div className="grid grid-cols-3 gap-4">
          {/* Attacker */}
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-2">Attacker</div>
            <div className="text-lg font-bold text-blue-400">
              {combatResult.attackerDamage || 0} DMG
            </div>
            {combatResult.attackerDestroyed && (
              <div className="text-red-500 text-sm mt-2">❌ Destroyed</div>
            )}
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="text-2xl font-bold text-slate-400">vs</div>
          </div>

          {/* Defender */}
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-2">Defender</div>
            <div className="text-lg font-bold text-red-400">
              {combatResult.defenderDamage || 0} DMG
            </div>
            {combatResult.defenderDestroyed && (
              <div className="text-red-500 text-sm mt-2">❌ Destroyed</div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 p-3 bg-slate-800 rounded text-sm text-slate-300 text-center">
          {combatResult.description || 'Combat resolved'}
        </div>

        {/* Special Keywords */}
        <div className="mt-3 flex gap-2 justify-center flex-wrap">
          {combatResult.attackerHasFirstStrike && (
            <span className="px-2 py-1 bg-purple-600 text-xs rounded">First Strike</span>
          )}
          {combatResult.attackerHasHighManeuver && (
            <span className="px-2 py-1 bg-orange-600 text-xs rounded">High-Maneuver</span>
          )}
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          Click anywhere to continue
        </div>
      </div>
    </div>
  );
}
