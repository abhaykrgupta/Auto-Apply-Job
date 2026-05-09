import { type DiscoveredCompany } from '../types';
import { logger } from '@/lib/utils/logger';

interface GitHubOrg {
  login: string;
  name: string | null;
  blog: string | null;
  description: string | null;
  location: string | null;
  avatar_url: string | null;
}

export async function scrapeGitHubTrending(): Promise<DiscoveredCompany[]> {
  logger.info('Scraping GitHub trending organizations...');

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(
      'https://api.github.com/search/repositories?q=stars:>1000+pushed:>2024-01-01&sort=stars&per_page=100',
      { headers, signal: AbortSignal.timeout(15000) }
    );

    if (!res.ok) {
      logger.warn(`GitHub API responded ${res.status}`);
      return [];
    }

    const data = await res.json();
    const orgs = new Map<string, string | null>(); // login -> avatar_url

    for (const repo of data.items ?? []) {
      const ownerLogin: string = repo.owner?.login;
      const ownerType: string = repo.owner?.type;
      if (ownerType === 'Organization' && ownerLogin && !orgs.has(ownerLogin)) {
        orgs.set(ownerLogin, repo.owner?.avatar_url ?? null);
      }
    }

    const orgDetails: DiscoveredCompany[] = [];
    const orgList = Array.from(orgs.entries()).slice(0, 25);

    for (const [login, avatar] of orgList) {
      try {
        const orgRes = await fetch(`https://api.github.com/orgs/${login}`, {
          headers,
          signal: AbortSignal.timeout(8000),
        });
        if (!orgRes.ok) continue;
        const orgData: GitHubOrg = await orgRes.json();

        orgDetails.push({
          name: orgData.name ?? login,
          website: orgData.blog && orgData.blog.startsWith('http') ? orgData.blog : undefined,
          description: orgData.description ?? undefined,
          location: orgData.location ?? undefined,
          logoUrl: avatar ?? undefined,
          source: 'github',
          tags: ['open-source'],
        });
      } catch {
        // skip
      }
    }

    logger.info(`GitHub: found ${orgDetails.length} organizations`);
    return orgDetails;
  } catch (err) {
    logger.error({ err }, 'GitHub scrape failed');
    return [];
  }
}
