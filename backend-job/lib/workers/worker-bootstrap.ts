import { logger } from '@/lib/utils/logger';
import { TaskQueue } from './task-queue';
import type { WorkerTaskType, WorkerTask } from './task-types';

export type TaskHandler<T extends WorkerTaskType = WorkerTaskType> = (
  task: WorkerTask<T>,
  signal: AbortSignal
) => Promise<unknown>;

interface HandlerMap {
  [taskType: string]: TaskHandler<WorkerTaskType>;
}

/**
 * Reusable worker bootstrap.
 *
 * Creates a polling loop that:
 *  1. Claims one task at a time from the DB queue
 *  2. Executes the registered handler
 *  3. Marks the task completed or failed
 *  4. Handles graceful shutdown on SIGTERM / SIGINT
 *
 * Usage (in a worker entrypoint script):
 *
 *   const worker = createWorker('automation', ['apply_job']);
 *   worker.register('apply_job', handleApplyJob);
 *   worker.start();
 */
export function createWorker(workerName: string, taskTypes: WorkerTaskType[]) {
  const workerId = `${workerName}-${process.pid}`;
  const queue = new TaskQueue(workerId);
  const handlers: HandlerMap = {};
  let running = false;
  let abortController = new AbortController();

  function register<T extends WorkerTaskType>(taskType: T, handler: TaskHandler<T>): void {
    handlers[taskType] = handler as TaskHandler<WorkerTaskType>;
  }

  async function runOnce(): Promise<void> {
    const task = await queue.dequeue(taskTypes);
    if (!task) return;

    logger.info({ taskType: task.taskType, taskId: task.id }, `[${workerName}] Processing task`);
    const handler = handlers[task.taskType];

    if (!handler) {
      await queue.fail(task.id, `No handler registered for task type: ${task.taskType}`, task.retryCount, task.maxRetries);
      return;
    }

    try {
      const result = await handler(task, abortController.signal);
      await queue.complete(task.id, result);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error({ err, taskId: task.id, taskType: task.taskType }, `[${workerName}] Task failed`);
      await queue.fail(task.id, error, task.retryCount, task.maxRetries);
    }
  }

  async function start(): Promise<void> {
    running = true;
    logger.info({ workerId, taskTypes }, `[${workerName}] Worker started`);

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info({ signal }, `[${workerName}] Received ${signal} — shutting down gracefully`);
      running = false;
      abortController.abort();
    };

    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));

    while (running) {
      try {
        await runOnce();
      } catch (err) {
        logger.error({ err }, `[${workerName}] Unhandled poll error`);
      }
      // Brief pause between polls (avoids hammering DB when queue is empty)
      await new Promise((r) => setTimeout(r, queue.pollIntervalMs));
    }

    logger.info(`[${workerName}] Worker stopped`);
  }

  return { register, start, workerId };
}
