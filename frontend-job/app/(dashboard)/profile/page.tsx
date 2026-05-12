'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  MapPin, DollarSign, Crown, Sparkles,
  Loader2, LogOut, Trash2, Save, ExternalLink,
  Phone, User, Briefcase, Lock, ArrowRight, ArrowUpRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

/* ─── Helpers ─── */
function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email?.[0]?.toUpperCase() ?? 'U';
}

const planMeta = {
  free:       { label: 'Free',       icon: null,     ring: 'ring-border/50',      badge: 'bg-foreground/[0.06] text-foreground/50' },
  pro:        { label: 'Pro',        icon: Crown,    ring: 'ring-primary/35',     badge: 'bg-primary/10 text-primary' },
  enterprise: { label: 'Enterprise', icon: Sparkles, ring: 'ring-amber-400/35',   badge: 'bg-amber-400/10 text-amber-500' },
};

/* ─── Field label ─── */
function FL({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-foreground/50 mb-2 select-none">
      {children}
    </p>
  );
}

/* ─── Input ─── */
function FInput({
  trailingIcon,
  trailingHref,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  trailingIcon?: React.ReactNode;
  trailingHref?: string;
}) {
  return (
    <div className="relative">
      <input
        className={`
          w-full h-11 rounded-xl border-2 border-border/55 bg-background/60 px-4 text-[14px]
          text-foreground placeholder:text-foreground/25
          outline-none transition-all duration-150
          focus:border-foreground/30 focus:bg-background focus:ring-4 focus:ring-foreground/[0.04]
          disabled:opacity-40
          ${trailingIcon ? 'pr-10' : ''}
          ${className}
        `}
        {...props}
      />
      {trailingIcon && trailingHref && (
        <a
          href={trailingHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 transition-colors"
        >
          {trailingIcon}
        </a>
      )}
    </div>
  );
}

/* ─── Two-column section row ─── */
function Row({
  title,
  description,
  children,
  last = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-x-10 gap-y-4 py-6 ${!last ? 'border-b border-border/30' : ''}`}>
      {/* Left — section identity */}
      <div className="lg:pt-1">
        <h3 className="text-[14px] font-semibold text-foreground tracking-tight">{title}</h3>
        {description && (
          <p className="mt-1 text-[12px] text-foreground/45 leading-relaxed font-normal max-w-[200px]">
            {description}
          </p>
        )}
      </div>
      {/* Right — fields */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ─── Tab underline style ─── */
function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative pb-3 text-[14px] font-medium transition-colors duration-150 outline-none
        ${active ? 'text-foreground' : 'text-foreground/40 hover:text-foreground/70'}
      `}
    >
      {children}
      {active && (
        <motion.div
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        />
      )}
    </button>
  );
}

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  bio?: string;
  remotePreference?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  preferredRoles?: string[];
  preferredLocations?: string[];
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const plan = (user as { plan?: string })?.plan ?? 'free';
  const meta = planMeta[plan as keyof typeof planMeta] ?? planMeta.free;
  const PlanIcon = meta.icon;

  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'personal' | 'preferences' | 'security'>('personal');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [formData, setFormData] = useState<ProfileData>({
    name: user?.name ?? '',
    email: user?.email ?? '',
  });

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) return null;
      return res.json() as Promise<ProfileData>;
    },
  });

  useEffect(() => {
    if (profileData) setFormData(prev => ({ ...prev, ...profileData }));
  }, [profileData]);

  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: async (data: ProfileData) => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Saved');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateSession();
    },
    onError: () => toast.error('Failed to save'),
  });

  const set = (key: keyof ProfileData, value: unknown) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  if (!user) return null;

  return (
    <div className="max-w-[780px] mx-auto px-6 md:px-8 pt-6 pb-20">

      {/* ── Profile identity strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-5 pb-6 mb-0"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className={`h-[68px] w-[68px] ring-2 ring-offset-2 ring-offset-background ${meta.ring}`}>
            <AvatarImage src={user.image ?? ''} />
            <AvatarFallback className="text-[17px] font-bold bg-primary/10 text-primary">
              {getInitials(formData.name, formData.email)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0.5 right-0.5 h-[11px] w-[11px] rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>

        {/* Name + plan */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[20px] font-bold tracking-tight">{formData.name || 'Your Name'}</span>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-[3px] rounded-md ${meta.badge}`}>
              {PlanIcon && <PlanIcon className="h-3 w-3" />}
              {meta.label}
            </span>
          </div>
          <p className="text-[13px] text-foreground/45 mt-0.5">{user.email}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {plan === 'free' && (
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:bg-foreground/88 active:scale-[0.98] transition-all duration-150">
              <Crown className="h-3.5 w-3.5" />
              Upgrade
            </button>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-medium text-foreground/40 hover:text-foreground/80 hover:bg-muted/60 transition-all duration-150"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </motion.div>

      {/* ── Underline tabs ── */}
      <div className="flex items-center gap-7 border-b border-border/30 mb-0 mt-1">
        <TabBtn active={tab === 'personal'}     onClick={() => setTab('personal')}>Personal</TabBtn>
        <TabBtn active={tab === 'preferences'}  onClick={() => setTab('preferences')}>Preferences</TabBtn>
        <TabBtn active={tab === 'security'}     onClick={() => setTab('security')}>Security</TabBtn>
      </div>

      {/* ── Personal ── */}
      {tab === 'personal' && (
        <motion.div
          key="personal"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/25" />
            </div>
          ) : (
            <>
              <Row title="Basic info" description="Your name and contact info visible inside the app">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FL>Full name</FL>
                    <FInput value={formData.name} onChange={e => set('name', e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <FL>Email address</FL>
                    <FInput value={formData.email} onChange={e => set('email', e.target.value)} type="email" placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <FL>Bio</FL>
                  <textarea
                    className="w-full rounded-xl border-2 border-border/55 bg-background/60 px-4 py-3 text-[14px] text-foreground placeholder:text-foreground/25 outline-none transition-all duration-150 resize-none h-[84px] focus:border-foreground/30 focus:bg-background focus:ring-4 focus:ring-foreground/[0.04]"
                    value={formData.bio ?? ''}
                    onChange={e => set('bio', e.target.value)}
                    placeholder="A line about yourself — what you do, what you're looking for"
                  />
                </div>

                <div className="max-w-xs">
                  <FL>Phone</FL>
                  <FInput value={formData.phone ?? ''} onChange={e => set('phone', e.target.value)} type="tel" placeholder="+1 (555) 000-0000" />
                </div>
              </Row>

              <Row title="Links" description="Make it easy for employers to find you" last>
                {[
                  { key: 'linkedin' as const,  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/handle' },
                  { key: 'github' as const,    label: 'GitHub',    placeholder: 'https://github.com/username' },
                  { key: 'portfolio' as const, label: 'Portfolio', placeholder: 'https://yoursite.com' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <FL>{label}</FL>
                    <FInput
                      value={formData[key] ?? ''}
                      onChange={e => set(key, e.target.value)}
                      placeholder={placeholder}
                      trailingIcon={formData[key] ? <ArrowUpRight className="h-4 w-4" /> : undefined}
                      trailingHref={formData[key] ?? undefined}
                    />
                  </div>
                ))}
              </Row>
            </>
          )}

          <div className="flex justify-end pt-6">
            <button
              onClick={() => saveProfile(formData)}
              disabled={isSaving}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:bg-foreground/88 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isSaving
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                : <><Save className="h-3.5 w-3.5" /> Save changes</>}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Preferences ── */}
      {tab === 'preferences' && (
        <motion.div
          key="preferences"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <Row title="Work style" description="How and where you want to work">
            <div>
              <FL>Remote preference</FL>
              <Select value={formData.remotePreference ?? 'any'} onValueChange={v => set('remotePreference', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any — remote, hybrid, or on-site</SelectItem>
                  <SelectItem value="remote">Remote only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FL>Min salary</FL>
                <FInput type="number" placeholder="80,000" value={formData.salaryMin ?? ''} onChange={e => set('salaryMin', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
              <div>
                <FL>Max salary</FL>
                <FInput type="number" placeholder="150,000" value={formData.salaryMax ?? ''} onChange={e => set('salaryMax', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
            </div>
          </Row>

          <Row title="Job targets" description="Roles and locations used to match and auto-apply" last>
            <div>
              <FL>Target roles</FL>
              <FInput
                placeholder="e.g. Software Engineer, Full Stack Developer"
                value={formData.preferredRoles?.join(', ') ?? ''}
                onChange={e => set('preferredRoles', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
              <p className="mt-2 text-[12px] text-foreground/35">Comma-separated</p>
            </div>
            <div>
              <FL>Preferred locations</FL>
              <FInput
                placeholder="e.g. New York, London, Remote"
                value={formData.preferredLocations?.join(', ') ?? ''}
                onChange={e => set('preferredLocations', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              />
              <p className="mt-2 text-[12px] text-foreground/35">Comma-separated</p>
            </div>
          </Row>

          <div className="flex justify-end pt-6">
            <button
              onClick={() => saveProfile(formData)}
              disabled={isSaving}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:bg-foreground/88 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isSaving
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                : <><Save className="h-3.5 w-3.5" /> Save changes</>}
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Security ── */}
      {tab === 'security' && (
        <motion.div
          key="security"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <Row title="Password" description="Update your sign-in credentials">
            <div className="text-[13px] text-foreground/45 leading-relaxed bg-muted/40 rounded-xl px-4 py-3.5 border border-border/30">
              Password reset by email is coming soon. Use{' '}
              <span className="font-medium text-foreground/65">"Forgot password"</span>{' '}
              on the sign-in page for now.
            </div>
          </Row>

          <Row title="Danger zone" description="Irreversible actions — proceed with care" last>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-foreground/80">Delete account</p>
                <p className="text-[13px] text-foreground/40 mt-0.5">Removes all data permanently. No recovery.</p>
              </div>
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-medium text-foreground/40 hover:text-destructive hover:bg-destructive/8 transition-all duration-150"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </Row>
        </motion.div>
      )}

      {/* ── Delete dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">Delete your account?</DialogTitle>
            <DialogDescription className="text-[13px] text-foreground/50 leading-relaxed">
              This is permanent. All resumes, applications, and settings will be deleted.
              Type <strong className="text-foreground font-semibold">DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <input
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            placeholder="Type DELETE"
            className="w-full h-11 rounded-xl border-2 border-border/55 bg-background px-4 text-[14px] text-foreground placeholder:text-foreground/25 outline-none focus:border-destructive/50 focus:ring-4 focus:ring-destructive/8 transition-all duration-150"
          />
          <DialogFooter>
            <button
              className="h-9 px-4 rounded-xl text-[13px] font-medium text-foreground/45 hover:text-foreground hover:bg-muted/60 transition-all"
              onClick={() => { setDeleteDialogOpen(false); setDeleteInput(''); }}
            >
              Cancel
            </button>
            <button
              className="h-9 px-4 rounded-xl text-[13px] font-semibold bg-destructive text-white hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              disabled={deleteInput !== 'DELETE'}
              onClick={() => { toast.error('Contact support to delete your account.'); setDeleteDialogOpen(false); setDeleteInput(''); }}
            >
              Delete account
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
