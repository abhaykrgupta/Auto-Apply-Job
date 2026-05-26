import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, ChevronRight } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="w-full border-b border-border/40 bg-background bg-dot-pattern">
      <div className="mx-auto max-w-7xl px-6 md:px-10 flex h-[3.75rem] items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-[7px] bg-primary text-primary-foreground">
              <Bot className="h-[1.0625rem] w-[1.0625rem]" />
            </div>
            <span className="font-semibold text-[0.9375rem] tracking-[-0.02em]">JobAgent</span>
          </Link>

            <nav className="hidden md:flex items-center gap-1.5">
            {[
              { href: '/features', label: 'Features' },
              { href: '/how-it-works', label: 'How it works' },
              { href: '/resume-builder', label: 'Resume Builder' },
              { href: '/resume-ai', label: 'Resume AI' },
              { href: '/pricing', label: 'Pricing' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-md text-[0.9375rem] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-1">
          <Link href="/login">
            <Button variant="ghost" className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hidden md:flex">
              Log in
            </Button>
          </Link>
          <Link href="/dashboard">
            <button className="inline-flex items-center gap-2 rounded-md h-9 px-5 text-[0.875rem] font-bold uppercase tracking-wider bg-foreground text-background border border-foreground/10 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] hover:bg-foreground/90 hover:-translate-y-px active:translate-y-0 transition-all duration-150">
              Get started <ChevronRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
