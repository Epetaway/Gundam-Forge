/**
 * Battlefield — Official Gundam TCG two-halves playmat layout
 *
 * Layout (top → bottom):
 *   [Targeting Banner] ← appears only when player is choosing attack target
 *   ─────────────────────────────────────────────────────
 *   OPPONENT HALF
 *     utility row:  name · HP · hand count · deck/trash piles
 *     resources:    horizontal strip (ready/rested)
 *     battle area:  flex row of portrait unit tiles (flex-1)
 *     shields+base: face-down shield row + base card  ← front line
 *   ─── Turn N · PHASE · Your/Opponent Turn ─────────────  (center divider)
 *   PLAYER HALF
 *     shields+base: base card + face-down shield row  ← front line
 *     battle area:  flex row of portrait unit tiles (flex-1)
 *     resources:    horizontal strip
 *     utility row:  deck/res-deck/trash piles · status message
 *   ─────────────────────────────────────────────────────
 *   HAND TRAY
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import { ShieldZone } from './zones/ShieldZone';
import { BattleZone } from './zones/BattleZone';
import { ResourceZone } from './zones/ResourceZone';
import { HandTray } from './HandTray';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BattlefieldProps {
  playerState: {
    playerId: string;
    name: string;
    hand: CardInstance[];
    deck: CardInstance[];
    discardPile: CardInstance[];
    battleArea: CardInstance[];
    shields: CardInstance[];
    base: CardInstance | null;
    resources: CardInstance[];
    resourceDeck: CardInstance[];
    exZone: { exBase?: CardInstance; exResources: CardInstance[] };
    baseHealth: number;
    maxBaseHealth: number;
  };
  opponentState: {
    playerId: string;
    name: string;
    hand: CardInstance[];
    deck: CardInstance[];
    discardPile: CardInstance[];
    battleArea: CardInstance[];
    shields: CardInstance[];
    base: CardInstance | null;
    resources: CardInstance[];
    baseHealth: number;
    maxBaseHealth: number;
  };
  isPlayerTurn: boolean;
  gameLog: any[];
  gamePhase: string;
  cardDatabase: Record<string, any>;
  selectedCard: CardInstance | null;
  turnNumber?: number;
  onUnitSelected?: (unit: CardInstance, isOpponent: boolean) => void;
  onCardPlayRequested?: (card: CardInstance) => void;
  onShieldDamaged?: (shieldCount: number) => void;
  onSelectCard?: (card: CardInstance) => void;
  onAttackDeclared?: (attackerInstanceId: string, targetInstanceId?: string) => void;
}

// ─── Inline helpers ────────────────────────────────────────────────────────────

/** Small face-down pile icon used in the utility rows (deck, trash, etc.) */
function ZonePile({
  label,
  count,
  accent,
}: {
  label: string;
  count: number;
  accent?: string;
}) {
  const accentColor = accent ?? 'rgba(71,85,105,0.5)';
  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <div
        className="flex items-center justify-center w-8 h-[44px] rounded text-[11px] font-bold"
        style={{
          border: `1px solid ${accentColor}`,
          background: 'rgba(15,23,42,0.6)',
          color: count > 0 ? '#cbd5e1' : '#334155',
          boxShadow: count > 0 ? `inset 0 0 8px ${accentColor}22` : 'none',
        }}
      >
        {count}
      </div>
      <span
        className="text-[8px] leading-none"
        style={{ color: 'rgba(71,85,105,0.7)' }}
      >
        {label}
      </span>
    </div>
  );
}

/** Compact portrait card — base card or placeholder */
function BaseCard({
  base,
  cardDatabase,
  baseHealth,
  maxBaseHealth,
  onHoverCardChange,
  onCardDoubleClick,
}: {
  base: CardInstance | null;
  cardDatabase: Record<string, any>;
  baseHealth: number;
  maxBaseHealth: number;
  onHoverCardChange?: (cardId: string | null) => void;
  onCardDoubleClick?: (cardId: string) => void;
}) {
  const card = base ? cardDatabase[base.cardId] : null;
  const hpPct =
    maxBaseHealth > 0 ? Math.max(0, (baseHealth / maxBaseHealth) * 100) : 0;
  const hpColor =
    hpPct > 50 ? '#10b981' : hpPct > 25 ? '#f59e0b' : '#ef4444';

  if (!base) {
    return (
      <div
        className="flex-shrink-0 rounded border-2 border-dashed flex items-center justify-center"
        style={{
          width: '50px',
          height: '70px',
          borderColor: 'rgba(71,85,105,0.25)',
        }}
      >
        <span className="text-[8px]" style={{ color: 'rgba(71,85,105,0.5)' }}>
          BASE
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 relative rounded-lg overflow-hidden border-2"
      style={{
        width: '50px',
        height: '70px',
        borderColor: 'rgba(52,211,153,0.35)',
        boxShadow: '0 2px 8px rgba(16,185,129,0.12)',
      }}
      title={`Base: ${card?.name ?? base.cardId} — HP:${baseHealth}/${maxBaseHealth}`}
      onMouseEnter={() => onHoverCardChange?.(base.cardId)}
      onMouseLeave={() => onHoverCardChange?.(null)}
      onDoubleClick={() => onCardDoubleClick?.(base.cardId)}
    >
      {card?.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name ?? ''}
          className="w-full h-full object-cover object-top"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background:
              'linear-gradient(160deg, rgba(6,78,59,0.6) 0%, rgba(15,23,42,0.9) 100%)',
          }}
        >
          <span
            className="text-[8px] font-bold"
            style={{ color: '#34d399' }}
          >
            BASE
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)',
        }}
      />

      {/* HP bar */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '3px', background: 'rgba(0,0,0,0.6)' }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
        />
      </div>

      {/* HP number */}
      <span
        className="absolute bottom-1 left-0 right-0 text-center text-[8px] font-bold"
        style={{ color: '#e2e8f0', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
      >
        {baseHealth}
      </span>
    </div>
  );
}

// ─── Status message ────────────────────────────────────────────────────────────

function getStatusMessage(isPlayerTurn: boolean, gamePhase: string): string {
  if (!isPlayerTurn) return 'Opponent is thinking…';
  switch (gamePhase) {
    case 'draw':
      return 'Draw Phase — click Draw Card';
    case 'resource':
      return 'Resource Phase — place a resource';
    case 'main':
      return 'Main Phase — play cards or attack';
    case 'end':
      return 'End Phase — click Next Phase →';
    default:
      return '';
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function Battlefield({
  playerState,
  opponentState,
  isPlayerTurn,
  gamePhase,
  cardDatabase,
  selectedCard,
  turnNumber,
  onUnitSelected,
  onCardPlayRequested,
  onShieldDamaged,
  onSelectCard,
  onAttackDeclared,
}: BattlefieldProps) {
  const [attackingUnit, setAttackingUnit] = useState<CardInstance | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [pinnedCardId, setPinnedCardId] = useState<string | null>(null);

  // Escape cancels targeting mode
  useEffect(() => {
    if (!attackingUnit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAttackingUnit(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [attackingUnit]);

  const isTargeting = !!attackingUnit;
  const previewCardId = pinnedCardId ?? hoveredCardId ?? selectedCard?.cardId ?? null;
  const previewCard = previewCardId ? cardDatabase[previewCardId] : null;

  const handleHoverCardChange = (cardId: string | null) => {
    setHoveredCardId(cardId);
  };

  const togglePinForCard = (cardId: string | null) => {
    if (!cardId) return;
    setPinnedCardId((prev) => (prev === cardId ? null : cardId));
  };

  const togglePreviewPin = () => {
    togglePinForCard(previewCardId);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'p') return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (previewCardId) {
        event.preventDefault();
        togglePinForCard(previewCardId);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewCardId]);

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 45%, #0a1835 0%, #050d1f 45%, #040814 100%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.22,
        }}
      />

      {previewCard && (
        <aside
          className="absolute right-3 top-14 z-30 hidden xl:flex w-52 flex-col rounded-xl border bg-slate-950/85 backdrop-blur-sm overflow-hidden"
          style={{ borderColor: 'rgba(56,189,248,0.35)', boxShadow: '0 10px 28px rgba(2,132,199,0.2)' }}
        >
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-cyan-300/20 bg-slate-900/80">
            <span className="text-[10px] uppercase tracking-wider text-cyan-200/90">
              {pinnedCardId ? 'Pinned Card' : 'Hover Preview'}
            </span>
            <button
              type="button"
              onClick={togglePreviewPin}
              className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-300/40 text-cyan-200 hover:bg-cyan-900/40 transition"
              title={pinnedCardId ? 'Unpin preview' : 'Pin this preview'}
            >
              {pinnedCardId ? 'Unpin' : 'Pin'}
            </button>
          </div>
          <div className="relative aspect-[5/7] w-full">
            {previewCard.imageUrl ? (
              <img src={previewCard.imageUrl} alt={previewCard.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-slate-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute left-2 right-2 bottom-2 text-[11px] font-semibold text-slate-100 truncate">
              {previewCard.name ?? previewCardId}
            </div>
          </div>
          <div className="px-2.5 py-2 text-[11px] text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-400">
              <span>{previewCard.type ?? 'Card'}</span>
              <span>{previewCard.color ?? 'Colorless'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="rounded bg-cyan-900/60 px-1.5 py-0.5">Cost {previewCard.cost ?? 0}</span>
              <span className="rounded bg-rose-900/40 px-1.5 py-0.5">AP {previewCard.ap ?? 0}</span>
              <span className="rounded bg-sky-900/40 px-1.5 py-0.5">HP {previewCard.hp ?? 0}</span>
            </div>
            {previewCard.text ? (
              <p className="line-clamp-4 leading-relaxed text-slate-300/90">{previewCard.text}</p>
            ) : (
              <p className="text-slate-500">No rules text</p>
            )}
            <p className="text-[10px] text-slate-500/90 border-t border-slate-700/60 pt-1">
              Tip: double-click any card or press P to pin this preview
            </p>
          </div>
        </aside>
      )}

      {previewCard && (
        <aside
          className="absolute right-2 top-14 z-30 xl:hidden w-44 rounded-lg border bg-slate-950/90 backdrop-blur-sm overflow-hidden"
          style={{ borderColor: 'rgba(56,189,248,0.3)', boxShadow: '0 8px 22px rgba(2,132,199,0.16)' }}
        >
          <div className="px-2 py-1.5 border-b border-cyan-300/20 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wide text-cyan-100/90">Card</span>
            <button
              type="button"
              onClick={togglePreviewPin}
              className="text-[9px] px-1 py-0.5 rounded border border-cyan-300/30 text-cyan-200"
            >
              {pinnedCardId ? 'Unpin' : 'Pin'}
            </button>
          </div>
          <div className="p-2 space-y-1.5">
            <div className="text-[10px] text-slate-100 font-semibold truncate">{previewCard.name ?? previewCardId}</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wide">{previewCard.type ?? 'Card'} · {previewCard.color ?? 'Colorless'}</div>
            <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-200">
              <span className="rounded bg-cyan-900/50 px-1 py-0.5 text-center">C {previewCard.cost ?? 0}</span>
              <span className="rounded bg-rose-900/35 px-1 py-0.5 text-center">A {previewCard.ap ?? 0}</span>
              <span className="rounded bg-sky-900/35 px-1 py-0.5 text-center">H {previewCard.hp ?? 0}</span>
            </div>
            <div className="text-[9px] text-slate-500/95 border-t border-slate-700/60 pt-1">
              Double-click card or press P to pin
            </div>
          </div>
        </aside>
      )}

      {/* ── TARGETING BANNER ─────────────────────────────────────── */}
      {isTargeting && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 py-1.5 z-20"
          style={{
            background: 'rgba(120,53,15,0.6)',
            borderBottom: '1px solid rgba(217,119,6,0.4)',
          }}
          role="status"
          aria-live="assertive"
        >
          <span
            className="text-xs font-bold uppercase tracking-wider whitespace-nowrap"
            style={{ color: '#fcd34d' }}
          >
            ⚔ Targeting
          </span>
          <span className="text-xs truncate" style={{ color: '#fde68a' }}>
            <strong>
              {cardDatabase[attackingUnit!.cardId]?.name ??
                attackingUnit!.cardId}
            </strong>
            {' '}— click an opponent unit or Attack Base
          </span>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="rounded px-2.5 py-1 text-xs font-semibold transition-colors"
              style={{
                border: '1px solid rgba(217,119,6,0.5)',
                background: 'rgba(146,64,14,0.4)',
                color: '#fde68a',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(146,64,14,0.7)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(146,64,14,0.4)';
              }}
              onClick={() => {
                onAttackDeclared?.(attackingUnit!.instanceId, undefined);
                setAttackingUnit(null);
              }}
            >
              Attack Base
            </button>
            <button
              type="button"
              className="rounded px-2 py-1 text-xs transition-colors"
              style={{ color: '#94a3b8' }}
              onClick={() => setAttackingUnit(null)}
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN FIELD ───────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col px-2 py-1 gap-0">

        {/* ═══ OPPONENT HALF ═════════════════════════════════════ */}
        <div
          className="flex-1 min-h-0 flex flex-col gap-1 rounded-t-xl px-3 py-1.5"
          style={{
            background: 'rgba(127,29,29,0.04)',
            border: '1px solid rgba(127,29,29,0.12)',
            borderBottom: 'none',
          }}
        >
          {/* Utility row */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
              style={{ color: 'rgba(252,165,165,0.5)' }}
            >
              {opponentState.name}
            </span>
            <span className="text-[9px]" style={{ color: 'rgba(100,116,139,0.6)' }}>
              HP {opponentState.baseHealth}/{opponentState.maxBaseHealth}
            </span>
            <span className="text-[9px]" style={{ color: 'rgba(71,85,105,0.5)' }}>
              · Hand: {opponentState.hand.length}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <ZonePile label="Deck" count={opponentState.deck.length} />
              <ZonePile label="Trash" count={opponentState.discardPile.length} />
            </div>
          </div>

          {/* Resources */}
          <div className="flex-shrink-0">
            <ResourceZone
              resources={opponentState.resources}
              cardDatabase={cardDatabase}
              isOpponent
              onHoverCardChange={handleHoverCardChange}
              onCardDoubleClick={togglePinForCard}
            />
          </div>

          {/* Battle area — flex-1 */}
          <div className="flex-1 min-h-0 flex items-center overflow-x-auto">
            <BattleZone
              units={opponentState.battleArea}
              cardDatabase={cardDatabase}
              isOpponent
              isTargeting={isTargeting}
              onUnitSelected={(unit) => {
                if (isTargeting) {
                  onAttackDeclared?.(attackingUnit!.instanceId, unit.instanceId);
                  setAttackingUnit(null);
                } else {
                  onUnitSelected?.(unit, true);
                }
              }}
              onHoverCardChange={handleHoverCardChange}
              onCardDoubleClick={togglePinForCard}
              gamePhase={gamePhase}
              isPlayerTurn={isPlayerTurn}
            />
          </div>

          {/* Shields + Base — front line (closest to center divider) */}
          <div className="flex-shrink-0 flex items-end gap-2 pb-1">
            <ShieldZone
              shields={opponentState.shields}
              cardDatabase={cardDatabase}
              isOpponent
              baseHealth={opponentState.baseHealth}
              maxBaseHealth={opponentState.maxBaseHealth}
            />
            <BaseCard
              base={opponentState.base}
              cardDatabase={cardDatabase}
              baseHealth={opponentState.baseHealth}
              maxBaseHealth={opponentState.maxBaseHealth}
              onHoverCardChange={handleHoverCardChange}
              onCardDoubleClick={togglePinForCard}
            />
          </div>
        </div>

        {/* ═══ CENTER DIVIDER ════════════════════════════════════ */}
        <div
          className="flex-shrink-0 flex items-center gap-3 py-1"
          style={{ minHeight: '28px' }}
        >
          <div
            className="flex-1 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(59,130,246,0.25), rgba(59,130,246,0.1))',
            }}
          />
          <div
            className="px-3 py-[3px] rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0"
            style={{
              border: '1px solid rgba(59,130,246,0.2)',
              background: 'rgba(15,25,60,0.65)',
              color: isPlayerTurn
                ? 'rgba(147,197,253,0.85)'
                : 'rgba(252,165,165,0.8)',
            }}
          >
            {turnNumber != null ? `Turn ${turnNumber} · ` : ''}
            {gamePhase.toUpperCase()} ·{' '}
            {isPlayerTurn ? 'Your Turn' : 'Opponent'}
          </div>
          {pinnedCardId && (
            <div
              className="px-2 py-[3px] rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0"
              style={{
                border: '1px solid rgba(34,211,238,0.45)',
                background: 'rgba(8,47,73,0.6)',
                color: 'rgba(186,230,253,0.95)',
              }}
              title="Pinned preview active (double-click card or press P to toggle)"
            >
              Pinned
            </div>
          )}
          <div
            className="flex-1 h-px"
            style={{
              background:
                'linear-gradient(to left, transparent, rgba(59,130,246,0.25), rgba(59,130,246,0.1))',
            }}
          />
        </div>

        {/* ═══ PLAYER HALF ═══════════════════════════════════════ */}
        <div
          className="flex-1 min-h-0 flex flex-col gap-1 rounded-b-xl px-3 py-1.5"
          style={{
            background: 'rgba(29,78,216,0.04)',
            border: '1px solid rgba(29,78,216,0.12)',
            borderTop: 'none',
          }}
        >
          {/* Shields + Base — front line (closest to center divider) */}
          <div className="flex-shrink-0 flex items-start gap-2 pt-1">
            <BaseCard
              base={playerState.base}
              cardDatabase={cardDatabase}
              baseHealth={playerState.baseHealth}
              maxBaseHealth={playerState.maxBaseHealth}
              onHoverCardChange={handleHoverCardChange}
              onCardDoubleClick={togglePinForCard}
            />
            <ShieldZone
              shields={playerState.shields}
              cardDatabase={cardDatabase}
              isOpponent={false}
              baseHealth={playerState.baseHealth}
              maxBaseHealth={playerState.maxBaseHealth}
              onDamaged={onShieldDamaged}
            />
          </div>

          {/* Battle area — flex-1 */}
          <div className="flex-1 min-h-0 flex items-center overflow-x-auto">
            <BattleZone
              units={playerState.battleArea}
              cardDatabase={cardDatabase}
              isOpponent={false}
              onUnitSelected={(unit) => {
                if (
                  isPlayerTurn &&
                  gamePhase === 'main' &&
                  unit.state === 'ready'
                ) {
                  setAttackingUnit(unit);
                } else {
                  onUnitSelected?.(unit, false);
                }
              }}
              gamePhase={gamePhase}
              isPlayerTurn={isPlayerTurn}
              attackingUnitId={attackingUnit?.instanceId}
              onHoverCardChange={handleHoverCardChange}
              onCardDoubleClick={togglePinForCard}
            />
          </div>

          {/* Resources */}
          <div className="flex-shrink-0">
            <ResourceZone
              resources={playerState.resources}
              cardDatabase={cardDatabase}
              isOpponent={false}
              onHoverCardChange={handleHoverCardChange}
              onCardDoubleClick={togglePinForCard}
            />
          </div>

          {/* Utility row */}
          <div className="flex-shrink-0 flex items-center gap-1.5 pb-0.5">
            <ZonePile
              label="Deck"
              count={playerState.deck.length}
              accent="rgba(59,130,246,0.35)"
            />
            <ZonePile
              label="Res.Deck"
              count={(playerState.resourceDeck ?? []).length}
              accent="rgba(6,182,212,0.35)"
            />
            <ZonePile
              label="Trash"
              count={playerState.discardPile.length}
              accent="rgba(239,68,68,0.25)"
            />
            <span
              className="ml-auto text-[10px] italic"
              style={{ color: 'rgba(100,116,139,0.6)' }}
            >
              {getStatusMessage(isPlayerTurn, gamePhase)}
            </span>
          </div>
        </div>
      </div>

      {/* ── HAND TRAY ────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-2 pt-1.5 pb-2"
        style={{ borderTop: '1px solid rgba(59,130,246,0.15)' }}
      >
        <div
          className="text-[9px] font-semibold uppercase mb-1 px-1"
          style={{ color: 'rgba(71,85,105,0.7)', letterSpacing: '0.05em' }}
        >
          Hand ({playerState.hand.length}/10)
        </div>
        <HandTray
          cards={playerState.hand}
          cardDatabase={cardDatabase}
          selectedCard={selectedCard}
          onSelectCard={onSelectCard ?? (() => {})}
          onPlayCard={onCardPlayRequested ?? (() => {})}
          gamePhase={gamePhase}
          isPlayerTurn={isPlayerTurn}
          onHoverCardChange={handleHoverCardChange}
          onCardDoubleClick={togglePinForCard}
        />
      </div>
    </div>
  );
}
