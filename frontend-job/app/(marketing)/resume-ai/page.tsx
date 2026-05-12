import { Target, Search, FileSignature, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ResumeAIPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-background selection:bg-indigo-100">
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 border-b border-slate-200 text-center bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-600 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
            100% ATS Compatibility
          </div>
          <h1 className="text-[3rem] md:text-[4.5rem] font-extrabold tracking-tight mb-6 leading-[1.02] text-slate-900">
            The perfect resume.<br/>For every application.
          </h1>
          <p className="text-[1.125rem] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We don't just parse your resume. Our backend dynamically rewrites 3 bullet points to perfectly match the exact keywords of each job posting, compiling a new PDF instantly.
          </p>
        </div>
      </section>

      {/* High-Contrast Showcase */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 md:p-8 flex flex-col relative opacity-80 shadow-sm">
              <div className="absolute top-5 right-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Original PDF</div>
              <h3 className="font-bold text-slate-900 mb-6 text-lg">Software Engineer</h3>
              <ul className="space-y-4">
                <li className="text-[0.9375rem] text-slate-500 flex gap-3">
                  <span className="text-red-400 font-bold mt-0.5">×</span>
                  Built a web application using React and Node.js that improved performance.
                </li>
                <li className="text-[0.9375rem] text-slate-500 flex gap-3">
                  <span className="text-red-400 font-bold mt-0.5">×</span>
                  Managed a team of 3 developers to deliver projects on time.
                </li>
              </ul>
              <div className="mt-10 pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ATS Score</span>
                <span className="text-sm font-bold text-slate-400">42%</span>
              </div>
            </div>

            <div className="rounded-[1.5rem] border-2 border-indigo-400 bg-white p-6 md:p-8 flex flex-col relative shadow-[0_20px_50px_rgba(79,70,229,0.15)]">
              <div className="absolute top-5 right-6 text-[10px] font-bold uppercase tracking-widest text-indigo-600">Just-In-Time Tailored</div>
              <h3 className="font-bold text-slate-900 mb-6 text-lg">Senior Frontend Engineer</h3>
              <ul className="space-y-4">
                <li className="text-[0.9375rem] text-slate-700 font-medium flex gap-3 leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  Architected a highly scalable SPA utilizing React.js and Next.js, optimizing Core Web Vitals and reducing TTI by 40%.
                </li>
                <li className="text-[0.9375rem] text-slate-700 font-medium flex gap-3 leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  Led agile development lifecycle for 3 engineers, successfully deploying the TypeScript microservices architecture under strict deadlines.
                </li>
              </ul>
              <div className="mt-10 pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">ATS Score</span>
                <span className="text-sm font-bold text-indigo-600">98%</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="py-20 bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-6xl px-6 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {[
            { icon: <Target className="h-5 w-5 text-slate-700" />, title: 'Deterministic Matching', desc: 'Identifies the core competencies required by the ATS and seamlessly weaves them into your existing experience.' },
            { icon: <Search className="h-5 w-5 text-slate-700" />, title: 'Human Readability', desc: 'Maintains a highly professional tone. No robotic keyword stuffing. Just clean, metric-driven impact.' },
            { icon: <FileSignature className="h-5 w-5 text-slate-700" />, title: 'On-The-Fly PDF Generation', desc: 'Outputs a standard ATS-friendly PDF template that parses flawlessly in Workday, Greenhouse, and Lever.' },
          ].map((feat, i) => (
            <div key={i} className="flex flex-col">
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-5 shadow-sm">
                {feat.icon}
              </div>
              <h3 className="text-[1.125rem] font-bold mb-2 text-slate-900">{feat.title}</h3>
              <p className="text-[0.9375rem] text-slate-600 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-slate-50 text-center">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-[2.25rem] md:text-[3rem] font-bold tracking-tight mb-6 text-slate-900">See the tailoring in action.</h2>
          <Link href="/dashboard">
            <button className="inline-flex items-center gap-2 rounded-lg h-12 px-8 text-[0.9375rem] font-semibold tracking-wide bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-colors">
              Test the PDF Builder <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
