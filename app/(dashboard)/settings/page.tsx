'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Settings, Key, Bot, Globe, Bell, Briefcase } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

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
      if (data.success) {
        setStatus('ok');
        toast.success('Test message sent to Telegram!');
      } else {
        setStatus('error');
        toast.error(data.error ?? 'Failed');
      }
    } catch {
      setStatus('error');
      toast.error('Failed to connect');
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={test} disabled={status === 'loading'}>
      {status === 'loading' ? 'Sending...' : status === 'ok' ? '✅ Connected!' : '📱 Test Telegram'}
    </Button>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<AppSettings>(DEFAULTS);

  const { data: saved } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return {};
      return res.json();
    },
  });

  useEffect(() => {
    if (saved && Object.keys(saved).length > 0) {
      setS((prev) => ({ ...prev, ...saved }));
    }
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
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Failed to save settings'),
  });

  const set = (key: keyof AppSettings, value: unknown) =>
    setS((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure your job application automation</p>
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" /> API Keys
          </CardTitle>
          <CardDescription>Configure in .env.local — never committed to git</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { label: 'OpenAI API Key', placeholder: 'sk-...' },
            { label: 'Supabase Database URL', placeholder: 'postgresql://...' },
            { label: 'Resend API Key (Email)', placeholder: 're_...' },
          ].map(({ label, placeholder }) => (
            <div key={label}>
              <Label>{label}</Label>
              <Input type="password" placeholder={placeholder} disabled value="Set in .env.local" className="h-10 mt-1" />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Edit <code className="bg-muted px-1 rounded">.env.local</code> to configure API keys.
          </p>
        </CardContent>
      </Card>

      {/* Auto-Apply */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4" /> Auto-Apply
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between py-1">
            <div>
              <Label>Enable Auto-Apply</Label>
              <p className="text-xs text-muted-foreground">Automatically apply to matched jobs</p>
            </div>
            <Switch checked={s.autoApplyEnabled} onCheckedChange={(v) => set('autoApplyEnabled', v)} />
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <Label>Require Confirmation</Label>
              <p className="text-xs text-muted-foreground">Show filled form before submitting</p>
            </div>
            <Switch checked={s.requireConfirmation} onCheckedChange={(v) => set('requireConfirmation', v)} />
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <Label>Headless Browser</Label>
              <p className="text-xs text-muted-foreground">Run browser in background</p>
            </div>
            <Switch checked={s.headless} onCheckedChange={(v) => set('headless', v)} />
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
            <p className="text-xs text-muted-foreground">
              Only auto-apply to jobs scoring {s.minMatchScore}% or higher
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Max Concurrent Applications</Label>
            <Select value={String(s.maxConcurrent)} onValueChange={(v) => set('maxConcurrent', parseInt(v ?? '3'))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 3, 5, 10].map((n) => (
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
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Email Notifications
          </CardTitle>
          <CardDescription>Requires RESEND_API_KEY and USER_EMAIL in .env.local</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Receive email updates' },
            { key: 'dailyDigest' as const, label: 'Daily Digest (8 AM)', desc: 'Summary of new jobs and applications' },
            { key: 'weeklySummary' as const, label: 'Weekly Summary (Sunday)', desc: 'Full week analytics' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <div>
                <Label>{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch checked={s[key] as boolean} onCheckedChange={(v) => set(key, v)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-500" /> Telegram Notifications
          </CardTitle>
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
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Job Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Remote Preference</Label>
            <Select value={s.remotePreference} onValueChange={(v) => set('remotePreference', v ?? 'any')}>
              <SelectTrigger className="w-full">
                <SelectValue />
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
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Scraping
          </CardTitle>
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
            <p className="text-xs text-muted-foreground">Delay between requests to avoid rate limiting</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveSettings()} disabled={isPending} className="h-10 w-full font-medium">
        {isPending ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
