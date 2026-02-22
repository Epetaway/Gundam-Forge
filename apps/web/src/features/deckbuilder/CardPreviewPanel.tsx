import type { CardDefinition } from '@gundam-forge/shared';

interface CardPreviewPanelProps {
  card: CardDefinition | undefined;
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

  return (
    <aside className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-lg font-semibold">Technical Spec</h2>
      <div className="mt-4 space-y-3">
        <img
          src={card.placeholderArt}
          alt={`${card.name} placeholder art`}
          className="w-full rounded-md border border-slate-800 object-cover"
          loading="lazy"
        />
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
        </div>
        <p className="rounded bg-slate-950 p-2 text-sm text-slate-300">{card.text ?? 'No text available.'}</p>
      </div>
    </aside>
  );
}
