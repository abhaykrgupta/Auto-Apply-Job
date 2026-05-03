'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PdfViewer() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');

  if (!url) {
    return <div className="p-8 text-center text-muted-foreground">No document URL provided.</div>;
  }

  // Use the API route to ensure proper headers, or fallback to raw URL
  const pdfSrc = `/api/resume/view?url=${encodeURIComponent(url)}`;

  return (
    <iframe 
      src={pdfSrc} 
      className="w-full h-full border-none"
      title="Resume Viewer"
    />
  );
}

export default function ResumeViewPage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading viewer...</div>}>
        <PdfViewer />
      </Suspense>
    </div>
  );
}
