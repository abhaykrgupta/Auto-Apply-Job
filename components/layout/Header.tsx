'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, ChevronRight, Menu, X, Bot, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navGroups } from './Sidebar';
import { cn } from '@/lib/utils';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 30_000,
  });

  const autoApplyOn = settings?.autoApplyEnabled === true;

  const page = pageTitles[pathname] ?? { title: 'Job Agent', description: '' };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-sm relative z-40">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden h-9 w-9 mr-1 rounded-lg"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-semibold text-foreground">{page.title}</h1>
          {page.description && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground hidden sm:block">{page.description}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-Apply status pill */}
          {settings !== undefined && (
            <Link
              href="/settings"
              title={autoApplyOn ? 'Auto-Apply is ON — click to configure' : 'Auto-Apply is OFF — click to enable'}
              className={cn(
                'hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors',
                autoApplyOn
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900'
                  : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900'
              )}
            >
              {autoApplyOn
                ? <><Zap className="h-3 w-3" /> Auto-Apply: ON</>
                : <><ZapOff className="h-3 w-3" /> Auto-Apply: OFF</>}
            </Link>
          )}
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden animate-in slide-in-from-left duration-200">
          <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-base font-bold tracking-tight">Job Agent</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className={cn(
                          'h-4 w-4 shrink-0',
                          active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
                        )} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
