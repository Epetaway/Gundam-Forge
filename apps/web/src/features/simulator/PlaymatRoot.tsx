import { OFFICIAL_PLAYMAT_ZONE_TEMPLATE } from '@gundam-forge/shared';
import {
  type GameCard,
  type GameState,
  getEffectiveAP,
  getEffectiveHP,
  getRemainingHP,
  getActivePlayer,
} from './simStore';

interface PlaymatRootProps {
  gameState: GameState;
  onCardClick: (card: GameCard) => void;
  onCardDoubleClick: (card: GameCard) => void;
  onZoneClick: (zoneId: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  Blue: 'border-blue-400',
  Red: 'border-red-400',
  Green: 'border-green-400',
  White: 'border-gray-200',
  Purple: 'border-purple-400',
  Colorless: 'border-gray-400',
};

function GameCardView({
  card,
  onClick,
  onDoubleClick,
  showStats,
  faceDown,
  small,
}: {
  card: GameCard;
  onClick: () => void;
  onDoubleClick: () => void;
  showStats?: boolean;
  faceDown?: boolean;
  small?: boolean;
}) {
  const def = card.definition;
  const imageSrc = def.imageUrl || def.placeholderArt;
  const colorBorder = COLOR_MAP[def.color] ?? 'border-gray-400';
  const isRested = !card.active;

  if (faceDown) {
    return (
      <div
        className={`relative flex-shrink-0 cursor-pointer rounded-lg border-2 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-900 shadow-md overflow-hidden ${
          small ? 'h-16 w-11' : 'h-20 w-14'
        }`}
        onClick={onClick}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full border border-gray-500 bg-gray-800 flex items-center justify-center">
            <span className="text-[7px] font-bold text-gray-400">GF</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex-shrink-0 cursor-pointer rounded-lg border-2 ${colorBorder} shadow-md overflow-hidden transition-transform ${
        small ? 'h-16 w-11' : 'h-20 w-14'
      } ${isRested ? 'opacity-70' : ''}`}
      style={{
        transform: isRested ? 'rotate(90deg)' : undefined,
        transformOrigin: 'center center',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={`${def.name} (${def.type}) - Cost: ${def.cost}`}
    >
      {imageSrc ? (
        <img src={imageSrc} alt={def.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col justify-between bg-gray-800 p-1">
          <p className="line-clamp-2 text-[7px] font-medium text-white leading-tight">{def.name}</p>
          <p className="text-[6px] text-gray-400">{def.type}</p>
        </div>
      )}

      {/* Cost badge */}
      <div className="absolute top-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[7px] font-bold text-white">
        {def.cost}
      </div>

      {/* Stats overlay for units */}
      {showStats && def.type === 'Unit' && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/80 px-1 py-0.5">
          <span className="text-[7px] font-bold text-yellow-400">{getEffectiveAP(card)}</span>
          <span className="text-[7px] font-bold text-red-400">
            {getRemainingHP(card)}/{getEffectiveHP(card)}
          </span>
        </div>
      )}

      {/* Paired pilot indicator */}
      {card.pairedPilot && (
        <div className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[6px] font-bold text-white" title={`Pilot: ${card.pairedPilot.definition.name}`}>
          P
        </div>
      )}

      {/* Link indicator */}
      {card.isLinked && (
        <div className="absolute top-5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-green-500 text-[5px] font-bold text-white" title="Linked!">
          L
        </div>
      )}

      {/* Damage counter */}
      {card.damage > 0 && (
        <div className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white shadow">
          -{card.damage}
        </div>
      )}
    </div>
  );
}

function ZoneLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="pointer-events-none absolute left-1.5 top-1 flex items-center gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-white/50">{label}</span>
      {count !== undefined && (
        <span className="text-[9px] font-bold text-white/40">({count})</span>
      )}
    </div>
  );
}

function getZoneCards(gameState: GameState, zoneId: string): { cards: GameCard[]; faceDown: boolean; showStats: boolean } {
  const player = gameState.players[0]; // Player is always index 0

  switch (zoneId) {
    case 'deck':
      return { cards: player.deck, faceDown: true, showStats: false };
    case 'resource-deck':
      return { cards: player.resourceDeck, faceDown: true, showStats: false };
    case 'battle':
      return { cards: player.battleArea, faceDown: false, showStats: true };
    case 'resource':
      return { cards: player.resourceArea, faceDown: false, showStats: false };
    case 'shields':
      return { cards: player.shieldArea.shields, faceDown: true, showStats: false };
    case 'base':
      return {
        cards: player.shieldArea.base ? [player.shieldArea.base] : [],
        faceDown: false,
        showStats: true,
      };
    case 'trash':
      return { cards: player.trash, faceDown: false, showStats: false };
    case 'removal':
      return { cards: player.removalArea, faceDown: false, showStats: false };
    default:
      return { cards: [], faceDown: false, showStats: false };
  }
}

export function PlaymatRoot({ gameState, onCardClick, onCardDoubleClick, onZoneClick }: PlaymatRootProps) {
  const player = getActivePlayer(gameState);

  return (
    <section className="rounded-xl overflow-hidden">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gradient-to-br from-playmat-surface to-playmat-felt border border-white/10">
        {OFFICIAL_PLAYMAT_ZONE_TEMPLATE.map((zone) => {
          const { cards, faceDown, showStats } = getZoneCards(gameState, zone.id);
          const isLargeZone = zone.id === 'battle' || zone.id === 'resource';

          return (
            <div
              key={zone.id}
              className="absolute rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/10 cursor-pointer"
              style={{
                left: `${zone.xPercent}%`,
                top: `${zone.yPercent}%`,
                width: `${zone.widthPercent}%`,
                height: `${zone.heightPercent}%`,
              }}
              onClick={() => onZoneClick(zone.id)}
            >
              <ZoneLabel
                label={zone.label}
                count={zone.id === 'deck' || zone.id === 'resource-deck' || zone.id === 'shields' || zone.id === 'trash'
                  ? cards.length
                  : undefined}
              />

              {/* Card rendering */}
              <div className={`flex h-full w-full items-center gap-1 p-2 pt-5 overflow-hidden ${
                isLargeZone ? 'flex-wrap' : ''
              }`}>
                {/* For pile zones (deck, resource-deck), show a single card back with count */}
                {(zone.id === 'deck' || zone.id === 'resource-deck') && cards.length > 0 && (
                  <div className="relative">
                    <div className="h-16 w-11 rounded-lg border-2 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-900 shadow-md flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-lg font-bold text-white">{cards.length}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* For other zones, show actual cards */}
                {zone.id !== 'deck' && zone.id !== 'resource-deck' && cards.map((card) => (
                  <GameCardView
                    key={card.instanceId}
                    card={card}
                    onClick={() => onCardClick(card)}
                    onDoubleClick={() => onCardDoubleClick(card)}
                    showStats={showStats}
                    faceDown={faceDown && card.faceDown}
                    small={zone.id === 'shields' || zone.id === 'trash' || zone.id === 'removal'}
                  />
                ))}

                {/* Base zone special: show base with HP */}
                {zone.id === 'base' && cards.length === 0 && (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-[10px] text-white/30">No Base</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
