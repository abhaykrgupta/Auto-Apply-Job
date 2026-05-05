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

### Autonomous Company Discovery Engine
Goes beyond job boards. The platform autonomously finds new companies hiring in your space by monitoring **Google Jobs Search**, **ProductHunt**, and **Startup Registries (YC, etc.)**. It builds a database of companies you didn't even know existed.

<br/>

### Universal Career Page Scraper
The world's most powerful career page scraper. It automatically detects if a company uses a known ATS (Greenhouse, Lever) or a custom site. For custom sites, it uses an **AI-Hybrid engine** to navigate the page, find the jobs, and extract details—allowing it to scrape *any* career page in the world.

<br/>

### Stealth Automation Pipeline
Built with `playwright-extra` and advanced **Stealth Plugins**, the platform bypasses bot detection on sophisticated hiring platforms. It mimics human behavior to ensure your automation isn't blocked.

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

### Autonomous Daily Pipeline
The system runs a **fully autonomous 24/7 loop**. At 3:00 AM every day, it discovers new companies, scrapes their latest job openings, calculates your match scores, and sends high-match notifications to your Telegram or Dashboard.

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

### LinkedIn Easy Apply Chrome Extension (Copilot)
A browser extension that detects LinkedIn's Easy Apply modal and auto-fills your details. It also injects a **Match Score UI** directly on LinkedIn and Greenhouse pages, so you know if a job is worth applying for before you even click.

---

## How It Works

**Step 1 — Set up your profile**
Upload your resume. The AI extracts your skills, experience, and background. Upload multiple versions if you're targeting different role types. Label each one and set which are active.

**Step 2 — Configure Automation**
Define your target roles and preferred sources. Enable the daily discovery pipeline to let the AI find companies and jobs while you sleep.

**Step 3 — Review Matches**
Wake up to a dashboard of "High-Match" jobs. The AI uses **Vector Mathematics (Cosine Similarity)** to rank jobs against your skills with scientific accuracy.

**Step 4 — 1-Click Apply**
Apply to individual jobs or batch-apply. For each job, the system tailors the resume, writes the cover letter, and bypasses bot protection to submit your application.

**Step 5 — Track and analyze**
Monitor your pipeline on the Applications page. Watch your response rates by source and by day on the Analytics page. Iterate on your search strategy based on real data.

---

## Setup

You need accounts with four services — all have free tiers:

- **[PostgreSQL (pgvector)](https://supabase.com)** — Database with vector support
- **[OpenAI](https://platform.openai.com)** — GPT-4o for all AI features
- **[SerpAPI / Serper](https://serper.dev)** — For Google Jobs discovery
- **[Resend](https://resend.com)** — Email notifications (optional)

Once you have your API keys, install dependencies, add them to your environment configuration file, initialize the database, and start the development server. The full setup takes under 10 minutes.

For the Chrome extension — load it as an unpacked extension from the `chrome-extension` folder in Chrome's developer mode, enter your details in the popup once, and it will handle LinkedIn Easy Apply forms automatically from then on.

---

## Platform Modules

| Module | What it does |
|---|---|
| **Dashboard** | Live overview — active applications, recent matches, pipeline health |
| **Resume Manager** | Upload, label, activate/deactivate, and delete resumes. AI parses each one automatically |
| **Search** | Multi-source job discovery with filters and saved search configurations |
| **Discovery Engine** | Autonomous company finding via ProductHunt, VC registries, and Google |
| **All Jobs** | Full table of discovered jobs with apply, tailor, cover letter, and batch select actions |
| **AI Matches** | Jobs ranked by compatibility score against your resume using Vector Similarity |
| **Applications** | Full pipeline tracker with status management and CSV export |
| **Analytics** | Response rates, application trends, best days to apply |
| **Settings** | Notification preferences, automation limits, application criteria |
| **Companies** | Track target companies, career pages, and hiring activity |

---

## Built With

Next.js · TypeScript · Tailwind CSS · ShadCN UI · PostgreSQL (pgvector) · Drizzle ORM · OpenAI GPT-4o · TanStack Query · Recharts · Playwright (Stealth) · Resend

---

<div align="center">

<br/>

*Built for people who treat their job search like a system, not a prayer.*

<br/>

</div>
