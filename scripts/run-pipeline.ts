#!/usr/bin/env tsx

import { PIPELINE_TASK_BY_ID, PIPELINE_TASKS } from './pipeline-tasks';
import { runPipeline } from './lib/pipeline';

interface CliOptions {
  list: boolean;
  all: boolean;
  taskIds: string[];
  continueOnError: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    list: false,
    all: false,
    taskIds: [],
    continueOnError: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--list') {
      options.list = true;
      continue;
    }

    if (arg === '--all') {
      options.all = true;
      continue;
    }

    if (arg === '--continue-on-error') {
      options.continueOnError = true;
      continue;
    }

    if (arg === '--task') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('Missing task id after --task');
      }
      options.taskIds.push(next);
      i += 1;
      continue;
    }

    if (arg.startsWith('--task=')) {
      options.taskIds.push(arg.slice('--task='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printUsage(): void {
  console.log('Usage: tsx scripts/run-pipeline.ts [--all] [--task <id>] [--continue-on-error] [--list]');
}

function printTaskList(): void {
  console.log('Available pipeline tasks:');
  for (const task of PIPELINE_TASKS) {
    console.log(`- ${task.id}: ${task.description}`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.list) {
    printTaskList();
    return;
  }

  const selectedTaskIds = options.all ? PIPELINE_TASKS.map((task) => task.id) : options.taskIds;

  if (selectedTaskIds.length === 0) {
    printUsage();
    printTaskList();
    throw new Error('No pipeline tasks selected. Use --all or at least one --task <id>.');
  }

  const selectedTasks = selectedTaskIds.map((taskId) => {
    const task = PIPELINE_TASK_BY_ID.get(taskId);
    if (!task) {
      throw new Error(`Unknown task: ${taskId}`);
    }
    return task;
  });

  console.log(`[Pipeline] Selected ${selectedTasks.length} task(s): ${selectedTasks.map((t) => t.id).join(', ')}`);
  await runPipeline(selectedTasks, { continueOnError: options.continueOnError });
  console.log('[Pipeline] All selected tasks completed successfully.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Pipeline] ${message}`);
  process.exit(1);
});
