'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
  ChevronLeft,
  ChevronRight,
  PenLine,
  UserCircle,
  Crown,
} from 'lucide-react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
      { href: '/profile', label: 'Profile', icon: UserCircle },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email?.[0]?.toUpperCase() ?? 'U';
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;
  const plan = (user as { plan?: string })?.plan ?? 'free';

  return (
    <aside
      className={cn(
        'hidden md:flex relative h-full shrink-0 flex-col border-r border-border/50 bg-background/95 backdrop-blur-xl transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
        collapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label="Toggle sidebar"
        className="absolute -right-3.5 top-6 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-border/50 bg-background shadow-sm text-muted-foreground hover:text-foreground hover:shadow-md hover:border-border transition-all duration-200"
      >
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5" />
          : <ChevronLeft className="h-3.5 w-3.5" />
        }
      </button>

      {/* Logo Area */}
      <div className="flex h-[72px] shrink-0 items-center overflow-hidden whitespace-nowrap">
        {/* Fixed width container guarantees perfect centering in both states */}
        <div className="flex w-16 shrink-0 items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-600 shadow-sm ring-1 ring-primary/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <div
          className={cn(
            'flex flex-col transition-opacity duration-300',
            collapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          <span className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Job Agent
          </span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            AI Automations
          </span>
        </div>
      </div>

      {/* Nav Content */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {navGroups.map((group, groupIdx) => {
          const showSeparator = collapsed && groupIdx > 0;

          return (
            <div key={group.label} className="mb-2">
              {showSeparator && <div className="mx-auto w-8 h-[1px] bg-border/50 mb-2 transition-all duration-300" />}
              
              <div
                className={cn(
                  'overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap',
                  collapsed ? 'h-0 opacity-0' : 'h-8 opacity-100'
                )}
              >
                <p className="px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/40">
                  {group.label}
                </p>
              </div>

              <div className="space-y-1 px-2">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname === href || pathname.startsWith(href + '/');
                    
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className={cn(
                        'group relative flex items-center rounded-xl py-2 text-[13px] font-medium transition-colors duration-200 ease-out overflow-hidden whitespace-nowrap',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground/55 hover:bg-muted/80 hover:text-foreground'
                      )}
                    >
                      {/* Active Indicator Bar */}
                      {active && (
                        <motion.div
                          layoutId="active-nav"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      {/* 48px fixed container centers the icon nicely in the 64px width (minus the px-2) */}
                      <div className="flex w-12 shrink-0 items-center justify-center">
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors duration-200',
                            active
                              ? 'text-primary'
                              : 'text-foreground/45 group-hover:text-foreground'
                          )}
                        />
                      </div>
                      
                      <span
                        className={cn(
                          'transition-opacity duration-300',
                          collapsed ? 'opacity-0' : 'opacity-100'
                        )}
                      >
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      {user && (
        <Link
          href="/profile"
          className={cn(
            'mx-2 mb-3 flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 p-2 hover:bg-muted/60 transition-colors overflow-hidden',
            collapsed ? 'justify-center' : ''
          )}
        >
          <Avatar className="h-7 w-7 shrink-0 ring-2 ring-primary/20">
            <AvatarImage src={user.image ?? ''} />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-violet-500/30 text-primary text-[10px] font-bold">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className={cn('flex flex-col min-w-0 flex-1 transition-opacity duration-300', collapsed ? 'opacity-0 w-0' : 'opacity-100')}>
            <span className="text-[13px] font-semibold truncate leading-tight">{user.name ?? 'User'}</span>
            <span className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-medium leading-tight capitalize',
              plan === 'pro' ? 'text-primary' : plan === 'enterprise' ? 'text-amber-500' : 'text-foreground/45'
            )}>
              {plan === 'pro' && <Crown className="h-2.5 w-2.5" />}
              {plan} plan
            </span>
          </div>
        </Link>
      )}
    </aside>
  );
}
