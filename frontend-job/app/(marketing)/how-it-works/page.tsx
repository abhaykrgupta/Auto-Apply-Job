import { ArrowRight, FileText, Download, MousePointerClick, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  { 
    n: '01', 
    title: 'Upload your base resume.', 
    desc: 'Drag and drop your standard PDF resume. Our local parsing engine instantly extracts your history, skills, and demographic preferences securely.',
    icon: <FileText className="h-6 w-6 text-indigo-600" />
  },
  { 
    n: '02', 
    title: 'Install the Extension.', 
    desc: 'Add our lightweight Chrome Extension. It integrates seamlessly into your browser, waiting quietly until you land on a supported ATS like Greenhouse or Workday.',
    icon: <Download className="h-6 w-6 text-indigo-600" />
  },
  { 
    n: '03', 
    title: 'Click "Magic Fill".', 
    desc: 'When you find a job you like, click the extension. In 1.5 seconds, we deterministically populate every text box, dropdown, and radio button on the page.',
    icon: <MousePointerClick className="h-6 w-6 text-indigo-600" />
  },
  { 
    n: '04', 
    title: 'Just-In-Time Tailoring.', 
    desc: 'While the form fills, our backend analyzes the job description and dynamically rewrites 3 bullets on your resume to match the exact keywords, injecting the new PDF instantly.',
    icon: <Zap className="h-6 w-6 text-indigo-600" />
  },
  { 
    n: '05', 
    title: 'You click submit.', 
    desc: 'We don\'t believe in blind auto-submits. You review the perfectly filled application and hit submit yourself. 100% accuracy, zero AI hallucinations.',
    icon: <CheckCircle2 className="h-6 w-6 text-indigo-600" />
  }
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col w-full bg-slate-50 selection:bg-indigo-100">
      
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 border-b border-slate-200 bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 mb-6">The Co-Pilot Architecture</p>
          <h1 className="text-[3rem] md:text-[4.5rem] font-extrabold tracking-tight leading-[1.02] text-slate-900 max-w-3xl">
            A completely autonomous<br />workflow.
          </h1>
          <p className="mt-6 text-[1.125rem] leading-[1.6] text-slate-600 max-w-xl">
            We've replaced generic server-side scrapers with a powerful in-browser engine. It fills forms flawlessly, bypasses bot detection, and optimizes your ATS score on the fly.
          </p>
        </div>
      </section>

      {/* ── STICKY SCROLL SECTION ─────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="flex flex-col lg:flex-row gap-16 items-start relative">
            
            {/* Left side: Sticky Title */}
            <div className="lg:w-1/3 lg:sticky lg:top-32 shrink-0">
              <h2 className="text-[2.25rem] font-bold tracking-tight text-slate-900 mb-4">
                How the magic<br />actually works.
              </h2>
              <p className="text-[1.0625rem] text-slate-600 leading-relaxed mb-8">
                The entire process happens directly in your browser. No complicated setups, no server-side timeouts. Just install the extension and start applying to jobs in 1.5 seconds flat.
              </p>
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-2 rounded-lg h-12 px-8 text-[0.9375rem] font-semibold bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-colors">
                  Get the Extension <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>

            {/* Right side: Scrolling content */}
            <div className="lg:w-2/3 flex flex-col gap-12">
              {STEPS.map((step) => (
                <div key={step.n} className="p-8 md:p-10 rounded-[1.5rem] border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 shrink-0">
                    {step.icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Step {step.n}</div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">{step.title}</h3>
                    <p className="text-[1rem] leading-relaxed text-slate-600">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE CALLOUT ───────────────────────────── */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-[2.25rem] md:text-[2.75rem] font-bold tracking-tight leading-[1.05] text-slate-900 mb-6">
                Why we use an<br />Extension instead of a Bot.
              </h2>
              <p className="text-[1.0625rem] text-slate-600 leading-relaxed mb-8">
                Standard bots run on cloud servers. Workday and Greenhouse block cloud servers instantly using Cloudflare. By using a Chrome Extension, the automation runs from your real IP address, using your real browser session. It is 100% invisible to bot protection.
              </p>
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-2 rounded-lg h-12 px-8 text-[0.9375rem] font-semibold bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-colors">
                  Try it yourself <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
            
            {/* Dark IDE Block for contrast */}
            <div className="relative aspect-video rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden p-6 md:p-8 flex flex-col justify-end">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent z-10 pointer-events-none" />
              {/* Fake Code Block */}
              <div className="absolute top-0 left-0 right-0 p-6 md:p-8 font-mono text-[11px] text-indigo-300/80 leading-relaxed overflow-hidden whitespace-pre">
{`const platform = detectATS(window.location.href);

if (platform === 'workday') {
  console.log('[AGENT] Injecting state machine...');
  await executeWorkdayFlow(userProfile);
} else if (platform === 'greenhouse') {
  console.log('[AGENT] Deterministic mapping applied.');
  document.querySelector('#first_name').value = profile.firstName;
  document.querySelector('#sponsorship_status').value = 'No';
}

console.log('[AGENT] Requesting JIT Tailored Resume...');
const pdfBuffer = await fetchTailoredPDF(jobDescription);
injectFile(pdfBuffer);`}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
