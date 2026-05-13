'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Menu, X, Bot, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { navGroups } from './Sidebar';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';
import type { LucideIcon } from 'lucide-react';

const pageMeta: Record<string, { title: string; icon: LucideIcon }> = {};

// Build pageMeta from navGroups at module load
for (const group of navGroups) {
  for (const item of group.items) {
    pageMeta[item.href] = { title: item.label, icon: item.icon };
  }
}

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

  // Find current page meta — try exact match first, then prefix match
  const page = pageMeta[pathname]
    ?? Object.entries(pageMeta).find(([k]) => k !== '/dashboard' && pathname.startsWith(k + '/'))?.[ 1]
    ?? { title: 'Job Agent', icon: Bot };

  const PageIcon = page.icon;

  return (
    <>
      {/* ── Main header ── */}
      <header className={cn(
        'sticky top-0 z-40 flex h-[56px] shrink-0 items-center justify-between',
        'border-b-2 border-border/60',
        'bg-card/85 backdrop-blur-md',
        'px-4 sm:px-6',
      )}>

        {/* Left — page identity */}
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden h-8 w-8 rounded-lg"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Page icon + title */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/80 border border-border/60">
              <PageIcon className="h-3.5 w-3.5 text-foreground/75" />
            </div>
            <span className="text-[14px] font-bold text-foreground tracking-tight">
              {page.title}
            </span>
          </div>
        </div>

        {/* Right — controls */}
        <div className="flex items-center gap-1.5">

          {/* Auto-Apply pill */}
          {settings !== undefined && (
            <Link
              href="/settings"
              title={autoApplyOn ? 'Auto-Apply is ON' : 'Auto-Apply is OFF — click to enable'}
              className={cn(
                'hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border transition-all duration-200',
                autoApplyOn
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-400'
                  : 'bg-muted/60 border-border text-foreground/65 hover:bg-muted hover:text-foreground/70'
              )}
            >
              {autoApplyOn ? (
                <>
                  {/* Pulse dot when ON */}
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Auto-Apply: ON
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground/25" />
                  Auto-Apply: OFF
                </>
              )}
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-foreground/65 hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            {mounted
              ? theme === 'dark'
                ? <Sun  className="h-3.5 w-3.5" />
                : <Moon className="h-3.5 w-3.5" />
              : <Moon className="h-3.5 w-3.5" />
            }
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-border/60 mx-0.5" />

          {/* User menu */}
          <UserMenu />
        </div>
      </header>

      {/* ── Mobile fullscreen menu ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-card md:hidden">
          {/* Mobile header */}
          <div className="flex h-[56px] shrink-0 items-center justify-between px-4 border-b-2 border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-sm">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-extrabold tracking-tight">Job Agent</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground/65 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navGroups.map((group, idx) => (
              <div key={group.label} className={idx > 0 ? 'mt-4' : ''}>
                <p className="px-2 mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-foreground/30">
                  {group.label}
                </p>
                <div className="space-y-px">
                  {group.items.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground/55 hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className={cn(
                          'h-4 w-4 shrink-0',
                          active ? 'text-primary' : 'text-foreground/60'
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
