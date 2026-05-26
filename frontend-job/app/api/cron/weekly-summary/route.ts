import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { EmailNotificationService } from '@/lib/notifications/email-service';

function verifyCronSecret(authHeader: string | null): boolean {
  if (!process.env.CRON_SECRET || !authHeader) return false;
  try {
    const a = Buffer.from(authHeader);
    const b = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}

// Vercel cron: 0 9 * * 0 (9 AM UTC every Sunday)
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = new EmailNotificationService();
  await svc.sendWeeklySummary();

  return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
}
