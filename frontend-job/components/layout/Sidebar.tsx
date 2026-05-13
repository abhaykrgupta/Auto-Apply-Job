'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, Search, Briefcase, Star,
  SendHorizontal, ClipboardList, Settings, BarChart3, Bot,
  Building2, ChevronLeft, ChevronRight, PenLine, UserCircle,
  Crown, Bookmark, Bell, Zap, Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/analytics', label: 'Analytics',  icon: BarChart3 },
    ],
  },
  {
    label: 'Job Search',
    items: [
      { href: '/resume',         label: 'Resume',         icon: FileText   },
      { href: '/companies',      label: 'Companies',      icon: Building2  },
      { href: '/search',         label: 'Search Jobs',    icon: Search     },
      { href: '/jobs',           label: 'All Jobs',       icon: Briefcase  },
      { href: '/matches',        label: 'AI Matches',     icon: Star       },
      { href: '/saved',          label: 'Saved Jobs',     icon: Bookmark   },
      { href: '/alerts',         label: 'Job Alerts',     icon: Bell       },
      { href: '/resume-builder', label: 'Resume Builder', icon: PenLine    },
    ],
  },
  {
    label: 'Applications',
    items: [
      { href: '/applications',  label: 'Applications',  icon: SendHorizontal },
      { href: '/manual-review', label: 'Manual Review', icon: ClipboardList  },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/profile',  label: 'Profile',  icon: UserCircle },
      { href: '/settings', label: 'Settings', icon: Settings   },
    ],
  },
];

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email?.[0]?.toUpperCase() ?? 'U';
}

export function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;
  const plan = (user as { plan?: string })?.plan ?? 'free';

  return (
    <aside className={cn(
      'hidden md:flex relative h-full shrink-0 flex-col bg-card transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
      'border-r-2 border-border/60',
      collapsed ? 'w-[64px]' : 'w-[248px]'
    )}>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand' : 'Collapse'}
        className="absolute -right-[13px] top-5 z-50 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-border/60 bg-card shadow-sm text-foreground/70 hover:text-foreground hover:border-border transition-all duration-200"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* ── Logo area — gradient header ── */}
      <div className={cn(
        'relative flex h-[64px] shrink-0 items-center overflow-hidden',
        'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent'
      )}>
        {/* Ambient top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-primary/6 to-transparent" />

        {/* Icon */}
        <div className="relative flex w-[64px] shrink-0 items-center justify-center">
          <div className="relative flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-md shadow-primary/25">
            <Bot className="h-[17px] w-[17px] text-white" />
            {/* Shine overlay */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
        </div>

        {/* Brand text */}
        <div className={cn(
          'flex flex-col pr-5 transition-[opacity,transform] duration-200',
          collapsed ? 'opacity-0 -translate-x-1 pointer-events-none' : 'opacity-100 translate-x-0'
        )}>
          <span className="text-[15px] font-extrabold tracking-tight leading-none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Job Agent
          </span>
          <div className="flex items-center gap-1.5 mt-[5px]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">
              AI Automations
            </span>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 sidebar-scroll">
        {navGroups.map((group, idx) => (
          <div key={group.label} className={idx > 0 ? 'mt-1' : ''}>

            {/* Group separator — thin gradient line instead of label text */}
            {idx > 0 && (
              <div className={cn(
                'transition-all duration-200',
                collapsed
                  ? 'mx-3 my-2 h-px bg-border/60'
                  : 'mx-3 my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent'
              )} />
            )}

            {/* Group label — only when expanded */}
            {!collapsed && (
              <div className="px-4 pb-0.5 pt-1">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/50 select-none">
                  {group.label}
                </span>
              </div>
            )}

            <div className="space-y-px px-2">
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
                      'group relative flex items-center rounded-lg py-[6px] text-[13px] font-medium transition-all duration-150 overflow-hidden',
                      active
                        ? 'text-primary'
                        : 'text-foreground/70 hover:text-foreground'
                    )}
                  >
                    {/* Active gradient background */}
                    {active && (
                      <motion.div
                        layoutId="sidebar-active-bg"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/12 via-primary/7 to-transparent"
                        transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                      />
                    )}

                    {/* Hover background */}
                    <div className={cn(
                      'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-muted/60',
                      active && 'opacity-0 group-hover:opacity-0'
                    )} />

                    {/* Active left bar */}
                    {active && (
                      <motion.div
                        layoutId="sidebar-active-bar"
                        className="absolute left-0 top-[20%] h-[60%] w-[3px] rounded-r-full bg-primary shadow-sm shadow-primary/40"
                        transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                      />
                    )}

                    {/* Icon container */}
                    <div className="relative flex w-[44px] shrink-0 items-center justify-center">
                      <Icon className={cn(
                        'h-[15px] w-[15px] shrink-0 transition-all duration-150',
                        active
                          ? 'text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]'
                          : 'text-foreground/60 group-hover:text-foreground/90'
                      )} />
                    </div>

                    {/* Label */}
                    <span className={cn(
                      'relative transition-[opacity,transform] duration-200',
                      collapsed ? 'opacity-0 -translate-x-1' : 'opacity-100 translate-x-0'
                    )}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Upgrade card (free plan only, expanded) ── */}
      {!collapsed && plan === 'free' && (
        <div className="mx-3 mb-2">
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 to-violet-500/5 px-3 py-3">
            <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-primary/8 blur-xl" />
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[12px] font-bold text-foreground/80">Upgrade to Pro</span>
            </div>
            <p className="text-[11px] text-foreground/65 mb-2.5 leading-relaxed">
              Unlimited matches, AI cover letters, priority queue.
            </p>
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-white hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30"
            >
              <Crown className="h-3 w-3" />
              Get Pro
            </Link>
          </div>
        </div>
      )}

      {/* ── User footer ── */}
      {user && (
        <div className={cn(
          'relative',
          'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-border/80 before:to-transparent'
        )}>
          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-2.5 px-3 py-3 hover:bg-muted/50 transition-colors',
              collapsed ? 'justify-center' : ''
            )}
          >
            <div className="relative shrink-0">
              <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                <AvatarImage src={user.image ?? ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary text-[10px] font-black">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-[1.5px] ring-card" />
            </div>

            <div className={cn(
              'flex flex-col min-w-0 flex-1 transition-[opacity,transform] duration-200',
              collapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
            )}>
              <span className="text-[13px] font-semibold truncate text-foreground leading-tight">
                {user.name ?? 'User'}
              </span>
              <span className={cn(
                'text-[10px] font-bold leading-tight mt-0.5 capitalize',
                plan === 'pro'        ? 'text-primary'   :
                plan === 'enterprise' ? 'text-amber-500' :
                                        'text-foreground/60'
              )}>
                {plan === 'pro' && '✦ '}{plan} plan
              </span>
            </div>

            {!collapsed && plan !== 'free' && (
              <div className="shrink-0 h-5 w-5 flex items-center justify-center rounded-md bg-primary/10">
                <Crown className="h-3 w-3 text-primary" />
              </div>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}
