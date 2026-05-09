import { NextResponse } from 'next/server';
import { telegramService } from '@/lib/notifications/telegram-service';

export async function POST() {
  const ok = await telegramService.sendTest();
  if (!ok) {
    return NextResponse.json({
      success: false,
      error: 'Telegram not configured. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env.local',
    }, { status: 400 });
  }
  return NextResponse.json({ success: true, message: 'Test message sent to Telegram!' });
}
