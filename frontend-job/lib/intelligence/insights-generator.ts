import { db } from '@/lib/db';
import {
  resumePerformance, keywordPerformance, companyResponseMetrics,
  applications, jobs, resumes,
} from '@/lib/db/schema';
import { desc, sql, gte, gt } from 'drizzle-orm';
import { openai } from '@/lib/openai/client';
import { rateLimitedOpenAI } from '@/lib/openai/rate-limiter';
import { trackUsageFromResponse } from '@/lib/openai/usage-tracker';
import { logger } from '@/lib/utils/logger';

export interface Insight {
  type: 'resume' | 'timing' | 'source' | 'keyword' | 'company';
  confidence: 'high' | 'medium' | 'low';
  headline: string;   // e.g. "Resume A performs 41% better on startup backend roles"
  detail: string;     // supporting data
  actionable: string; // what to do about it
}

export interface InsightReport {
  generatedAt: Date;
  insights: Insight[];
  rawStats: {
    totalApplications: number;
    overallResponseRate: number;
    overallInterviewRate: number;
    topResume?: { resumeId: string; responseRate: number };
    topSource?: { source: string; count: number };
    topKeywords: Array<{ keyword: string; responseRate: number }>;
    topCompanies: Array<{ companyName: string; responseRate: number }>;
  };
}

/**
 * AI-powered Application Insight Generator
 *
 * Aggregates performance data and uses GPT to produce human-readable strategic
 * recommendations. Data-only analysis when GPT is unavailable.
 */
export class InsightsGenerator {

  async generate(): Promise<InsightReport> {
    logger.info('Generating application intelligence report');

    const [rawStats, analyticalInsights] = await Promise.all([
      this.gatherRawStats(),
      this.generateDeterministicInsights(),
    ]);

    // Use GPT to generate additional qualitative insights if data is sufficient
    let aiInsights: Insight[] = [];
    if (rawStats.totalApplications >= 5) {
      aiInsights = await this.generateAiInsights(rawStats, analyticalInsights).catch(() => []);
    }

    return {
      generatedAt: new Date(),
      insights: [...analyticalInsights, ...aiInsights],
      rawStats,
    };
  }

  // ── Raw stat aggregation ────────────────────────────────────────────────

  private async gatherRawStats(): Promise<InsightReport['rawStats']> {
    const [totals, resumeStats, sourceStats, keywordStats, companyStats] = await Promise.all([
      db.select({
        total: sql<number>`COUNT(*)`,
        responses: sql<number>`SUM(CASE WHEN ${applications.status} IN ('interviewing','accepted') THEN 1 ELSE 0 END)`,
        interviews: sql<number>`SUM(CASE WHEN ${applications.status} = 'interviewing' THEN 1 ELSE 0 END)`,
      }).from(applications),

      db.select({
        resumeId: resumePerformance.resumeId,
        responseRate: sql<number>`CASE WHEN ${resumePerformance.totalApplications} > 0 THEN ${resumePerformance.responseCount}::real / ${resumePerformance.totalApplications} ELSE 0 END`,
      }).from(resumePerformance)
        .where(gt(resumePerformance.totalApplications, 2))
        .orderBy(desc(resumePerformance.responseCount))
        .limit(1),

      db.select({
        source: jobs.source,
        count: sql<number>`COUNT(*)`,
      }).from(applications)
        .innerJoin(jobs, sql`${applications.jobId} = ${jobs.id}`)
        .groupBy(jobs.source)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(1),

      db.select({
        keyword: keywordPerformance.keyword,
        responseRate: keywordPerformance.responseRate,
      }).from(keywordPerformance)
        .where(gt(keywordPerformance.occurrences, 2))
        .orderBy(desc(keywordPerformance.responseRate))
        .limit(10),

      db.select({
        companyName: companyResponseMetrics.companyName,
        responseRate: companyResponseMetrics.responseRate,
      }).from(companyResponseMetrics)
        .where(gt(companyResponseMetrics.totalApplications, 1))
        .orderBy(desc(companyResponseMetrics.responseRate))
        .limit(5),
    ]);

    const total = Number(totals[0]?.total ?? 0);
    const responses = Number(totals[0]?.responses ?? 0);
    const interviews = Number(totals[0]?.interviews ?? 0);

    return {
      totalApplications: total,
      overallResponseRate: total > 0 ? responses / total : 0,
      overallInterviewRate: total > 0 ? interviews / total : 0,
      topResume: resumeStats[0] ? { resumeId: resumeStats[0].resumeId, responseRate: Number(resumeStats[0].responseRate) } : undefined,
      topSource: sourceStats[0] ? { source: sourceStats[0].source, count: Number(sourceStats[0].count) } : undefined,
      topKeywords: keywordStats.map((k) => ({ keyword: k.keyword, responseRate: Number(k.responseRate) })),
      topCompanies: companyStats.map((c) => ({ companyName: c.companyName, responseRate: Number(c.responseRate) })),
    };
  }

  // ── Deterministic rule-based insights ────────────────────────────────────

  private async generateDeterministicInsights(): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Resume performance comparison
    const resumes = await db
      .select()
      .from(resumePerformance)
      .where(gt(resumePerformance.totalApplications, 2))
      .orderBy(desc(resumePerformance.responseCount));

    if (resumes.length >= 2) {
      const best = resumes[0];
      const worst = resumes[resumes.length - 1];
      const bestRate = best.totalApplications > 0 ? best.responseCount / best.totalApplications : 0;
      const worstRate = worst.totalApplications > 0 ? worst.responseCount / worst.totalApplications : 0;

      if (bestRate > worstRate * 1.2) {
        const improvement = Math.round((bestRate - worstRate) * 100);
        insights.push({
          type: 'resume',
          confidence: 'high',
          headline: `Top resume gets ${improvement}% more responses`,
          detail: `Best resume: ${Math.round(bestRate * 100)}% response rate vs ${Math.round(worstRate * 100)}% for lowest performer (sample: ${best.totalApplications} applications)`,
          actionable: 'Use the best-performing resume as your default for all applications.',
        });
      }
    }

    // Top keywords
    const topKw = await db
      .select()
      .from(keywordPerformance)
      .where(gt(keywordPerformance.occurrences, 3))
      .orderBy(desc(keywordPerformance.responseRate))
      .limit(5);

    if (topKw.length >= 3) {
      const keywords = topKw.map((k) => k.keyword).join(', ');
      insights.push({
        type: 'keyword',
        confidence: 'medium',
        headline: `These keywords correlate with higher response rates`,
        detail: `Top performing keywords: ${keywords}`,
        actionable: 'Ensure these keywords appear prominently in your resume and cover letters.',
      });
    }

    // Company response rate leaders
    const topCompanies = await db
      .select()
      .from(companyResponseMetrics)
      .where(gt(companyResponseMetrics.totalApplications, 1))
      .orderBy(desc(companyResponseMetrics.responseRate))
      .limit(3);

    if (topCompanies.length > 0) {
      const names = topCompanies.map((c) => c.companyName).join(', ');
      const avgRate = topCompanies.reduce((s, c) => s + c.responseRate, 0) / topCompanies.length;
      insights.push({
        type: 'company',
        confidence: 'medium',
        headline: `${names} respond faster than average`,
        detail: `Average response rate: ${Math.round(avgRate * 100)}% for your top companies`,
        actionable: 'Prioritize applications to companies with proven response history.',
      });
    }

    return insights;
  }

  // ── GPT-powered qualitative insights ─────────────────────────────────────

  private async generateAiInsights(
    stats: InsightReport['rawStats'],
    existingInsights: Insight[]
  ): Promise<Insight[]> {
    const prompt = `You are a career analytics AI. Analyze this job application performance data and generate 2-3 additional strategic insights NOT already covered by the existing analysis.

PERFORMANCE DATA:
- Total applications: ${stats.totalApplications}
- Overall response rate: ${Math.round(stats.overallResponseRate * 100)}%
- Overall interview rate: ${Math.round(stats.overallInterviewRate * 100)}%
- Top job source: ${stats.topSource?.source ?? 'N/A'} (${stats.topSource?.count ?? 0} applications)
- Top keywords by response rate: ${stats.topKeywords.slice(0, 5).map((k) => `${k.keyword} (${Math.round(k.responseRate * 100)}%)`).join(', ')}
- Top responding companies: ${stats.topCompanies.slice(0, 3).map((c) => `${c.companyName} (${Math.round(c.responseRate * 100)}%)`).join(', ')}

EXISTING INSIGHTS: ${existingInsights.map((i) => i.headline).join(' | ')}

Return ONLY a JSON array of insights:
[
  {
    "type": "timing|source|resume|keyword|company",
    "confidence": "high|medium|low",
    "headline": "concise insight under 10 words",
    "detail": "1-2 sentences supporting data",
    "actionable": "specific action to take"
  }
]

Focus on non-obvious patterns. Be specific with numbers. Only return insights supported by the data.`;

    const startTime = Date.now();
    const response = await rateLimitedOpenAI(() => openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 800,
    }));

    trackUsageFromResponse('resume_builder', 'gpt-4o', response, startTime);

    const raw = response.choices[0]?.message?.content ?? '[]';
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : (parsed.insights ?? []);
      return arr as Insight[];
    } catch {
      return [];
    }
  }
}

export const insightsGenerator = new InsightsGenerator();
