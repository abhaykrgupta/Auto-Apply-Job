'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserCircle, Settings, LogOut, Crown } from 'lucide-react';

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email?.[0]?.toUpperCase() ?? 'U';
}

export function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;
  const plan = (user as { plan?: string })?.plan ?? 'free';

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="
            flex items-center gap-2 rounded-lg py-1 pl-1 pr-2.5
            hover:bg-muted/80 transition-colors duration-150 outline-none
            focus-visible:ring-2 focus-visible:ring-primary/30
          "
          aria-label="Account menu"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.image ?? ''} />
            <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          {/* Only show name on wider screens */}
          <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
            <span className="text-[12px] font-semibold truncate max-w-[90px]">
              {user.name?.split(' ')[0] ?? 'Account'}
            </span>
            <span className={`text-[10px] capitalize font-medium ${plan === 'pro' ? 'text-primary' : plan === 'enterprise' ? 'text-amber-400' : 'text-muted-foreground/60'}`}>
              {plan}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="w-52">
        {/* Header — just email */}
        <div className="px-3 py-2">
          <p className="text-[11px] text-muted-foreground/55 truncate">{user.email}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <UserCircle className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        {plan === 'free' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/pricing" className="cursor-pointer text-primary font-medium [&_svg]:text-primary/70">
                <Crown className="h-4 w-4" />
                Upgrade to Pro
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
