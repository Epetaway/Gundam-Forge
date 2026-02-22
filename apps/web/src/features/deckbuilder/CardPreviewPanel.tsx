import type { CardDefinition } from '@gundam-forge/shared';

interface CardPreviewPanelProps {
  card: CardDefinition | undefined;
}

function formatPrice(price: number | undefined): string {
  if (price === undefined) return 'N/A';
  return `$${price.toFixed(2)}`;
}

export function CardPreviewPanel({ card }: CardPreviewPanelProps) {
  if (!card) {
    return (
      <aside className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold">Technical Spec</h2>
        <p className="mt-3 text-sm text-slate-400">Select a card to inspect details and preview art.</p>
      </aside>
    );
  }

  // Use imageUrl if available, otherwise fall back to placeholderArt
  const imageSource = card.imageUrl || card.placeholderArt;

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-lg font-semibold">Technical Spec</h2>
      <div className="mt-4 space-y-3">
        {imageSource && (
          <img
            src={imageSource}
            alt={`${card.name} card art`}
            className="w-full rounded-md border border-slate-800 object-cover"
            loading="lazy"
          />
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="text-slate-400">Name</p>
          <p>{card.name}</p>
          <p className="text-slate-400">ID</p>
          <p>{card.id}</p>
          <p className="text-slate-400">Color</p>
          <p>{card.color}</p>
          <p className="text-slate-400">Cost</p>
          <p>{card.cost}</p>
          <p className="text-slate-400">Type</p>
          <p>{card.type}</p>
          <p className="text-slate-400">Set</p>
          <p>{card.set}</p>
          {card.power !== undefined && card.power > 0 && (
            <>
              <p className="text-slate-400">Power</p>
              <p>{card.power}</p>
            </>
          )}
        </div>

        {/* Pricing Section */}
        {card.price && (
          <div className="mt-4 rounded bg-slate-950 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase text-slate-300">Market Price</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {card.price.market !== undefined && (
                <>
                  <p className="text-slate-400">Market</p>
                  <p className="font-semibold text-green-400">{formatPrice(card.price.market)}</p>
                </>
              )}
              {card.price.low !== undefined && (
                <>
                  <p className="text-slate-400">Low</p>
                  <p>{formatPrice(card.price.low)}</p>
                </>
              )}
              {card.price.mid !== undefined && (
                <>
                  <p className="text-slate-400">Mid</p>
                  <p>{formatPrice(card.price.mid)}</p>
                </>
              )}
              {card.price.high !== undefined && (
                <>
                  <p className="text-slate-400">High</p>
                  <p>{formatPrice(card.price.high)}</p>
                </>
              )}
              {card.price.foil !== undefined && (
                <>
                  <p className="text-slate-400">Foil</p>
                  <p>{formatPrice(card.price.foil)}</p>
                </>
              )}
            </div>
          </div>
        )}

        {card.text && (
          <p className="rounded bg-slate-950 p-2 text-sm text-slate-300">{card.text}</p>
        )}
      </div>
    </aside>
  );
}
