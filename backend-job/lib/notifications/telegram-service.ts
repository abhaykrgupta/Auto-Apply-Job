import { logger } from '@/lib/utils/logger';

// Setup instructions:
// 1. Message @BotFather on Telegram → /newbot → get TELEGRAM_BOT_TOKEN
// 2. Message your bot once, then GET https://api.telegram.org/bot<TOKEN>/getUpdates to find your TELEGRAM_CHAT_ID
// 3. Add both to .env.local

const BASE = 'https://api.telegram.org';

function getConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  return { token, chatId };
}

async function sendMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
  const config = getConfig();
  if (!config) {
    logger.warn('Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing)');
    return false;
  }

  try {
    const res = await fetch(`${BASE}/bot${config.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ err }, 'Telegram API error');
      return false;
    }

    return true;
  } catch (err) {
    logger.error({ err }, 'Telegram send failed');
    return false;
  }
}

export class TelegramService {
  // Fired when a high-match job (80%+) is found
  async notifyHighMatch(job: {
    title: string;
    company: string;
    location?: string | null;
    applyUrl: string;
    id: string;
  }, score: number): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const locationStr = job.location ?? 'Remote';
    const stars = score >= 90 ? '🌟🌟🌟' : score >= 85 ? '⭐⭐' : '⭐';

    const text = [
      `${stars} <b>High-Match Job Found!</b>`,
      ``,
      `<b>${job.title}</b>`,
      `🏢 ${job.company}`,
      `📍 ${locationStr}`,
      `🎯 Match Score: <b>${score}%</b>`,
      ``,
      `<a href="${appUrl}/jobs/${job.id}">View on Job Agent</a> | <a href="${job.applyUrl}">Apply Directly</a>`,
    ].join('\n');

    await sendMessage(text);
  }

  // Application status update
  async notifyApplicationStatus(job: {
    title: string;
    company: string;
  }, status: string): Promise<void> {
    const emoji: Record<string, string> = {
      applied: '✅',
      failed: '❌',
      manual_review: '📋',
      interviewing: '🎤',
      accepted: '🎉',
      rejected: '😔',
    };

    const messages: Record<string, string> = {
      applied: 'Application submitted successfully!',
      failed: 'Auto-apply failed — needs manual application',
      manual_review: 'Needs your review before submitting',
      interviewing: 'Interview request received!',
      accepted: 'You got the job! Congratulations!',
      rejected: 'Application was rejected',
    };

    const text = [
      `${emoji[status] ?? '📌'} <b>Application Update</b>`,
      ``,
      `<b>${job.title}</b> at ${job.company}`,
      `Status: ${messages[status] ?? status}`,
    ].join('\n');

    await sendMessage(text);
  }

  // Daily summary
  async notifyDailySummary(stats: {
    newJobs: number;
    applicationsToday: number;
    highMatches: number;
    pendingReview: number;
  }): Promise<void> {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    const text = [
      `📊 <b>Daily Job Search Summary</b>`,
      `<i>${today}</i>`,
      ``,
      `🔍 New jobs found: <b>${stats.newJobs}</b>`,
      `📤 Applications sent: <b>${stats.applicationsToday}</b>`,
      `🎯 High matches (80%+): <b>${stats.highMatches}</b>`,
      `📋 Pending review: <b>${stats.pendingReview}</b>`,
    ].join('\n');

    await sendMessage(text);
  }

  // Discovery complete
  async notifyDiscoveryComplete(result: {
    newCompanies: number;
    total: number;
  }): Promise<void> {
    if (result.newCompanies === 0) return;

    const text = [
      `🏢 <b>Company Discovery Complete</b>`,
      ``,
      `Found <b>${result.total}</b> companies`,
      `Added <b>${result.newCompanies}</b> new companies to your list`,
    ].join('\n');

    await sendMessage(text);
  }

  // Send a raw test message (for setup verification)
  async sendTest(): Promise<boolean> {
    return sendMessage('🤖 <b>Job Agent connected!</b>\n\nYou will receive notifications here when high-match jobs are found.');
  }
}

export const telegramService = new TelegramService();
