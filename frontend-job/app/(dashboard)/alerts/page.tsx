'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, BellOff, Plus, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';
import { timeAgo } from '@/lib/utils/helpers';

export default function AlertsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', location: '', remote: false, minScore: 75 });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['job-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const { mutate: createAlert, isPending: creating } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Alert created');
      setShowForm(false);
      setForm({ name: '', role: '', location: '', remote: false, minScore: 75 });
      qc.invalidateQueries({ queryKey: ['job-alerts'] });
    },
    onError: () => toast.error('Failed to create alert'),
  });

  const { mutate: deleteAlert } = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast.success('Alert deleted');
      qc.invalidateQueries({ queryKey: ['job-alerts'] });
    },
  });

  const { mutate: toggleAlert } = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await fetch(`/api/alerts?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-alerts'] }),
  });

  if (isLoading) return <LoadingSpinner />;

  const totalUnseen = (alerts ?? []).reduce((s: number, a: any) => s + (a.unseenCount ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Job Alerts
            {totalUnseen > 0 && (
              <span className="text-sm font-medium bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {totalUnseen} new
              </span>
            )}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Get notified when high-match jobs arrive</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Alert
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Create Alert</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Alert name *</label>
              <Input placeholder="e.g. Senior React Engineer" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Role / keywords</label>
              <Input placeholder="e.g. React, TypeScript" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
              <Input placeholder="e.g. San Francisco" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.remote} onChange={e => setForm(f => ({ ...f, remote: e.target.checked }))} />
                Remote only
              </label>
              <label className="text-sm flex items-center gap-2">
                Min match score:
                <input type="range" min={50} max={95} step={5} value={form.minScore} onChange={e => setForm(f => ({ ...f, minScore: Number(e.target.value) }))} className="w-28" />
                <span className="font-medium">{form.minScore}%</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={() => createAlert()} disabled={creating || !form.name.trim()}>
              {creating ? 'Creating...' : 'Create Alert'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Alert list */}
      {!alerts?.length ? (
        <EmptyState
          icon={Bell}
          title="No alerts yet"
          description="Create an alert to be notified when new high-match jobs arrive."
          action={<Button onClick={() => setShowForm(true)}>Create your first alert</Button>}
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <div key={alert.id} className={cn('rounded-xl border border-border bg-card p-4 flex items-center gap-4', !alert.isActive && 'opacity-60')}>
              <div className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0', alert.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {alert.isActive ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{alert.name}</p>
                  {alert.unseenCount > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 shrink-0">
                      {alert.unseenCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {alert.role && <span className="text-xs text-muted-foreground">{alert.role}</span>}
                  {alert.location && <span className="text-xs text-muted-foreground">· {alert.location}</span>}
                  {alert.remote && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Remote</span>}
                  <span className="text-xs text-muted-foreground">≥ {alert.minScore}% match</span>
                  {alert.lastTriggeredAt && <span className="text-xs text-muted-foreground">· last triggered {timeAgo(alert.lastTriggeredAt)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAlert({ id: alert.id, isActive: !alert.isActive })}
                  title={alert.isActive ? 'Pause' : 'Activate'}
                >
                  {alert.isActive ? <BellOff className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteAlert(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
