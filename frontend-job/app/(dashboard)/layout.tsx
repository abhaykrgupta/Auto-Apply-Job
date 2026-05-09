import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { BackToTop } from '@/components/shared/BackToTop';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
