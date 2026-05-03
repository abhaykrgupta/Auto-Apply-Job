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
} from 'lucide-react';
import { useState } from 'react';

const navGroups = [
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
    <aside className={cn(
      'flex h-full shrink-0 flex-col border-r border-border bg-card transition-all duration-200',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-3 gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <>
            <span className="text-base font-bold tracking-tight">Job Agent</span>
            <span className="ml-auto flex h-5 items-center rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
              AI
            </span>
          </>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
            collapsed && 'mx-auto ml-0'
          )}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
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
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className={cn(
                      'h-4 w-4 shrink-0',
                      active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
                    )} />
                    {!collapsed && label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">AI-powered automation</p>
          </div>
        </div>
      )}
    </aside>
  );
}
