import { 
  FileText, Search, Zap, LineChart, ShieldCheck, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  const features = [
    {
      id: 'resume-tailoring',
      icon: <FileText className="h-6 w-6 text-indigo-600" />,
      title: 'Just-In-Time Resume Tailoring',
      desc: 'Never submit a generic resume again. For every single application, our backend rewrites 3 bullet points on your PDF to perfectly mirror the job description, ensuring a 90%+ ATS score.',
    },
    {
      id: 'auto-apply',
      icon: <Zap className="h-6 w-6 text-indigo-600" />,
      title: 'Chrome Extension Auto-Fill',
      desc: 'Our extension injects directly into Workday and Greenhouse. It deterministically fills every text box, dropdown, and EEOC radio button in 1.5 seconds. You just click submit.',
    },
    {
      id: 'ai-matching',
      icon: <Search className="h-6 w-6 text-indigo-600" />,
      title: 'Universal Job Discovery',
      desc: 'Set your salary floor and remote preferences. We monitor LinkedIn, Lever, Ashby, and 40+ boards 24/7. You see a role the moment it is posted.',
    },
    {
      id: 'tracking',
      icon: <LineChart className="h-6 w-6 text-indigo-600" />,
      title: 'Autonomous Inbox Sync',
      desc: 'Connect your Gmail. JobAgent automatically detects interview requests and rejections, updating your Kanban board in real-time so you always know your funnel metrics.',
    }
  ];

  return (
    <div className="flex flex-col w-full bg-background selection:bg-indigo-100">
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 border-b border-slate-200 text-center bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="container mx-auto max-w-4xl px-4">
          <h1 className="text-[3rem] md:text-[4.5rem] font-extrabold tracking-tight mb-6 leading-[1.05] text-slate-900">
            The engine behind<br />your next offer.
          </h1>
          <p className="text-[1.125rem] text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We replaced four separate subscriptions with a single, highly-engineered Chrome Extension that runs your entire job hunt.
          </p>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container mx-auto max-w-5xl px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {features.map((feat) => (
              <div 
                key={feat.id} 
                className="rounded-[1.5rem] border border-slate-200 bg-white p-6 md:p-8 flex flex-col group hover:shadow-md transition-shadow shadow-sm"
              >
                <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-3 text-slate-900">{feat.title}</h2>
                <p className="text-[0.9375rem] text-slate-600 leading-relaxed mb-6 flex-1">
                  {feat.desc}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-[0.8125rem] font-bold uppercase tracking-wider text-indigo-600">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" /> 100% Secure
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white border-t border-slate-200 text-center">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-[2.25rem] md:text-[3rem] font-bold tracking-tight mb-6 text-slate-900">Experience the automation.</h2>
          <Link href="/dashboard">
            <button className="inline-flex items-center gap-2 rounded-lg h-12 px-8 text-[0.9375rem] font-semibold bg-indigo-600 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:bg-indigo-700 transition-colors">
              Get Started Now <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
