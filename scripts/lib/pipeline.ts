import { spawn } from 'node:child_process';

export interface PipelineTask {
  id: string;
  description: string;
  command: string;
  args: string[];
}

export interface RunPipelineOptions {
  continueOnError?: boolean;
}

function runCommand(task: PipelineTask): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(task.command, task.args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', (error) => {
      reject(new Error(`Task ${task.id} failed to start: ${error.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Task ${task.id} exited with code ${code ?? 'unknown'}`));
    });
  });
}

export async function runPipeline(tasks: PipelineTask[], options: RunPipelineOptions = {}): Promise<void> {
  const failures: Array<{ taskId: string; error: string }> = [];

  for (const task of tasks) {
    console.log(`\n[Pipeline] Running ${task.id}: ${task.description}`);

    try {
      await runCommand(task);
      console.log(`[Pipeline] Completed ${task.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ taskId: task.id, error: message });
      console.error(`[Pipeline] Failed ${task.id}: ${message}`);

      if (!options.continueOnError) {
        break;
      }
    }
  }

  if (failures.length > 0) {
    const summary = failures.map((f) => `${f.taskId}: ${f.error}`).join('; ');
    throw new Error(`Pipeline completed with ${failures.length} failure(s): ${summary}`);
  }
}
