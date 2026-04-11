import { describe, expect, it } from 'vitest';
import { getPlaytesterAssistHint } from '@/lib/playtester/assist';

describe('playtester assist hints', () => {
  it('returns setup hint during setup phase', () => {
    expect(
      getPlaytesterAssistHint({
        isSetupPhase: true,
        isPlayerTurn: true,
        hasPendingTriggers: false,
        stackSize: 0,
        needsToDraw: false,
        needsToPlaceResource: false,
        phase: 'draw',
      }),
    ).toBe('Complete setup steps to begin turn flow.');
  });

  it('prioritizes trigger stack resolution', () => {
    expect(
      getPlaytesterAssistHint({
        isSetupPhase: false,
        isPlayerTurn: true,
        hasPendingTriggers: true,
        stackSize: 3,
        needsToDraw: false,
        needsToPlaceResource: false,
        phase: 'main',
      }),
    ).toBe('Resolve trigger stack (3) before committing new actions.');
  });

  it('returns draw and resource hints for player turn gates', () => {
    expect(
      getPlaytesterAssistHint({
        isSetupPhase: false,
        isPlayerTurn: true,
        hasPendingTriggers: false,
        stackSize: 0,
        needsToDraw: true,
        needsToPlaceResource: false,
        phase: 'draw',
      }),
    ).toBe('Priority action: draw your card to unlock phase progression.');

    expect(
      getPlaytesterAssistHint({
        isSetupPhase: false,
        isPlayerTurn: true,
        hasPendingTriggers: false,
        stackSize: 0,
        needsToDraw: false,
        needsToPlaceResource: true,
        phase: 'resource',
      }),
    ).toBe('Priority action: place a resource this turn before advancing.');
  });

  it('returns opponent and default progression hints', () => {
    expect(
      getPlaytesterAssistHint({
        isSetupPhase: false,
        isPlayerTurn: false,
        hasPendingTriggers: false,
        stackSize: 0,
        needsToDraw: false,
        needsToPlaceResource: false,
        phase: 'main',
      }),
    ).toBe('Opponent turn: observe board and plan your next line.');

    expect(
      getPlaytesterAssistHint({
        isSetupPhase: false,
        isPlayerTurn: true,
        hasPendingTriggers: false,
        stackSize: 0,
        needsToDraw: false,
        needsToPlaceResource: false,
        phase: 'end',
      }),
    ).toBe('Phase clear: evaluate attacks, then advance when ready.');
  });

  it('returns opponent trigger hint when stack is pending on opponent turn', () => {
    expect(
      getPlaytesterAssistHint({
        isSetupPhase: false,
        isPlayerTurn: false,
        hasPendingTriggers: true,
        stackSize: 2,
        needsToDraw: false,
        needsToPlaceResource: false,
        phase: 'combat',
      }),
    ).toBe('Opponent turn: waiting on trigger resolution.');
  });

  it('returns main phase sequencing hint when no gating conditions apply', () => {
    expect(
      getPlaytesterAssistHint({
        isSetupPhase: false,
        isPlayerTurn: true,
        hasPendingTriggers: false,
        stackSize: 0,
        needsToDraw: false,
        needsToPlaceResource: false,
        phase: 'main',
      }),
    ).toBe('Main phase: sequence plays before attacks to preserve flexibility.');
  });
});