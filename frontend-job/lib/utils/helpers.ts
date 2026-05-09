export function formatSalary(min?: number | null, max?: number | null, currency = 'USD') {
  if (!min && !max) return 'Not specified';
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export function timeAgo(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function truncate(str: string, length: number) {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    applied: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    manual_review: 'bg-blue-100 text-blue-800',
    interviewing: 'bg-purple-100 text-purple-800',
    rejected: 'bg-gray-100 text-gray-800',
    accepted: 'bg-emerald-100 text-emerald-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Queued',
    applied: 'Applied',
    failed: 'Failed',
    manual_review: 'Needs Attention',
    pending_confirmation: 'Awaiting Review',
    interviewing: 'Interviewing',
    rejected: 'Rejected',
    accepted: 'Accepted',
  };
  return map[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
