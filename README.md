<div align="center">

<br/>

# 🚀 AI Auto Job Agent Platform

### The autonomous job search platform that works while you sleep.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![OpenAI](https://img.shields.io/badge/GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![PostgreSQL](https://img.shields.io/badge/pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team)

<br/>

*Stop manually searching job boards. Stop writing the same cover letter 50 times. Stop copy-pasting your resume into forms.*
*Job Agent does all of it — automatically, intelligently, at scale.*

<br/>

</div>

---

## 📋 What is this?

Job Agent is a personal AI career automation system. The architecture has been thoughtfully decoupled into a high-performance **Frontend** dashboard and an intensive **Backend Worker** engine. It continuously discovers companies and jobs across the internet, ranks them against your profile using **vector cosine similarity**, rewrites your application materials per role, submits applications via headless browsers, and helps you build a stunning resume — all without you touching a single form.

You set your preferences once. The platform runs the entire job search pipeline for you.

---

## 🏗️ Architectural Paradigm

The system is fully decoupled to ensure horizontal scalability and independent deployment:

- **🖥️ Presentation Layer (`frontend-job/`)**: A highly responsive, interactive command center built on Next.js. Provides real-time tracking, interactive resume building, and analytical visualizations.
- **⚙️ Processing Engine (`backend-job/`)**: An intensive, queue-based background worker system handling web scraping, AI inference, and headless browser automation while adhering to strict rate limits.

---

## ⚠️ The Problem It Solves

The average job seeker spends **11 hours per week** on repetitive application tasks — searching the same boards daily, copy-pasting the same resume, writing near-identical cover letters, and manually tracking status in spreadsheets.

None of that work requires human judgment. Job Agent automates all of it.

---

## ✨ Core Capabilities

<br/>

### 🎨 AI-Powered Resume Builder (16 Templates)
Design stunning, ATS-optimized resumes directly inside the platform. Choose from **16 professional templates** spanning Single-Column, Sidebar, Banner, Two-Column, Timeline, and Traditional layouts. Every template renders identically in both the live HTML preview and the downloaded PDF. Features include:
- **Import existing PDF** → AI parses and pre-fills all sections automatically
- **Live preview** with real-time rendering as you type
- **AI Enhancement** → GPT-4o rewrites your bullet points for maximum impact
- **One-click PDF download** with pixel-perfect fidelity across all 16 layouts
- **Deploy feature** to share a live URL of your resume
- **Multiple saved projects** (e.g., "Frontend Resume", "Leadership Resume")

<br/>

### 🔍 Intelligent Multi-Source Job Discovery (11 Sources)
Simultaneously searches **11 job boards** with a single query — RemoteOK, WeWorkRemotely, Indeed, LinkedIn, Glassdoor, Greenhouse, Lever, Adzuna, The Muse, Arbeitnow, and Naukri. Filters by role, location, remote preference, date posted, and **Experience Level**. Every result is deduplicated and stored.

<br/>

### 🎯 Advanced Search Copilot & Saved Searches
Never re-type your search filters. Save your favorite search configurations and switch between them with a single click. Watch the system work in real-time with the **Search Progress Radar** — a visual modal showing source scanning, deduplication, and AI matching progress.

<br/>

### 📡 Autonomous Company Discovery Engine (100+ Companies, 5 Sources)
The platform autonomously builds a database of companies hiring in your space from five sources — each with a live animated progress card showing exactly what's running:

| Source | What it finds |
|---|---|
| **Known Companies** | 100+ hand-verified tech companies with correct ATS board URLs |
| **Y Combinator** | Full YC portfolio — current and alumni batches |
| **GitHub Trending** | Companies behind trending open-source repositories |
| **VC Portfolios** | a16z, Sequoia, Accel, Bessemer, and more |
| **Wellfound** | Active hiring startups from the Wellfound (AngelList) board |

<br/>

### 🤖 Public API Job Scraper (6 ATS Types, Zero Browser Automation)
Scrapes live job listings directly from each company's ATS via **public JSON APIs** — no browser, no proxy, no stealth needed. All jobs are upserted with `onConflictDoNothing` — re-running never creates duplicates.

<br/>

### ⚖️ Smart Resume Selection
Upload multiple versions of your resume. When applying to any job, the platform automatically scores each resume against the job description using **pgvector Cosine Similarity** and selects the most relevant one.

<br/>

### 🧠 AI-Powered Resume Tailoring & Cover Letters
Your master resume is rewritten for each specific job using GPT-4o. The AI restructures your experience, brings forward the most relevant skills, and mirrors the language in the job description. Furthermore, it generates a genuine, highly-tailored professional cover letter for any job in seconds.

<br/>

### ⚡ Autonomous Daily Pipeline & Batch Apply
The system runs a **fully autonomous 24/7 loop**. Every morning it discovers new companies, scrapes their latest job openings, calculates match scores, and sends a curated digest. You can also select any number of jobs and **Batch Apply** in one click.

<br/>

### 📊 Application Tracker & Analytics
Every application is tracked from submission to outcome. The Analytics dashboard helps you understand where your search is working, showing response rates by job board, best days to apply, and application trends.

<br/>

### 📲 Telegram Notifications
Real-time alerts when high-match jobs (80%+ score) are found, application status updates, daily summaries, and company discovery reports.

---

## 🔄 How It Works

**Step 1 — Build or Import Your Resume**
Use the Resume Builder to create a stunning ATS-optimized resume, or import your existing PDF.

**Step 2 — Set Up Your Profile**
Upload multiple resume versions. The AI matches each to the right job automatically.

**Step 3 — Discover Companies**
Load known tech companies or Auto-Discover all from YC, GitHub Trending, VC portfolios, and Wellfound.

**Step 4 — Scrape Live Jobs**
Hit each company's ATS public API directly, pull live listings, and store them with a real-time progress counter.

**Step 5 — Let the Pipeline Run**
Enable the daily discovery pipeline to automatically find, match, and notify you of top roles.

**Step 6 — 1-Click Apply**
Apply to individual jobs or batch-apply dozens at once. The system handles tailoring and form-filling autonomously.

**Step 7 — Track & Optimize**
Monitor your pipeline on the Applications page and use the Analytics dashboard to refine your strategy.

---

## 🛡️ Setup

You need accounts with the following services — all have free tiers:

- **Supabase / PostgreSQL + pgvector** — Database with vector support
- **OpenAI** — GPT-4o for all AI features
- **SerpAPI / Serper** — For Google Jobs & company discovery
- **Resend** — Email notifications (optional)
- **Telegram Bot** — Real-time job alerts (optional)

*Note: Since the platform is now decoupled, you will need to configure environment variables (`.env.local` / `.env`) and run the install commands for both the `frontend-job/` and `backend-job/` directories independently.*

---

## 🗂️ Platform Modules

| Module | What it does |
|---|---|
| **Dashboard** | Live overview — active applications, recent matches, pipeline health |
| **Resume Builder** | Build resumes with 16 templates, live preview, AI enhancement, and PDF export |
| **Resume Manager** | Upload, label, activate/deactivate, and delete parsed resume versions |
| **Search** | 11-source discovery with Saved Searches, Radar Visualization, and Experience Filtering |
| **Companies** | 100+ company database with per-source discovery progress, ATS breakdown, and live job scraping |
| **All Jobs** | Full table of all discovered jobs — apply, tailor, cover letter, and batch select |
| **AI Matches** | Jobs ranked by Vector Cosine Similarity score against your resume |
| **Applications** | Full pipeline tracker from submission to offer with CSV export |
| **Analytics** | Response rates, application trends, best days to apply |
| **Settings** | Notification preferences, automation limits, application criteria |

---

## 📝 Resume Builder Templates

| Template | Layout | Style |
|---|---|---|
| Classic | Single Column | Timeless serif, centered header |
| Modern | Single Column | Clean sans-serif, indigo accents |
| Minimal | Single Column | Whitespace-forward, ultra-clean |
| Executive | Single Column | Bold serif, formal |
| Sharp | Single Column | Left border accents |
| Scholar | Single Column | Academic serif |
| Compact | Single Column | Maximum information density |
| Banner | Banner Header | Bold full-width colored header |
| Teal Banner | Banner Header | Teal band + clean body |
| Timeline | Timeline | Dot-line timeline for experience |
| Atlantic | Sidebar Dark | Navy sidebar, two-column |
| Slate | Sidebar Dark | Charcoal sidebar, two-column |
| Sidebar Light | Sidebar Light | Gray sidebar split |
| Two Column | Two Column | Balanced equal-split layout |
| Mercury | Two Column | Narrow left panel |
| Traditional | Traditional | ALL CAPS sections, ATS-safe |

---

## 🌐 Supported ATS Platforms

Companies using these ATS platforms are fully auto-scraped via public JSON APIs:

- **Greenhouse** — `boards.greenhouse.io`
- **Lever** — `jobs.lever.co`
- **Ashby** — `jobs.ashbyhq.com`
- **SmartRecruiters** — `api.smartrecruiters.com`
- **Workday** — `myworkdayjobs.com`
- **BambooHR** — `{slug}.bamboohr.com`

---

## 🛠️ Built With

Next.js · Node.js · TypeScript · Tailwind CSS · ShadCN UI · PostgreSQL (pgvector) · Drizzle ORM · OpenAI GPT-4o · TanStack Query · Recharts · @react-pdf/renderer · Resend · Telegram Bot API · Zod · Playwright

---

<div align="center">

<br/>

*Built for people who treat their job search like a system, not a prayer.*

<br/>

</div>
