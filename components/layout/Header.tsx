'use client';

import { usePathname } from 'next/navigation';
import { Moon, Sun, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/':              { title: 'Dashboard', description: 'Your job search overview' },
  '/resume':        { title: 'Resume', description: 'Manage and parse your resume' },
  '/companies':     { title: 'Companies', description: 'Discover and track companies' },
  '/search':        { title: 'Search Jobs', description: 'Find jobs across 8+ sources' },
  '/jobs':          { title: 'All Jobs', description: 'Browse all scraped jobs' },
  '/matches':       { title: 'AI Matches', description: 'Jobs matched to your profile' },
  '/applications':  { title: 'Applications', description: 'Track your applications' },
  '/manual-review': { title: 'Manual Review', description: 'Applications needing attention' },
  '/analytics':     { title: 'Analytics', description: 'Performance insights' },
  '/settings':      { title: 'Settings', description: 'Configure your automation' },
};

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const page = pageTitles[pathname] ?? { title: 'Job Agent', description: '' };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold text-foreground">{page.title}</h1>
        {page.description && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground hidden sm:block">{page.description}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="h-9 w-9 rounded-lg"
        >
          {mounted ? (
            theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

      </div>
    </header>
  );
}
