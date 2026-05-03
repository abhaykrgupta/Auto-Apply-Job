import { NextRequest, NextResponse } from 'next/server';
import { EmailNotificationService } from '@/lib/notifications/email-service';

// Vercel cron: 0 8 * * * (8 AM UTC daily)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = new EmailNotificationService();
  await svc.sendDailyDigest();

  return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
}
