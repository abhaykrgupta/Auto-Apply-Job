import { SkeletonCard } from '@/components/shared/LoadingSpinner';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8 space-y-8 w-full">
      <div className="space-y-3">
        <div className="h-10 w-64 bg-muted rounded-md animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded-md animate-pulse" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl bg-card border border-border animate-pulse" />
        <div className="h-80 rounded-xl bg-card border border-border animate-pulse" />
      </div>
    </div>
  );
}
