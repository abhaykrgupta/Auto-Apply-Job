import { Resend } from 'resend';
import { db } from '@/lib/db';
import { jobMatches, jobs, applications } from '@/lib/db/schema';
import { gte, eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

// Lazy getter — never instantiated at module load time so build passes without API key
function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = 'Job Agent <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export class EmailNotificationService {
  async sendJobMatchAlert(matches: Array<{ job: any; score: number; strengths?: string[]; weaknesses?: string[]; recommendation?: string }>) {
    const high = matches.filter((m) => m.score >= 80);
    if (high.length === 0 || !process.env.RESEND_API_KEY || !process.env.USER_EMAIL) return;

    try {
      await getResend().emails.send({
        from: FROM,
        to: process.env.USER_EMAIL,
        subject: `🎯 ${high.length} High-Match Jobs Found!`,
        html: this.renderJobMatchEmail(high),
      });
      logger.info({ count: high.length }, 'Job match alert sent');
    } catch (err) {
      logger.error({ err }, 'Failed to send job match alert');
    }
  }

  async sendDailyDigest() {
    if (!process.env.RESEND_API_KEY || !process.env.USER_EMAIL) return;
    const stats = await this.getDailyStats();
    if (stats.newJobs === 0 && stats.applicationsToday === 0) return;

    try {
      await getResend().emails.send({
        from: FROM,
        to: process.env.USER_EMAIL,
        subject: `📊 Daily Job Search Update — ${new Date().toLocaleDateString()}`,
        html: this.renderDailyDigest(stats),
      });
      logger.info('Daily digest sent');
    } catch (err) {
      logger.error({ err }, 'Failed to send daily digest');
    }
  }

  async sendWeeklySummary() {
    if (!process.env.RESEND_API_KEY || !process.env.USER_EMAIL) return;
    const stats = await this.getWeeklyStats();

    try {
      await getResend().emails.send({
        from: FROM,
        to: process.env.USER_EMAIL,
        subject: `📈 Weekly Summary — ${stats.applicationsThisWeek} Applications Sent`,
        html: this.renderWeeklySummary(stats),
      });
      logger.info('Weekly summary sent');
    } catch (err) {
      logger.error({ err }, 'Failed to send weekly summary');
    }
  }

  async sendApplicationUpdate(application: { status: string; errorMessage?: string | null; job: { title: string; company: string; location?: string | null; applyUrl: string; id: string }; id: string }) {
    if (!process.env.RESEND_API_KEY || !process.env.USER_EMAIL) return;

    const statusEmoji: Record<string, string> = {
      applied: '✅',
      failed: '❌',
      manual_review: '📋',
      pending: '⏳',
      interviewing: '🎤',
      accepted: '🎉',
    };

    try {
      await getResend().emails.send({
        from: FROM,
        to: process.env.USER_EMAIL,
        subject: `${statusEmoji[application.status] ?? '📌'} ${application.job.company} — ${application.job.title}`,
        html: this.renderApplicationUpdate(application),
      });
    } catch (err) {
      logger.error({ err }, 'Failed to send application update');
    }
  }

  // ── Templates ──────────────────────────────────────────────────────────

  private renderJobMatchEmail(matches: any[]) {
    const cards = matches
      .map(
        (m) => `
      <div style="border:2px solid #e2e8f0;border-radius:10px;padding:20px;margin:20px 0">
        <h2 style="margin:0 0 4px">${m.job.title}</h2>
        <p style="color:#64748b;margin:0 0 10px"><strong>${m.job.company}</strong> · ${m.job.location ?? 'Remote'}</p>
        <span style="background:#10b981;color:#fff;padding:4px 12px;border-radius:20px;font-weight:bold">${m.score}% Match</span>
        ${m.strengths?.length ? `<h3 style="margin:14px 0 6px">✅ Strengths</h3><ul>${m.strengths.map((s: string) => `<li style="color:#10b981">${s}</li>`).join('')}</ul>` : ''}
        ${m.weaknesses?.length ? `<h3 style="margin:14px 0 6px">⚠️ Gaps</h3><ul>${m.weaknesses.map((w: string) => `<li style="color:#ef4444">${w}</li>`).join('')}</ul>` : ''}
        ${m.recommendation ? `<p style="font-style:italic;color:#64748b">${m.recommendation}</p>` : ''}
        <a href="${APP_URL}/jobs/${m.job.id}" style="background:#667eea;color:#fff;padding:10px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:10px">View &amp; Apply</a>
      </div>`
      )
      .join('');

    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:30px;border-radius:10px;text-align:center">
        <h1>🎯 High-Match Jobs Found!</h1>
        <p>${matches.length} jobs with 80%+ match score</p>
      </div>
      ${cards}
      <p style="text-align:center;color:#64748b;margin-top:30px"><a href="${APP_URL}/matches">View All Matches</a></p>
    </body></html>`;
  }

  private renderDailyDigest(stats: any) {
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#1e293b;color:#fff;padding:30px;border-radius:10px">
        <h1>📊 Daily Job Search Summary</h1>
        <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div style="display:flex;gap:15px;margin:20px 0">
        ${[
          { n: stats.newJobs, l: 'New Jobs Found' },
          { n: stats.applicationsToday, l: 'Applications Sent' },
          { n: stats.pendingReview, l: 'Pending Review' },
        ]
          .map(
            (s) =>
              `<div style="flex:1;background:#f8fafc;padding:20px;border-radius:10px;text-align:center">
              <div style="font-size:36px;font-weight:bold;color:#667eea">${s.n}</div>
              <div style="color:#64748b;font-size:14px">${s.l}</div>
            </div>`
          )
          .join('')}
      </div>
      <h2>🎯 Top Matches Today</h2>
      ${
        stats.topMatches?.length
          ? stats.topMatches
              .slice(0, 5)
              .map(
                (m: any) =>
                  `<div style="border-left:4px solid #667eea;padding-left:15px;margin:12px 0">
                <h3 style="margin:0 0 4px">${m.job?.title ?? 'Job'}</h3>
                <p style="color:#64748b;margin:0">${m.job?.company ?? ''} · ${m.score}% match</p>
              </div>`
              )
              .join('')
          : '<p style="color:#64748b">No new matches today</p>'
      }
      <p style="text-align:center;margin-top:30px">
        <a href="${APP_URL}" style="background:#667eea;color:#fff;padding:12px 30px;text-decoration:none;border-radius:6px;display:inline-block">View Dashboard</a>
      </p>
    </body></html>`;
  }

  private renderApplicationUpdate(application: any) {
    const msgs: Record<string, string> = {
      applied: '✅ Your application was successfully submitted!',
      failed: '❌ Auto-apply failed — you can apply manually.',
      manual_review: '📋 This application needs your review.',
      pending: '⏳ Application is queued...',
      interviewing: '🎤 You have an interview!',
      accepted: '🎉 Congratulations — you were accepted!',
    };

    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#1e293b;color:#fff;padding:30px;border-radius:10px;text-align:center">
        <h1>Application Update</h1>
      </div>
      <div style="background:#f8fafc;padding:30px;border-radius:10px;margin:20px 0">
        <h2>${application.job.title}</h2>
        <p><strong>${application.job.company}</strong> · ${application.job.location ?? 'Remote'}</p>
        <p style="font-size:18px;margin:20px 0">${msgs[application.status] ?? '📌 Status updated'}</p>
        ${
          application.status === 'failed' || application.status === 'manual_review'
            ? `<a href="${application.job.applyUrl}" style="background:#667eea;color:#fff;padding:10px 24px;text-decoration:none;border-radius:6px;display:inline-block">Apply Manually</a>`
            : ''
        }
      </div>
      <p style="text-align:center;color:#64748b"><a href="${APP_URL}/applications">View All Applications</a></p>
    </body></html>`;
  }

  private renderWeeklySummary(stats: any) {
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:40px;border-radius:10px;text-align:center">
        <h1>📈 Weekly Summary</h1>
        <div style="font-size:72px;font-weight:bold;margin:20px 0">${stats.applicationsThisWeek}</div>
        <p>Applications Sent This Week</p>
      </div>
      <div style="display:flex;justify-content:space-around;margin:30px 0">
        ${[
          { v: stats.newJobsThisWeek, l: 'New Jobs' },
          { v: `${stats.successRate}%`, l: 'Success Rate' },
          { v: stats.interviewRequests ?? 0, l: 'Interviews' },
        ]
          .map(
            (s) =>
              `<div style="text-align:center">
              <div style="font-size:36px;font-weight:bold;color:#667eea">${s.v}</div>
              <div style="color:#64748b">${s.l}</div>
            </div>`
          )
          .join('')}
      </div>
      ${
        stats.topCompanies?.length
          ? `<h2>🏆 Most Applied Companies</h2><ol>${stats.topCompanies.map((c: any) => `<li>${c.company} (${c.count})</li>`).join('')}</ol>`
          : ''
      }
      <p style="text-align:center;margin-top:30px">
        <a href="${APP_URL}/analytics" style="background:#667eea;color:#fff;padding:12px 30px;text-decoration:none;border-radius:6px;display:inline-block">View Analytics</a>
      </p>
    </body></html>`;
  }

  // ── Stats helpers ───────────────────────────────────────────────────────

  private async getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [newJobsRows, appRows, pendingRows, topMatchRows] = await Promise.all([
      db.select({ id: jobs.id }).from(jobs).where(gte(jobs.createdAt, today)),
      db.select({ id: applications.id }).from(applications).where(gte(applications.createdAt, today)),
      db.select({ id: applications.id }).from(applications).where(eq(applications.status, 'manual_review')),
      db
        .select({ score: jobMatches.score, jobId: jobMatches.jobId })
        .from(jobMatches)
        .where(gte(jobMatches.createdAt, today))
        .orderBy(desc(jobMatches.score))
        .limit(5),
    ]);

    return {
      newJobs: newJobsRows.length,
      applicationsToday: appRows.length,
      pendingReview: pendingRows.length,
      topMatches: topMatchRows,
    };
  }

  private async getWeeklyStats() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [appsThisWeek, newJobsRows] = await Promise.all([
      db.select().from(applications).where(gte(applications.createdAt, weekAgo)),
      db.select({ id: jobs.id }).from(jobs).where(gte(jobs.createdAt, weekAgo)),
    ]);

    const successCount = appsThisWeek.filter((a) => a.status === 'applied').length;
    const interviewCount = appsThisWeek.filter((a) => a.status === 'interviewing').length;

    const companyCount: Record<string, number> = {};
    // Note: we don't have company on applications directly, so skip company grouping

    return {
      applicationsThisWeek: appsThisWeek.length,
      newJobsThisWeek: newJobsRows.length,
      successRate:
        appsThisWeek.length > 0
          ? Math.round((successCount / appsThisWeek.length) * 100)
          : 0,
      interviewRequests: interviewCount,
      topCompanies: [] as Array<{ company: string; count: number }>,
    };
  }
}
