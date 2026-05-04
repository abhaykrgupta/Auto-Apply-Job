<div align="center">

<br/>

# Job Agent AI

### The autonomous job search platform that works while you sleep.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)

<br/>

*Stop manually searching job boards. Stop writing the same cover letter 50 times. Stop copy-pasting your resume into forms.*
*Job Agent does all of it — automatically, intelligently, at scale.*

<br/>

</div>

---

## What is this?

Job Agent is a personal AI career automation system. It continuously discovers jobs across the internet, ranks them against your profile, rewrites your application materials per company, and submits applications — all without you touching a single form.

You set your preferences once. The platform runs the entire job search pipeline for you.

---

## The Problem It Solves

The average job seeker spends **11 hours per week** on repetitive application tasks — searching the same boards daily, copy-pasting the same resume, writing near-identical cover letters, and manually tracking status in spreadsheets.

None of that work requires human judgment. Job Agent automates all of it.

---

## Core Capabilities

<br/>

### Intelligent Multi-Source Job Discovery
Simultaneously searches RemoteOK, WeWorkRemotely, Indeed, LinkedIn, Glassdoor, Greenhouse, and Lever with a single query. Filters by role, location, remote preference, date posted, and experience level. Every result is deduplicated and stored — you never see the same job twice.

<br/>

### Smart Resume Selection
Upload multiple versions of your resume — one for frontend roles, one for backend, one for leadership. When applying to any job, the platform automatically scores each resume against the job description and selects the most relevant one. No manual switching. No guesswork. Every application goes out with the resume most likely to pass screening.

<br/>

### AI-Powered Resume Tailoring
Your master resume is rewritten for each specific job using GPT-4o. The AI restructures your experience, brings forward the most relevant skills, and mirrors the language in the job description — so your resume looks like it was written for that role specifically, not adapted from a generic template.

<br/>

### AI Cover Letter Generation
A tailored, professional cover letter for any job in seconds. The AI reads the job description, understands what the company values, and writes something genuine — not a template with your name swapped in. Regenerate as many times as you want until it's right.

<br/>

### Autonomous Application Engine
The platform navigates job application forms, fills in your details, attaches the right resume, and submits — powered by browser automation. Applications go out 24/7 without you sitting at a computer.

<br/>

### Batch Apply
Select any number of jobs from your list and apply to all of them in one click. Smart Resume Selection runs independently per job — each application gets the best-fit resume automatically.

<br/>

### Saved Searches
Save your exact search configuration — role, location, filters, sources — with a name. Switch between job types instantly. Useful when you're open to multiple tracks (e.g. "Senior Frontend" and "Founding Engineer") without re-entering everything each time.

<br/>

### Full Application Pipeline Tracker
Every application is tracked from the moment it's submitted — through screening, interview, offer, and outcome. Update statuses manually or let the automation update them. Export your entire history as a CSV at any time.

<br/>

### Analytics That Actually Help
Understand where your search is working and where it isn't. See response rates broken down by job board — so you know which sources are worth your time. See which days of the week yield the highest response rates. Make decisions based on your own data, not generic career advice.

<br/>

### LinkedIn Easy Apply Chrome Extension
A browser extension that detects LinkedIn's Easy Apply modal and auto-fills your details — phone, location, work authorization, visa status. Set your profile once in the extension. Every Easy Apply form is handled automatically from that point forward.

---

## How It Works

**Step 1 — Set up your profile**
Upload your resume. The AI extracts your skills, experience, and background. Upload multiple versions if you're targeting different role types. Label each one and set which are active.

**Step 2 — Define your search**
Choose your target role, preferred locations, experience level, remote preference, and which job boards to search. Save the configuration if you want to run it regularly.

**Step 3 — Run the search**
Hit search. The platform scrapes all selected sources simultaneously, deduplicates results, and populates your job list in seconds.

**Step 4 — Apply**
Apply to individual jobs with one click, or select multiple and batch apply. For each job, the best-matching resume is selected automatically. Cover letters and tailored resumes are generated on demand.

**Step 5 — Track and analyze**
Monitor your pipeline on the Applications page. Watch your response rates by source and by day on the Analytics page. Iterate on your search strategy based on real data.

---

## Setup

You need accounts with three services — all have free tiers:

- **[Supabase](https://supabase.com)** — the database
- **[OpenAI](https://platform.openai.com)** — GPT-4o for all AI features
- **[Resend](https://resend.com)** — email notifications (optional)

Once you have your API keys, install dependencies, add them to your environment configuration file, initialize the database, and start the development server. The full setup takes under 10 minutes.

For the Chrome extension — load it as an unpacked extension from the `chrome-extension` folder in Chrome's developer mode, enter your details in the popup once, and it will handle LinkedIn Easy Apply forms automatically from then on.

---

## Platform Modules

| Module | What it does |
|---|---|
| **Dashboard** | Live overview — active applications, recent matches, pipeline health |
| **Resume Manager** | Upload, label, activate/deactivate, and delete resumes. AI parses each one automatically |
| **Search** | Multi-source job discovery with filters and saved search configurations |
| **All Jobs** | Full table of discovered jobs with apply, tailor, cover letter, and batch select actions |
| **AI Matches** | Jobs ranked by compatibility score against your resume |
| **Applications** | Full pipeline tracker with status management and CSV export |
| **Analytics** | Response rates, application trends, best days to apply |
| **Settings** | Notification preferences, automation limits, application criteria |
| **Companies** | Track target companies, career pages, and hiring activity |

---

## Built With

Next.js · TypeScript · Tailwind CSS · ShadCN UI · Supabase · Drizzle ORM · OpenAI GPT-4o · TanStack Query · Recharts · Playwright · Resend

---

<div align="center">

<br/>

*Built for people who treat their job search like a system, not a prayer.*

<br/>

</div>
