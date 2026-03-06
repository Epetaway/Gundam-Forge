/**
 * Game engine facade.
 * Runtime engine class comes from the shared package while local type exports
 * stay stable for existing app imports during Phase 15 migration.
 */

export { GameEngine } from '@gundam-forge/shared';
export { COLORLESS_TOKEN_DECK } from './token-decks';
export type {
  ZoneType,
  CardState,
  Phase,
  TriggerType,
  ActionType,
  TriggerEvent,
  CardInstance,
  PlayerState,
  GameLogEntry,
  GameState,
  GameAction,
  ActionValidation,
  CardDefinition,
  DeckDefinition,
} from './game-engine';
