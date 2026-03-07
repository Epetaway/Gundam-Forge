import type { PipelineTask } from './lib/pipeline';

const TSX_BIN = 'tsx';
const NODE_BIN = 'node';

export const PIPELINE_TASKS: PipelineTask[] = [
  {
    id: 'fetch-cards',
    description: 'Fetch cards from configured sources',
    command: TSX_BIN,
    args: ['scripts/fetch-cards.ts'],
  },
  {
    id: 'sync-official-cards',
    description: 'Sync official cards from source site',
    command: TSX_BIN,
    args: ['scripts/sync-official-cards.ts'],
  },
  {
    id: 'sync-cards-from-xlsx',
    description: 'Sync cards from XLSX source',
    command: TSX_BIN,
    args: ['scripts/sync-cards-from-xlsx.ts'],
  },
  {
    id: 'enrich-cards',
    description: 'Enrich card metadata',
    command: TSX_BIN,
    args: ['scripts/enrichCards.ts'],
  },
  {
    id: 'fetch-card-assets',
    description: 'Fetch card image assets',
    command: TSX_BIN,
    args: ['scripts/fetchCardAssets.ts'],
  },
  {
    id: 'fetch-hq-images',
    description: 'Fetch high-quality card images',
    command: TSX_BIN,
    args: ['scripts/fetch-hq-images.ts'],
  },
  {
    id: 'build-card-catalog',
    description: 'Build normalized card catalog',
    command: TSX_BIN,
    args: ['scripts/build-card-catalog.ts'],
  },
  {
    id: 'validate-cards',
    description: 'Validate cards payload',
    command: TSX_BIN,
    args: ['scripts/validate-cards.ts'],
  },
  {
    id: 'report-card-gaps',
    description: 'Report card data gaps',
    command: TSX_BIN,
    args: ['scripts/reportCardGaps.ts'],
  },
  {
    id: 'sync-official-decks',
    description: 'Sync official deck data',
    command: TSX_BIN,
    args: ['scripts/sync-official-decks.ts'],
  },
  {
    id: 'fetch-meta',
    description: 'Fetch live meta events and decks',
    command: TSX_BIN,
    args: ['scripts/fetch-meta.ts'],
  },
  {
    id: 'audit-deck-size',
    description: 'Audit deck size rules',
    command: TSX_BIN,
    args: ['scripts/audit-deck-size.ts'],
  },
  {
    id: 'verify-deck-sizes',
    description: 'Verify deck sizes in output artifacts',
    command: NODE_BIN,
    args: ['scripts/verify-deck-sizes.js'],
  },
  {
    id: 'verify-keywords',
    description: 'Verify keyword consistency',
    command: NODE_BIN,
    args: ['scripts/verify-keywords.js'],
  },
];

export const PIPELINE_TASK_BY_ID = new Map(PIPELINE_TASKS.map((task) => [task.id, task]));
