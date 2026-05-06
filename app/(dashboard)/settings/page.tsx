'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Settings, Key, Bot, Globe, Bell, Briefcase, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
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
        body: JSON.stringify({
          action: 'generate-summary',
          data: {
            experience: [{ title: 'Engineer', company: 'Acme', startDate: '2020', current: true }],
            education: [{ degree: 'B.S.', field: 'CS', school: 'MIT' }],
            skills: { technical: ['JavaScript'] },
          },
        }),
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
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error('Save failed');
    },
    onSuccess: () => {
      toast.success('Settings saved');
      setLastSaved(new Date());
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const set = (key: keyof AppSettings, value: unknown) =>
    setS(prev => ({ ...prev, [key]: value }));

  const fullyAutomatic = s.autoApplyEnabled && !s.requireConfirmation;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6 pb-16">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure your job application automation</p>
        </div>
        {lastSaved && (
          <p className="text-xs text-muted-foreground mt-1 shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 inline mr-1" />
            Saved {format(lastSaved, 'h:mm a')}
          </p>
        )}
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-4 w-4" /> API Keys</CardTitle>
          <CardDescription>Set these in your <code className="bg-muted px-1 rounded text-xs">.env.local</code> file — never committed to git</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: 'OpenAI API Key', placeholder: 'sk-...', hint: 'Get yours at platform.openai.com' },
            { label: 'Supabase Database URL', placeholder: 'postgresql://...', hint: 'Found in Supabase → Settings → Database → Connection string' },
            { label: 'Resend API Key (Email)', placeholder: 're_...', hint: 'Get yours at resend.com/api-keys' },
          ].map(({ label, placeholder, hint }) => (
            <div key={label}>
              <Label>{label}</Label>
              <Input type="password" placeholder={placeholder} disabled value="Set in .env.local" className="h-10 mt-1" />
              <p className="text-xs text-muted-foreground mt-1">{hint}</p>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <OpenAITestButton />
            <TelegramTestButton />
          </div>
        </CardContent>
      </Card>

      {/* Auto-Apply */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4" /> Auto-Apply</CardTitle>
          <CardDescription>
            {fullyAutomatic
              ? '✅ Fully automatic — bot will fill and submit forms without asking you'
              : s.autoApplyEnabled
                ? '⚠️ Partial — bot fills forms but waits for your confirmation before submitting'
                : '⏸️ Paused — auto-apply is off, applications will need manual review'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Grouped automation toggles with visual link */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Automation Mode</p>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Auto-Apply</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Let the bot apply to matched jobs automatically</p>
              </div>
              <Switch checked={s.autoApplyEnabled} onCheckedChange={v => set('autoApplyEnabled', v)} />
            </div>

            <div className={`flex items-center justify-between transition-opacity ${!s.autoApplyEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <Label>Require Confirmation Before Submitting</Label>
                <p className="text-xs text-muted-foreground mt-0.5">When ON: bot fills forms but pauses for your review. When OFF: bot submits instantly.</p>
              </div>
              <Switch checked={s.requireConfirmation} onCheckedChange={v => set('requireConfirmation', v)} disabled={!s.autoApplyEnabled} />
            </div>

            {s.autoApplyEnabled && (
              <div className={`rounded-lg px-3 py-2 text-xs font-medium ${fullyAutomatic ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
                {fullyAutomatic
                  ? '✅ Fully automatic: bot fills AND submits without pausing'
                  : '⚠️ Turn off "Require Confirmation" above for fully hands-free automation'}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <Label>Headless Browser</Label>
              <p className="text-xs text-muted-foreground mt-0.5">When ON: browser runs hidden. When OFF: you'll see it open on screen (useful for debugging).</p>
            </div>
            <Switch checked={s.headless} onCheckedChange={v => set('headless', v)} />
          </div>

          <div className="space-y-1.5">
            <Label>Max Applications Per Day</Label>
            <Input
              type="number"
              value={s.maxApplicationsPerDay}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set('maxApplicationsPerDay', parseInt(e.target.value) || 50)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Minimum Match Score to Auto-Apply</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={s.minMatchScore}
              onChange={(e: ChangeEvent<HTMLInputElement>) => set('minMatchScore', parseInt(e.target.value) || 70)}
            />
            <p className="text-xs text-muted-foreground">Only auto-apply to jobs scoring {s.minMatchScore}% or higher</p>
          </div>

          <div className="space-y-1.5">
            <Label>Max Concurrent Applications</Label>
            <Select value={String(s.maxConcurrent)} onValueChange={v => set('maxConcurrent', parseInt(v ?? '3'))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select max concurrent" />
              </SelectTrigger>
              <SelectContent>
                {[1, 3, 5, 10].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Email Notifications</CardTitle>
          <CardDescription>Requires RESEND_API_KEY and USER_EMAIL in .env.local</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Receive email updates on application activity' },
            { key: 'dailyDigest' as const, label: 'Daily Digest (8 AM)', desc: 'Summary of new jobs and applications each morning' },
            { key: 'weeklySummary' as const, label: 'Weekly Summary (Sunday)', desc: 'Full week analytics and performance report' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <div>
                <Label>{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch checked={s[key] as boolean} onCheckedChange={v => set(key, v)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-blue-500" /> Telegram Notifications</CardTitle>
          <CardDescription>Instant mobile alerts — faster than email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Message <strong>@BotFather</strong> on Telegram → /newbot → copy token</li>
            <li>Add <code className="bg-muted px-1 rounded">TELEGRAM_BOT_TOKEN=...</code> to .env.local</li>
            <li>Message your bot once, then find your chat ID via getUpdates</li>
            <li>Add <code className="bg-muted px-1 rounded">TELEGRAM_CHAT_ID=...</code> to .env.local</li>
          </ol>
          <TelegramTestButton />
        </CardContent>
      </Card>

      {/* Job Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Job Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Remote Preference</Label>
            <Select value={s.remotePreference} onValueChange={v => set('remotePreference', v ?? 'any')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="remote">Remote Only</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Minimum Salary (Optional)</Label>
            <Input
              type="number"
              placeholder="e.g. 100000"
              value={s.salaryMin ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                set('salaryMin', e.target.value ? parseInt(e.target.value) : null)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Scraping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4" /> Scraping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Request Delay (ms)</Label>
            <Input
              type="number"
              value={s.requestDelayMs}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                set('requestDelayMs', parseInt(e.target.value) || 2000)
              }
            />
            <p className="text-xs text-muted-foreground">Delay between requests to avoid being rate-limited by job boards</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveSettings()} disabled={isPending} className="h-10 w-full font-medium sticky bottom-4 shadow-lg">
        {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save Settings'}
      </Button>
    </div>
  );
}
