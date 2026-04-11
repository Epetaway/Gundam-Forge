export interface PlaytesterAssistInput {
  isSetupPhase: boolean;
  isPlayerTurn: boolean;
  hasPendingTriggers: boolean;
  stackSize: number;
  needsToDraw: boolean;
  needsToPlaceResource: boolean;
  phase: string;
}

export function getPlaytesterAssistHint(input: PlaytesterAssistInput): string {
  if (input.isSetupPhase) {
    return 'Complete setup steps to begin turn flow.';
  }

  if (!input.isPlayerTurn) {
    return input.hasPendingTriggers
      ? 'Opponent turn: waiting on trigger resolution.'
      : 'Opponent turn: observe board and plan your next line.';
  }

  if (input.hasPendingTriggers) {
    return `Resolve trigger stack (${input.stackSize}) before committing new actions.`;
  }

  if (input.needsToDraw) {
    return 'Priority action: draw your card to unlock phase progression.';
  }

  if (input.needsToPlaceResource) {
    return 'Priority action: place a resource this turn before advancing.';
  }

  if (input.phase === 'main') {
    return 'Main phase: sequence plays before attacks to preserve flexibility.';
  }

  return 'Phase clear: evaluate attacks, then advance when ready.';
}