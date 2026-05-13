'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Key, Bot, Globe, Bell, Briefcase, CheckCircle2, Loader2, Link2, Unlink, RefreshCw, Puzzle, Copy, RotateCcw } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';

interface AppSettings {
  autoApplyEnabled: boolean;
  requireConfirmation: boolean;
  maxApplicationsPerDay: number;
  minMatchScore: number;
  emailNotifications: boolean;
  dailyDigest: boolean;
  weeklySummary: boolean;
  remotePreference: string;
  salaryMin: number | null;
  maxConcurrent: number;
  headless: boolean;
  requestDelayMs: number;
}

const DEFAULTS: AppSettings = {
  autoApplyEnabled: false,
  requireConfirmation: true,
  maxApplicationsPerDay: 50,
  minMatchScore: 70,
  emailNotifications: false,
  dailyDigest: false,
  weeklySummary: false,
  remotePreference: 'any',
  salaryMin: null,
  maxConcurrent: 3,
  headless: true,
  requestDelayMs: 2000,
};

/* ─── Reusable label ─── */
function FL({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-foreground/50 mb-2 select-none">{children}</p>;
}

/* ─── Reusable input ─── */
function SInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full h-11 rounded-xl border-2 border-border/60 bg-card px-4 text-[14px] text-foreground placeholder:text-foreground/28 outline-none transition-all duration-150 focus:border-foreground/35 focus:ring-4 focus:ring-foreground/[0.05] disabled:opacity-40"
      {...props}
    />
  );
}

/* ─── Two-column settings row ─── */
function Row({ title, description, children, last = false }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-x-10 gap-y-4 py-6 ${!last ? 'border-b border-border/30' : ''}`}>
      <div className="lg:pt-1">
        <h3 className="text-[14px] font-semibold text-foreground tracking-tight">{title}</h3>
        {description && <p className="mt-1 text-[12px] text-foreground/45 leading-relaxed font-normal max-w-[200px]">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ─── Toggle row ─── */
function ToggleRow({ label, desc, checked, onCheckedChange, disabled }: {
  label: string;
  desc?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-6 py-1 transition-opacity ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div>
        <p className="text-[14px] font-medium text-foreground/80">{label}</p>
        {desc && <p className="text-[13px] text-foreground/45 mt-0.5 font-normal leading-relaxed">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="shrink-0" />
    </div>
  );
}

/* ─── LinkedIn connection ─── */
function LinkedInConnectionCard() {
  const [status, setStatus] = useState<'loading' | 'no_creds' | 'connected' | 'disconnected' | 'connecting' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  async function fetchStatus() {
    setStatus('loading');
    try {
      const res = await fetch('/api/linkedin/connect');
      const d = await res.json();
      setStatus(d.status);
    } catch { setStatus('error'); }
  }

  async function connect() {
    setStatus('connecting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/linkedin/connect', { method: 'POST' });
      const d = await res.json();
      if (d.ok) { setStatus('connected'); toast.success('LinkedIn connected!'); }
      else { setStatus('error'); setErrorMsg(d.error ?? 'Connection failed'); toast.error(d.error ?? 'Connection failed'); }
    } catch { setStatus('error'); toast.error('Failed to connect'); }
  }

  async function disconnect() {
    await fetch('/api/linkedin/connect', { method: 'DELETE' });
    setStatus('disconnected');
    toast.info('LinkedIn session cleared');
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStatus(); }, []);

  const statusEl = {
    loading:      <span className="text-[12px] text-foreground/45 flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Checking…</span>,
    no_creds:     <span className="text-[12px] text-amber-600 font-medium">Credentials not set in .env</span>,
    connected:    <span className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Connected</span>,
    disconnected: <span className="text-[12px] text-foreground/40">Not connected</span>,
    connecting:   <span className="text-[12px] text-foreground/45 flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Logging in…</span>,
    error:        <span className="text-[12px] text-destructive font-medium">Connection error</span>,
  }[status];

  return (
    <div className="space-y-5">
      {/* .env setup */}
      <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-foreground/40 mb-2.5">Step 1 — Add to .env.local</p>
        <pre className="text-[12px] font-mono bg-background border border-border/50 rounded-lg p-3 overflow-x-auto select-all text-foreground/70">{`LINKEDIN_EMAIL=your@email.com\nLINKEDIN_PASSWORD=yourpassword\nLINKEDIN_MAX_JOBS=20`}</pre>
        <p className="text-[12px] text-foreground/40 mt-2">Keep under 50 jobs per scrape to avoid rate limiting.</p>
      </div>

      {/* Connect */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-foreground/40 mb-3">Step 2 — Connect session</p>
        {status === 'connecting' && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 p-4 text-[13px] text-amber-700 dark:text-amber-300 mb-3">
            <p className="font-semibold mb-1">A browser window is opening</p>
            <p className="text-amber-600/80 dark:text-amber-400/80">Enter any OTP/verification code in that window. Session saves automatically. You have 3 minutes.</p>
          </div>
        )}
        <div className="flex items-center gap-3">
          {statusEl}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={fetchStatus} disabled={status === 'loading' || status === 'connecting'}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {status === 'connected'
              ? <Button variant="outline" size="sm" onClick={disconnect} className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/8"><Unlink className="h-3.5 w-3.5" />Disconnect</Button>
              : <Button size="sm" onClick={connect} disabled={status === 'connecting' || status === 'no_creds'} className="gap-1.5"><Link2 className="h-3.5 w-3.5" />{status === 'connecting' ? 'Connecting…' : 'Connect LinkedIn'}</Button>
            }
          </div>
        </div>
        {errorMsg && <p className="text-[12px] text-destructive mt-2">{errorMsg}</p>}
      </div>

      {/* Safety */}
      <div className="rounded-xl bg-primary/[0.04] dark:bg-primary/[0.08] border border-primary/10 p-4">
        <p className="text-[12px] font-semibold text-foreground/60 mb-2">Account safety</p>
        <ul className="space-y-1 text-[12px] text-foreground/50 list-disc list-inside">
          <li>Login once — session reused until it expires</li>
          <li>2–5 second random delay between every job page</li>
          <li>Pages visited one at a time (no parallel tabs)</li>
          <li>Stops immediately if a CAPTCHA is detected</li>
        </ul>
      </div>
    </div>
  );
}

function TelegramTestButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  async function test() {
    setStatus('loading');
    try {
      const res = await fetch('/api/notifications/telegram-test', { method: 'POST' });
      const data = await res.json();
      if (data.success) { setStatus('ok'); toast.success('Test message sent to Telegram!'); }
      else { setStatus('error'); toast.error(data.error ?? 'Failed'); }
    } catch { setStatus('error'); toast.error('Failed to connect'); }
  }
  return (
    <Button variant="outline" size="sm" onClick={test} disabled={status === 'loading'}>
      {status === 'loading' ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Sending…</> : status === 'ok' ? '✅ Connected!' : '📱 Test Telegram'}
    </Button>
  );
}

function OpenAITestButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  async function test() {
    setStatus('loading');
    try {
      const res = await fetch('/api/resume-builder/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-summary', data: { experience: [{ title: 'Engineer', company: 'Acme', startDate: '2020', current: true }], education: [{ degree: 'B.S.', field: 'CS', school: 'MIT' }], skills: { technical: ['JavaScript'] } } }),
      });
      const data = await res.json();
      if (res.ok && data.result) { setStatus('ok'); toast.success('OpenAI connection works!'); }
      else { setStatus('error'); toast.error(data.error ?? 'AI request failed'); }
    } catch { setStatus('error'); toast.error('Failed to reach OpenAI'); }
  }
  return (
    <Button variant="outline" size="sm" onClick={test} disabled={status === 'loading'}>
      {status === 'loading' ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Testing…</> : status === 'ok' ? '✅ Connected!' : '🤖 Test OpenAI'}
    </Button>
  );
}

/* ─── Chrome Extension connect ─── */
function ExtensionConnectSection() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  async function fetchToken() {
    setLoading(true);
    try {
      const res = await fetch('/api/copilot/token');
      const d = await res.json();
      setToken(d.token ?? null);
    } catch { toast.error('Failed to generate token'); }
    finally { setLoading(false); }
  }

  async function revokeToken() {
    setRevoking(true);
    try {
      await fetch('/api/copilot/token', { method: 'DELETE' });
      setToken(null);
      toast.info('Extension token revoked');
    } catch { toast.error('Failed to revoke token'); }
    finally { setRevoking(false); }
  }

  function copyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Token copied — paste it in the extension popup');
  }

  return (
    <Row title="Chrome Extension" description="Connect the Co-Pilot extension to sync your profile and track applications">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Puzzle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-medium leading-tight">Job Agent Co-Pilot</p>
            <p className="text-[12px] text-foreground/45 mt-0.5 leading-relaxed">
              Auto-fills job applications on Greenhouse, Lever, Workday, Ashby, LinkedIn and 15+ more platforms.
            </p>
          </div>
        </div>

        {!token ? (
          <button
            onClick={fetchToken}
            disabled={loading}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-foreground text-background text-[13px] font-semibold hover:bg-foreground/88 disabled:opacity-40 transition-all duration-150"
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…</>
              : <><Link2 className="h-3.5 w-3.5" />Generate Extension Token</>
            }
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/50 mb-2">Your Extension Token</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 h-10 flex items-center px-3 rounded-xl bg-muted/60 border border-border/40 text-[12px] font-mono text-foreground/70 overflow-hidden text-ellipsis whitespace-nowrap">
                  {token}
                </code>
                <button
                  onClick={copyToken}
                  title="Copy token"
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-border/40 bg-muted/30 hover:bg-muted/60 transition-colors shrink-0"
                >
                  {copied
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <Copy className="h-4 w-4 text-foreground/50" />
                  }
                </button>
                <button
                  onClick={revokeToken}
                  disabled={revoking}
                  title="Revoke token"
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-border/40 bg-muted/30 hover:bg-destructive/10 hover:border-destructive/30 transition-colors shrink-0"
                >
                  {revoking
                    ? <Loader2 className="h-4 w-4 animate-spin text-foreground/40" />
                    : <RotateCcw className="h-4 w-4 text-foreground/40" />
                  }
                </button>
              </div>
            </div>
            <ol className="text-[12px] text-foreground/50 space-y-1 list-decimal list-inside leading-relaxed">
              <li>Open the extension popup (click 🤖 in Chrome toolbar)</li>
              <li>Click <strong className="text-foreground/70">Sync Profile</strong> — it will use this token automatically</li>
              <li>Your profile syncs from this dashboard to the extension</li>
            </ol>
          </div>
        )}
      </div>
    </Row>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<AppSettings>(DEFAULTS);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: saved } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return {};
      return res.json();
    },
  });

  useEffect(() => {
    if (saved && Object.keys(saved).length > 0) setS(prev => ({ ...prev, ...saved }));
  }, [saved]);

  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
      if (!res.ok) throw new Error('Save failed');
    },
    onSuccess: () => { toast.success('Settings saved'); setLastSaved(new Date()); },
    onError: () => toast.error('Failed to save settings'),
  });

  const set = (key: keyof AppSettings, value: unknown) => setS(prev => ({ ...prev, [key]: value }));
  const fullyAutomatic = s.autoApplyEnabled && !s.requireConfirmation;

  return (
    <div className="max-w-[780px] mx-auto px-6 md:px-8 pt-6 pb-20">

      {/* Page header */}
      <div className="flex items-end justify-between pb-5 border-b border-border/30 mb-0">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight leading-none">Settings</h2>
          <p className="text-[14px] text-foreground/45 mt-2">Configure your job application automation</p>
        </div>
        {lastSaved && (
          <p className="text-[12px] text-foreground/40 flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Saved {format(lastSaved, 'h:mm a')}
          </p>
        )}
      </div>

      {/* API Keys */}
      <Row title="API Keys" description="Set in .env.local — never committed to git">
        <div className="space-y-5">
          {[
            { label: 'OpenAI API Key',        placeholder: 'sk-...',              hint: 'platform.openai.com' },
            { label: 'Database URL',           placeholder: 'postgresql://...',    hint: 'Supabase → Settings → Database' },
            { label: 'Resend API Key (Email)', placeholder: 're_...',              hint: 'resend.com/api-keys' },
          ].map(({ label, placeholder, hint }) => (
            <div key={label}>
              <FL>{label}</FL>
              <SInput type="password" placeholder={placeholder} disabled value="Set in .env.local" />
              <p className="mt-1.5 text-[12px] text-foreground/38">{hint}</p>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <OpenAITestButton />
            <TelegramTestButton />
          </div>
        </div>
      </Row>

      {/* LinkedIn */}
      <Row title="LinkedIn" description="Connect to scrape full job descriptions">
        <LinkedInConnectionCard />
      </Row>

      {/* Auto-Apply */}
      <Row
        title="Auto-Apply"
        description={
          fullyAutomatic ? 'Fully automatic — submits without asking'
          : s.autoApplyEnabled ? 'Partial — fills forms, waits for confirmation'
          : 'Paused — no automatic applications'
        }
      >
        <div className="space-y-1">
          <ToggleRow
            label="Enable Auto-Apply"
            desc="Let the bot apply to matched jobs automatically"
            checked={s.autoApplyEnabled}
            onCheckedChange={v => set('autoApplyEnabled', v)}
          />
          <ToggleRow
            label="Require Confirmation"
            desc="Bot fills forms but pauses for your review before submitting"
            checked={s.requireConfirmation}
            onCheckedChange={v => set('requireConfirmation', v)}
            disabled={!s.autoApplyEnabled}
          />
          {s.autoApplyEnabled && (
            <div className={`rounded-xl px-4 py-3 text-[13px] font-medium mt-2 ${fullyAutomatic ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'}`}>
              {fullyAutomatic ? '✅ Fully automatic: bot fills AND submits without pausing' : '⚠️ Turn off "Require Confirmation" for fully hands-free mode'}
            </div>
          )}
          <ToggleRow
            label="Headless Browser"
            desc="Hide the browser window. Turn off to watch/debug."
            checked={s.headless}
            onCheckedChange={v => set('headless', v)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <div>
            <FL>Max applications / day</FL>
            <SInput type="number" value={s.maxApplicationsPerDay} onChange={(e: ChangeEvent<HTMLInputElement>) => set('maxApplicationsPerDay', parseInt(e.target.value) || 50)} />
          </div>
          <div>
            <FL>Min match score (%)</FL>
            <SInput type="number" min="0" max="100" value={s.minMatchScore} onChange={(e: ChangeEvent<HTMLInputElement>) => set('minMatchScore', parseInt(e.target.value) || 70)} />
            <p className="mt-1.5 text-[12px] text-foreground/38">Only apply to jobs ≥ {s.minMatchScore}%</p>
          </div>
        </div>

        <div>
          <FL>Max concurrent applications</FL>
          <Select value={String(s.maxConcurrent)} onValueChange={v => set('maxConcurrent', parseInt(v ?? '3'))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 3, 5, 10].map(n => <SelectItem key={n} value={String(n)}>{n} at a time</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Row>

      {/* Notifications */}
      <Row title="Notifications" description="Email + Telegram alerts on activity">
        <div className="space-y-1">
          <ToggleRow label="Email Notifications"    desc="Updates on application activity"           checked={s.emailNotifications} onCheckedChange={v => set('emailNotifications', v)} />
          <ToggleRow label="Daily Digest (8 AM)"    desc="Morning summary of jobs and applications"  checked={s.dailyDigest}        onCheckedChange={v => set('dailyDigest', v)} />
          <ToggleRow label="Weekly Summary (Sunday)" desc="Full-week analytics and report"           checked={s.weeklySummary}      onCheckedChange={v => set('weeklySummary', v)} />
        </div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-foreground/45 mb-3">Telegram setup</p>
          <ol className="space-y-1.5 text-[13px] text-foreground/50 list-decimal list-inside">
            <li>Message <strong className="text-foreground/70">@BotFather</strong> → /newbot → copy token</li>
            <li>Add <code className="bg-muted px-1.5 py-0.5 rounded-md text-[12px]">TELEGRAM_BOT_TOKEN=...</code> to .env.local</li>
            <li>Message your bot, then find your chat ID via getUpdates</li>
            <li>Add <code className="bg-muted px-1.5 py-0.5 rounded-md text-[12px]">TELEGRAM_CHAT_ID=...</code> to .env.local</li>
          </ol>
          <div className="mt-4">
            <TelegramTestButton />
          </div>
        </div>
      </Row>

      {/* Job Preferences */}
      <Row title="Job Preferences" description="Filters applied when auto-applying">
        <div>
          <FL>Remote preference</FL>
          <Select value={s.remotePreference} onValueChange={v => set('remotePreference', v ?? 'any')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any — remote, hybrid, or on-site</SelectItem>
              <SelectItem value="remote">Remote only</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <FL>Minimum salary (optional)</FL>
          <SInput type="number" placeholder="e.g. 100000" value={s.salaryMin ?? ''} onChange={(e: ChangeEvent<HTMLInputElement>) => set('salaryMin', e.target.value ? parseInt(e.target.value) : null)} />
        </div>
      </Row>

      {/* Scraping */}
      <Row title="Scraping" description="Control request pacing to avoid rate limits" last>
        <div>
          <FL>Request delay (ms)</FL>
          <SInput type="number" value={s.requestDelayMs} onChange={(e: ChangeEvent<HTMLInputElement>) => set('requestDelayMs', parseInt(e.target.value) || 2000)} />
          <p className="mt-1.5 text-[12px] text-foreground/38">Delay between requests to job boards. 2000ms recommended.</p>
        </div>
      </Row>

      {/* Chrome Extension */}
      <ExtensionConnectSection />

      {/* Save */}
      <div className="flex justify-end pt-6">
        <button
          onClick={() => saveSettings()}
          disabled={isPending}
          className="flex items-center gap-2 h-11 px-8 rounded-xl bg-foreground text-background text-[14px] font-semibold hover:bg-foreground/88 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : 'Save settings'}
        </button>
      </div>

    </div>
  );
}
