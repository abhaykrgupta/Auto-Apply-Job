import { Target, Search, FileSignature, CheckCircle2, ArrowRight, Sparkles, Zap, BarChart2, RefreshCw, Eye } from 'lucide-react';
import Link from 'next/link';

const capabilities = [
  {
    icon: Target,
    title: "Matches the exact words employers use",
    desc: "Every job posting uses specific phrases. If your resume doesn't include those exact phrases, automated screening software rejects you — even if you're perfectly qualified. We fix that for every single application.",
  },
  {
    icon: Search,
    title: 'Reads like a human wrote it',
    desc: "We never just stuff keywords into your resume randomly. The rewritten sentences sound natural, use real numbers and impact wherever possible, and keep your professional voice throughout.",
  },
  {
    icon: FileSignature,
    title: 'Ready-to-submit PDF in seconds',
    desc: "Your tailored resume is compiled into a clean, professional PDF that works with any application system — every time, instantly. No formatting issues, no corrupted files.",
  },
  {
    icon: Zap,
    title: 'Created at the moment you apply',
    desc: "Your resume is tailored right when you apply — not hours earlier. This means it matches the exact, current version of the job posting you're applying to. Not a job from yesterday.",
  },
  {
    icon: BarChart2,
    title: 'You can see your match score before applying',
    desc: "Before you even click apply, we show you how well your experience matches the job on a scale of 0–100. You can decide whether to go for it or move on — saving time and increasing your success rate.",
  },
  {
    icon: Eye,
    title: 'Full history of every tailored resume',
    desc: "Every version of your resume is saved. You can review what was changed for each application, see which version performed best, and reuse successful tailoring patterns for similar roles.",
  },
];

export default function ResumeAIPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-background">

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-[12px] font-semibold mb-7">
            <Sparkles className="h-3.5 w-3.5" />
            Resume AI — Tailored for every job, automatically
          </div>
          <h1 className="text-[2.75rem] md:text-[3.75rem] font-extrabold tracking-tight leading-[1.06] text-slate-900 mb-6">
            The same resume gets you<br />
            <span className="text-indigo-600">ignored. A tailored one gets you hired.</span>
          </h1>
          <p className="text-[1.0625rem] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Most people send the same resume to every job. Companies use software that automatically rejects resumes that don't match their exact keywords — before any human even reads it. Our AI fixes this for you, instantly.
          </p>
        </div>
      </section>

      {/* ── The real problem, explained simply ── */}
      <section className="py-16 bg-slate-900">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Why Most Applications Fail</p>
          <h2 className="text-[1.75rem] md:text-[2.25rem] font-extrabold text-white tracking-tight mb-5">
            You're being filtered out before anyone reads your resume.
          </h2>
          <p className="text-[1rem] text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            When you apply to a job, your resume goes through automated screening software first. This software gives your resume a score based on how closely it matches the job description's exact language. Most resumes score between 30–50%. Anything under 70% gets filtered out automatically.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { label: 'Generic resume', score: '38%', color: 'bg-red-500' },
              { label: 'Slightly tailored', score: '61%', color: 'bg-amber-500' },
              { label: 'AI tailored by us', score: '97%', color: 'bg-emerald-500' },
            ].map(({ label, score, color }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <span className="text-[12px] text-slate-400 font-medium">{label}</span>
                <div className="w-full rounded-full bg-slate-800 h-2 overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: score }} />
                </div>
                <span className={`text-lg font-extrabold ${color.replace('bg-', 'text-')}`}>{score}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="py-16 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Real Example</p>
            <h2 className="text-[1.75rem] md:text-[2.25rem] font-extrabold text-slate-900 tracking-tight">
              What the AI actually changes — and why it works
            </h2>
            <p className="text-[0.9375rem] text-slate-500 mt-3 max-w-xl mx-auto">
              We don't change your experience. We change how it's described — using the same words the employer used.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Before */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-7 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Your generic resume</span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">38% match</span>
              </div>
              <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Software Engineer — Experience</p>
              <ul className="space-y-3 flex-1">
                {[
                  'Built a web application using React and Node.js that improved performance.',
                  'Managed a team of 3 developers to deliver projects on time.',
                  'Worked on backend systems and APIs using various technologies.',
                ].map(text => (
                  <li key={text} className="flex gap-3 text-[14px] text-slate-400 leading-relaxed">
                    <span className="text-red-400 font-bold mt-0.5 shrink-0">✕</span>
                    {text}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[38%] rounded-full bg-red-400" />
                </div>
                <p className="text-[12px] text-red-500 mt-2 font-medium">Auto-rejected. No human ever saw this.</p>
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border-2 border-indigo-200 bg-white p-7 flex flex-col shadow-xl shadow-indigo-50">
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">AI tailored for this job</span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600">97% match</span>
              </div>
              <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Senior Frontend Engineer — Experience</p>
              <ul className="space-y-3 flex-1">
                {[
                  'Architected a scalable React.js + Next.js SPA, improving Core Web Vitals and cutting page load time by 40%.',
                  'Led an agile team of 3 engineers to ship TypeScript microservices on schedule, reducing deployment errors by 60%.',
                  'Designed RESTful APIs with Node.js and PostgreSQL handling 5M+ monthly requests at 99.9% uptime.',
                ].map(text => (
                  <li key={text} className="flex gap-3 text-[14px] text-slate-700 leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    {text}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[97%] rounded-full bg-indigo-600" />
                </div>
                <p className="text-[12px] text-emerald-600 mt-2 font-medium">Passed screening. Recruiter called within 24 hours.</p>
              </div>
            </div>
          </div>

          <p className="text-center text-[13px] text-slate-400 mt-5">
            Same person. Same experience. Different result — because the language matched.
          </p>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-[1.75rem] md:text-[2.25rem] font-extrabold text-slate-900 tracking-tight">
              Everything the Resume AI does for you
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {capabilities.map((c) => (
              <div key={c.title} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-200 hover:shadow-sm transition-all duration-200">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                  <c.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-[14px] font-bold text-slate-900 mb-2 leading-snug">{c.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 border-t border-slate-200 bg-indigo-600 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-[2rem] md:text-[2.5rem] font-extrabold tracking-tight text-white mb-4">
            See your resume transformed — right now.
          </h2>
          <p className="text-indigo-200 text-[1rem] mb-8 leading-relaxed">
            Upload your resume, paste in any job description, and watch the AI rewrite your experience to match it in under 3 seconds.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl h-12 px-8 text-[0.9375rem] font-bold bg-white text-indigo-600 hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Try it free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-[13px] text-indigo-300 mt-3">No credit card. Takes 2 minutes.</p>
        </div>
      </section>
    </div>
  );
}
