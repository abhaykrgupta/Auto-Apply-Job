import { NextRequest, NextResponse } from 'next/server';
import { taskQueue } from '@/lib/workers/task-queue';

/**
 * GET /api/workers/tasks/[id]
 * Poll task status — used by the frontend to check if an enqueued task completed.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const task = await taskQueue.getTask(id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({
      id: task.id,
      taskType: task.taskType,
      status: task.status,
      result: task.result,
      error: task.error,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
