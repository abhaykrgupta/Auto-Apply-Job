'use client';

export default function TermsPage() {
  const sections = [
    { 
      title: 'Acceptance of Terms', 
      content: 'By accessing or using JobAgent, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our platform.' 
    },
    { 
      title: 'Service Description', 
      content: 'JobAgent provides an autonomous AI agent designed to discover, tailor, and submit job applications on behalf of the user. We do not guarantee employment or interview results.' 
    },
    { 
      title: 'User Responsibilities', 
      content: 'You are responsible for the accuracy of the data you provide to the agent. You must not use the service to submit fraudulent applications or violate the terms of third-party job boards.' 
    },
    { 
      title: 'Subscription & Payments', 
      content: 'Access to premium features requires a paid subscription. All payments are non-refundable, and you may cancel your subscription at any time through your dashboard.' 
    },
    { 
      title: 'Limitation of Liability', 
      content: 'JobAgent is not liable for any direct or indirect damages resulting from the use of our autonomous agent, including but not limited to loss of data or career opportunities.' 
    }
  ];

  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      
      {/* ── HEADER ─────────────────────────────────────────── */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 border-b border-border/30 bg-dot-pattern">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-4">Legal</p>
          <h1 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="mt-4 text-muted-foreground">Last updated: May 10, 2024</p>
        </div>
      </section>

      {/* ── CONTENT ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-[1.125rem] leading-relaxed text-muted-foreground mb-12">
              These terms govern your use of the JobAgent platform and our autonomous application services. 
              Please read them carefully before activating your agent.
            </p>

            <div className="space-y-16">
              {sections.map((section, i) => (
                <div key={i} className="group">
                  <h2 className="text-[1.25rem] font-bold text-foreground mb-4 flex items-center gap-4">
                    <span className="text-[0.75rem] font-mono text-muted-foreground/40">T-0{i + 1}</span>
                    {section.title}
                  </h2>
                  <div className="pl-9 border-l border-border/40 group-hover:border-primary/40 transition-colors">
                    <p className="text-[1rem] leading-relaxed text-muted-foreground">
                      {section.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-24 text-center pb-20">
              <p className="text-sm text-muted-foreground">
                For legal inquiries, please contact legal@jobagent.ai.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
