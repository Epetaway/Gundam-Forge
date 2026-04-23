import React from 'react';

interface PlaytesterAssistBannerProps {
  turnNumber: number;
  isPlayerTurn: boolean;
  assistHint: string;
}

export function PlaytesterAssistBanner({ turnNumber, isPlayerTurn, assistHint }: PlaytesterAssistBannerProps): JSX.Element {
  return (
    <div className="mt-2 rounded-md border border-cyan-400/35 bg-cyan-950/35 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-200">Decision Assist</span>
        <span className="text-[10px] text-cyan-100/90">Turn {turnNumber} · {isPlayerTurn ? 'Your Priority' : 'Opponent Priority'}</span>
      </div>
      <p className="mt-1 text-xs text-slate-100">{assistHint}</p>
    </div>
  );
}