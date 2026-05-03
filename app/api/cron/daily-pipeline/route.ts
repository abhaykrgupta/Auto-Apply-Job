import { NextRequest, NextResponse } from 'next/server';
import { AutoJobPipeline } from '@/lib/automation/auto-job-pipeline';

// Vercel cron: 0 4 * * * (4 AM UTC daily)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pipeline = new AutoJobPipeline();
  const result = await pipeline.runDailyPipeline();

  return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
}
