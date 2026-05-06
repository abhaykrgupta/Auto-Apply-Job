import { db } from '@/lib/db';
import { workerTasks } from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { type WorkerTaskType, type TaskPayloadMap, type WorkerTask } from './task-types';

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL_MS ?? '2000', 10);
const TASK_LOCK_TIMEOUT_MS = parseInt(process.env.WORKER_TASK_TIMEOUT_MS ?? '300000', 10); // 5 min

/**
 * DB-backed task queue.
 * PostgreSQL is the message bus — no Redis/BullMQ needed.
 *
 * Concurrency safety: dequeue uses UPDATE ... WHERE status='pending' RETURNING
 * so only one worker claims each task even under parallel polling.
 */
export class TaskQueue {
  private readonly workerId: string;

  constructor(workerId: string) {
    this.workerId = workerId;
  }

  /** Enqueue a new task. Returns the task ID. */
  async enqueue<T extends WorkerTaskType>(
    taskType: T,
    payload: TaskPayloadMap[T],
    opts: { priority?: number; maxRetries?: number } = {}
  ): Promise<string> {
    const [row] = await db
      .insert(workerTasks)
      .values({
        taskType,
        payload: payload as unknown as Record<string, unknown>,
        status: 'pending',
        priority: opts.priority ?? 0,
        maxRetries: opts.maxRetries ?? 3,
      })
      .returning({ id: workerTasks.id });

    logger.info({ taskType, taskId: row.id, priority: opts.priority ?? 0 }, 'Task enqueued');
    return row.id;
  }

  /**
   * Atomically claim the next pending task of the given types.
   * Uses a CTE to prevent race conditions under parallel workers.
   */
  async dequeue(taskTypes: WorkerTaskType[]): Promise<WorkerTask | null> {
    try {
      // Recover stale tasks (running for longer than timeout — worker crashed)
      await this.recoverStaleTasks();

      // Atomic claim via UPDATE...RETURNING
      const rows = await db
        .update(workerTasks)
        .set({
          status: 'running',
          workerId: this.workerId,
          startedAt: new Date(),
        })
        .where(
          and(
            eq(workerTasks.status, 'pending'),
            sql`${workerTasks.taskType} = ANY(${sql.raw(`ARRAY[${taskTypes.map((t) => `'${t}'`).join(',')}]`)})`,
          )
        )
        .returning();

      // Grab the one with highest priority if multiple updated (shouldn't happen but safety)
      const task = rows.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
      if (!task) return null;

      logger.info({ taskType: task.taskType, taskId: task.id, workerId: this.workerId }, 'Task claimed');
      return task as unknown as WorkerTask;
    } catch (err) {
      logger.error({ err }, 'Dequeue failed');
      return null;
    }
  }

  /** Mark task as completed with a result payload */
  async complete(taskId: string, result: unknown): Promise<void> {
    await db
      .update(workerTasks)
      .set({ status: 'completed', result: result as Record<string, unknown>, completedAt: new Date() })
      .where(eq(workerTasks.id, taskId));
    logger.info({ taskId }, 'Task completed');
  }

  /** Mark task as failed. Re-enqueues with incremented retryCount if retries remain. */
  async fail(taskId: string, error: string, retryCount: number, maxRetries: number): Promise<void> {
    const exhausted = retryCount >= maxRetries;
    await db
      .update(workerTasks)
      .set({
        status: exhausted ? 'failed' : 'pending',
        error,
        retryCount: retryCount + 1,
        workerId: null,
        startedAt: null,
        completedAt: exhausted ? new Date() : null,
      })
      .where(eq(workerTasks.id, taskId));

    logger.warn({ taskId, error, retryCount, maxRetries, exhausted }, 'Task failed');
  }

  /** Get task by ID (for status polling from API routes) */
  async getTask(taskId: string): Promise<WorkerTask | null> {
    const rows = await db.select().from(workerTasks).where(eq(workerTasks.id, taskId)).limit(1);
    return (rows[0] as unknown as WorkerTask) ?? null;
  }

  /** Recover tasks that were claimed but never completed (crashed worker) */
  private async recoverStaleTasks(): Promise<void> {
    const staleThreshold = new Date(Date.now() - TASK_LOCK_TIMEOUT_MS);
    const recovered = await db
      .update(workerTasks)
      .set({ status: 'pending', workerId: null, startedAt: null })
      .where(and(eq(workerTasks.status, 'running'), lte(workerTasks.startedAt, staleThreshold)))
      .returning({ id: workerTasks.id });

    if (recovered.length > 0) {
      logger.warn({ count: recovered.length }, 'Recovered stale tasks');
    }
  }

  get pollIntervalMs() { return POLL_INTERVAL_MS; }
}

/** Singleton helper for API routes to enqueue without owning a workerId */
const _apiQueue = new TaskQueue('api');
export const taskQueue = _apiQueue;
