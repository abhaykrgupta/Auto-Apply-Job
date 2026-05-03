'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/shared/StatsCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { BarChart3, TrendingUp, CheckCircle, Users, Target } from 'lucide-react';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RANGE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Last 7 Days', value: 'week' },
  { label: 'Last 30 Days', value: 'month' },
  { label: 'All Time', value: 'all' },
];

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [range, setRange] = useState('month');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', range],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const appStats = data?.appStats ?? {};
  const platformStats: any[] = data?.platformStats ?? [];
  const matchingStats = data?.matchingStats ?? {};
  const trends: any[] = data?.trends ?? [];

  const pieData = [
    { name: 'High (80%+)', value: matchingStats.highMatches ?? 0 },
    { name: 'Medium (60-80%)', value: matchingStats.mediumMatches ?? 0 },
    { name: 'Low (<60%)', value: matchingStats.lowMatches ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">Track your job search performance</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-colors',
                range === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard title="Total" value={appStats.total ?? 0} icon={BarChart3} />
        <StatsCard title="Applied" value={appStats.applied ?? 0} icon={CheckCircle} variant="success" />
        <StatsCard title="Interviewing" value={appStats.interviewing ?? 0} icon={Users} variant="warning" />
        <StatsCard title="Accepted" value={appStats.accepted ?? 0} icon={CheckCircle} variant="success" />
        <StatsCard title="Success Rate" value={`${appStats.successRate ?? 0}%`} icon={TrendingUp} variant="success" />
      </div>

      {/* Application Trend */}
      {trends.length > 0 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Application Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-6 px-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Total" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="applied" stroke="#10b981" name="Applied" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Platform Performance */}
        {platformStats.length > 0 && (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Success Rate by Platform</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-6 px-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={platformStats}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Success Rate']} />
                  <Bar dataKey="successRate" fill="#667eea" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Match Distribution */}
        {pieData.length > 0 ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Job Match Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-6 px-6">
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-semibold ml-auto">{d.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                    <p className="text-2xl font-bold">{matchingStats.avgScore ?? 0}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl shadow-sm">
            <CardHeader><CardTitle>Job Match Distribution</CardTitle></CardHeader>
            <CardContent className="pt-0 pb-6 px-6">
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No match data yet. Run AI matching to see stats.
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Breakdown table */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader><CardTitle>Application Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Applied', count: appStats.applied ?? 0, color: 'bg-green-500' },
            { label: 'Manual Review', count: appStats.manualReview ?? 0, color: 'bg-yellow-500' },
            { label: 'Failed', count: appStats.failed ?? 0, color: 'bg-red-500' },
            { label: 'Interviewing', count: appStats.interviewing ?? 0, color: 'bg-purple-500' },
            { label: 'Accepted', count: appStats.accepted ?? 0, color: 'bg-emerald-500' },
          ].map(({ label, count, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="text-muted-foreground">
                  {count} / {appStats.total ?? 0}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all`}
                  style={{
                    width: (appStats.total ?? 0) > 0 ? `${(count / (appStats.total ?? 1)) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
