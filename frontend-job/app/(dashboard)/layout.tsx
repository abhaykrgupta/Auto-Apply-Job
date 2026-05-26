import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { BackToTop } from '@/components/shared/BackToTop';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isResumeBuilder = pathname.startsWith('/resume-builder');

  // Redirect unauthenticated users from all pages except resume builder
  if (!session?.user && !isResumeBuilder) {
    redirect('/login');
  }

  // Guest visiting resume builder — no sidebar, add a subtle left accent strip for breathing room
  if (!session?.user && isResumeBuilder) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Left accent strip — replaces sidebar visually, gives breathing room */}
        <div className="hidden md:block w-3 shrink-0 bg-muted/40 border-r border-border/50" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden bg-background">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <BackToTop />
        </main>
      </div>
    </div>
  );
}
