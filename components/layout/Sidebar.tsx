'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Search,
  Briefcase,
  Star,
  SendHorizontal,
  ClipboardList,
  Settings,
  BarChart3,
  Bot,
  Building2,
  Zap,
  ChevronLeft,
  ChevronRight,
  PenLine,
} from 'lucide-react';
import { useState } from 'react';

export const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Job Search',
    items: [
      { href: '/resume', label: 'Resume', icon: FileText },
      { href: '/companies', label: 'Companies', icon: Building2 },
      { href: '/search', label: 'Search Jobs', icon: Search },
      { href: '/jobs', label: 'All Jobs', icon: Briefcase },
      { href: '/matches', label: 'AI Matches', icon: Star },
      { href: '/resume-builder', label: 'Resume Builder', icon: PenLine },
    ],
  },
  {
    label: 'Applications',
    items: [
      { href: '/applications', label: 'Applications', icon: SendHorizontal },
      { href: '/manual-review', label: 'Manual Review', icon: ClipboardList },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden md:flex relative h-full shrink-0 flex-col border-r border-border bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label="Toggle sidebar"
        className="absolute -right-3.5 top-5 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-md text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-lg transition-all duration-150"
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5" />
          : <ChevronLeft className="h-3.5 w-3.5" />
        }
      </button>

      {/* Logo */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border',
          collapsed ? 'justify-center' : 'px-3 gap-2.5'
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <>
            <span className="text-base font-bold tracking-tight">Job Agent</span>
            <span className="flex h-5 items-center rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
              AI
            </span>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {navGroups.map((group, groupIdx) => {
          const showLabel = !collapsed;
          const showSeparator = collapsed && groupIdx > 0;
          const showLabelText = showLabel && groupIdx > 0;
          const showFirstLabel = showLabel && groupIdx === 0;

          return (
            <div key={group.label} className="mb-1">
              {showSeparator && <hr className="my-2 border-border" />}
              {showFirstLabel && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              {showLabelText && (
                <p className="mb-1.5 mt-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                        collapsed && 'justify-center px-2',
                        !collapsed && active && 'border-l-2 border-primary',
                        !collapsed && !active && 'border-l-2 border-transparent',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          active
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-accent-foreground'
                        )}
                      />
                      {!collapsed && label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <span title="AI-powered automation">
              <Zap className="h-4 w-4 text-primary" />
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">AI-powered automation</p>
          </div>
        )}
      </div>
    </aside>
  );
}
