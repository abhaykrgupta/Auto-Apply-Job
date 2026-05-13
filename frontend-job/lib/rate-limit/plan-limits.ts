/**
 * Plan-based usage limits for AI endpoints.
 *
 * Free:  5 quick-match calls/day · 2 resume tailors/month
 * Pro:   unlimited embedding matches · 20 tailors/month
 * Enterprise: unlimited everything
 */
import { db } from '@/lib/db';
import { authUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const PLAN_LIMITS = {
  free: {
    quickMatchPerDay: 5,
    tailorPerMonth:   2,
    copilotAnswersPerDay: 20,
  },
  pro: {
    quickMatchPerDay: Infinity,
    tailorPerMonth:   20,
    copilotAnswersPerDay: Infinity,
  },
  enterprise: {
    quickMatchPerDay: Infinity,
    tailorPerMonth:   Infinity,
    copilotAnswersPerDay: Infinity,
  },
} as const;

type Plan = keyof typeof PLAN_LIMITS;

/** Fetch the plan for a given userId (cached for 60s via module-level Map). */
const planCache = new Map<string, { plan: Plan; fetchedAt: number }>();
const CACHE_TTL = 60_000;

export async function getUserPlan(userId: string): Promise<Plan> {
  const cached = planCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.plan;

  const [row] = await db
    .select({ plan: authUsers.plan })
    .from(authUsers)
    .where(eq(authUsers.id, userId))
    .limit(1);

  const plan = (row?.plan as Plan) ?? 'free';
  planCache.set(userId, { plan, fetchedAt: Date.now() });
  return plan;
}

/**
 * In-memory usage counter.
 * Key: `${userId}:${operation}:${period}` where period = YYYY-MM-DD or YYYY-MM.
 *
 * NOTE: This resets on server restart. For production, replace with Redis INCR.
 */
const usageCounters = new Map<string, number>();

function getPeriod(type: 'day' | 'month'): string {
  const now = new Date();
  if (type === 'day') return now.toISOString().slice(0, 10);
  return now.toISOString().slice(0, 7);
}

export function incrementUsage(userId: string, operation: string, periodType: 'day' | 'month'): number {
  const key = `${userId}:${operation}:${getPeriod(periodType)}`;
  const count = (usageCounters.get(key) ?? 0) + 1;
  usageCounters.set(key, count);
  return count;
}

export function getUsage(userId: string, operation: string, periodType: 'day' | 'month'): number {
  const key = `${userId}:${operation}:${getPeriod(periodType)}`;
  return usageCounters.get(key) ?? 0;
}

/**
 * Check if user is within their plan limit for an operation.
 * Returns { allowed: true } or { allowed: false, limit, current, plan }.
 */
export async function checkPlanLimit(
  userId: string,
  operation: 'quickMatchPerDay' | 'tailorPerMonth' | 'copilotAnswersPerDay',
): Promise<{ allowed: boolean; limit: number; current: number; plan: Plan }> {
  const plan   = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const limit  = limits[operation];
  const periodType = operation.endsWith('PerDay') ? 'day' : 'month';
  const current = getUsage(userId, operation, periodType);

  return { allowed: current < limit, limit, current, plan };
}
