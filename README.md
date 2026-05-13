<div align="center">

<br/>

# Job Agent AI

### Your personal job search assistant — working 24/7, so you don't have to.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![PostgreSQL](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team)

<br/>

*Most job seekers spend 40+ hours a week filling out forms, rewriting resumes, and refreshing job boards.*
*Job Agent does all of that for you — automatically, intelligently, at scale.*

<br/>

</div>

---

## What is this?

Job Agent is an AI-powered job search platform that automates the parts of job hunting that shouldn't require a human — finding jobs, tailoring your resume for each role, filling out application forms, and tracking everything in one place.

You set your preferences once. The platform handles the rest.

---

## The problem it solves

Most job seekers send the same generic resume to every job. Companies use automated software to filter applications before any human reads them — and that software rejects resumes that don't match the job description's exact language.

The result: qualified people get rejected automatically, not because they're not good enough, but because their resume used slightly different words.

Job Agent fixes this. Before every application, the AI rewrites your resume to mirror the exact language of that job posting. You go from a 38% match score to a 97% match score — automatically.

---

## How it works

**1. Upload your resume**
Drag and drop your PDF. The system reads your full work history, skills, and education in seconds.

**2. Tell us what you want**
Set your job title, location, salary range, and remote preference. That's all the setup you need.

**3. Install the Chrome extension**
One click from the Chrome Web Store. The extension runs in your browser and fills job forms automatically when you visit a company's application page.

**4. Click apply anywhere**
When you click apply on any job, the AI reads the job description and rewrites 3 bullet points on your resume to match it perfectly. A tailored PDF is attached to the form. You review it and click submit.

**5. Let the pipeline run**
The platform monitors 500+ companies and 15+ job boards daily. New jobs matching your criteria appear automatically. Alerts go to Telegram or email the moment something relevant is posted.

**6. Track everything**
Every application is logged — applied, interviewing, offer, rejected. See your full pipeline at a glance.

---

## What's included

| Feature | What it does |
|---|---|
| **Resume AI** | Rewrites your resume for every individual job, automatically |
| **Chrome Extension** | Fills any job application form in under 2 seconds |
| **Job Discovery** | Monitors 500+ companies + 15 job boards around the clock |
| **Smart Matching** | Scores every job against your experience — 0 to 100 |
| **Application Tracker** | Full pipeline from applied → offer, all in one place |
| **Job Alerts** | Telegram or email notification the moment a matching job is posted |
| **Resume Builder** | 16 professional templates with live preview and PDF export |
| **Batch Apply** | Select multiple jobs and apply to all of them in one click |
| **Analytics** | See which sources get you responses and what's working |
| **Daily Pipeline** | Automated daily job discovery, matching, and digest — runs without you |

---

## Company & job board coverage

The platform discovers and monitors jobs from:

- **500+ companies directly** — Greenhouse, Lever, Ashby, Workday, SmartRecruiters, BambooHR career boards
- **Y Combinator** — Current and alumni portfolio companies
- **Wellfound** — Active startup hiring
- **GitHub Trending** — Companies behind popular open-source projects
- **VC Portfolios** — a16z, Sequoia, Accel, Bessemer and more
- **India startups** — Inc42, Nasscom, Peak XV, Blume, Kalaari portfolios
- **Job APIs** — Adzuna (12,500+ jobs/day), JSearch via RapidAPI (LinkedIn, Indeed, Glassdoor aggregated)

---

## Resume Builder templates

16 professionally designed templates — Single Column, Sidebar, Banner, Two-Column, Timeline, and Traditional layouts. Every template exports as a clean, ATS-safe PDF.

Classic · Modern · Minimal · Executive · Sharp · Scholar · Compact · Banner · Teal Banner · Timeline · Atlantic · Slate · Sidebar Light · Two Column · Mercury · Traditional

---

## Cron jobs (automated daily tasks)

| Job | Schedule | What it does |
|---|---|---|
| `detect-ats` | 3 AM daily | Auto-detects hiring software for unknown companies |
| `daily-pipeline` | 4 AM daily | Scrapes all companies for new jobs, runs matching |
| `daily-digest` | 8 AM daily | Sends your daily job summary to Telegram |
| `retry-failed` | 12 PM daily | Retries any applications that failed |
| `discover-companies` | 2 AM Sundays | Finds new companies to add to the database |
| `weekly-summary` | 9 AM Sundays | Sends your weekly progress report |

---

## Setup

You need free accounts with:

- **Supabase** — database (free tier works)
- **OpenAI** — for resume tailoring and job matching
- **Resend** — email notifications (optional)
- **Telegram Bot** — real-time alerts (optional)
- **Adzuna** — real job API, 250 free requests/day (optional)
- **JSearch via RapidAPI** — aggregated job search (optional)

Copy `.env.example` to `.env.local`, fill in your keys, and run:

```bash
# Install and run the frontend
cd frontend-job
npm install
npm run dev

# Install and run the backend worker
cd backend-job
npm install
npm run dev
```

Then open `http://localhost:3000`.

---

## Project structure

```
abhay-job-agent/
├── frontend-job/          # Next.js dashboard — everything the user sees
│   ├── app/               # Pages and API routes
│   ├── components/        # UI components
│   ├── lib/               # Database, scrapers, AI logic, Chrome extension bridge
│   └── chrome-extension/  # The browser extension source
│
└── backend-job/           # Fastify worker — background jobs and heavy processing
    ├── src/routes/        # API endpoints
    └── lib/               # Company discovery, job queue, automation engine
```

---

## Built with

Next.js · Fastify · TypeScript · Tailwind CSS · ShadCN UI · PostgreSQL · Drizzle ORM · OpenAI · TanStack Query · Recharts · React PDF · Resend · Telegram Bot API · Zod · Playwright

---

<div align="center">

<br/>

*Built for people who are serious about finding their next role — not just applying and hoping.*

<br/>

</div>
