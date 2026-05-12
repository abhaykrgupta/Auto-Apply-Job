'use client';

export default function PrivacyPage() {
  const sections = [
    { 
      title: 'Data Collection', 
      content: 'We collect information you provide directly to us, such as when you create an account, upload a resume, or communicate with us. This includes your name, email, career history, and job preferences.' 
    },
    { 
      title: 'How we use your data', 
      content: 'Your data is primarily used to train your localized agent to find and apply for jobs on your behalf. We also use it to improve our parsing algorithms and provide personalized role recommendations.' 
    },
    { 
      title: 'Data Security', 
      content: 'We use industry-standard encryption and security protocols to protect your personal information. Your resume data is vectorized and stored in a secure, isolated environment.' 
    },
    { 
      title: 'Data Sharing', 
      content: 'We do not sell your personal data. We only share information with third-party job boards and applicant tracking systems (ATS) when you explicitly authorize the agent to submit an application.' 
    },
    { 
      title: 'Your Rights', 
      content: 'You have the right to access, update, or delete your personal information at any time through your dashboard settings. You can also request a full export of your data.' 
    }
  ];

  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      
      {/* ── HEADER ─────────────────────────────────────────── */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 border-b border-border/30 bg-dot-pattern">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-4">Legal</p>
          <h1 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-4 text-muted-foreground">Last updated: May 10, 2024</p>
        </div>
      </section>

      {/* ── CONTENT ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-[1.125rem] leading-relaxed text-muted-foreground mb-12">
              At JobAgent, we take your privacy seriously. This policy outlines how we handle 
              your data and the steps we take to ensure your career information remains secure.
            </p>

            <div className="space-y-16">
              {sections.map((section, i) => (
                <div key={i} className="group">
                  <h2 className="text-[1.25rem] font-bold text-foreground mb-4 flex items-center gap-4">
                    <span className="text-[0.75rem] font-mono text-muted-foreground/40">0{i + 1}</span>
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

            <div className="mt-24 p-8 rounded-2xl bg-muted/30 border border-border/40">
              <h3 className="text-[1rem] font-bold mb-4">Questions about our privacy practices?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                If you have any questions or concerns about how we handle your data, please contact our 
                security team at security@jobagent.ai.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
