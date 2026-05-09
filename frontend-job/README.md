<div align="center">

<br/>

# Job Agent AI

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

## What is this?

Job Agent is a personal AI career automation system. It continuously discovers companies and jobs across the internet, ranks them against your profile using **vector cosine similarity**, rewrites your application materials per role, submits applications, and helps you build a stunning resume — all without you touching a single form.

You set your preferences once. The platform runs the entire job search pipeline for you.

---

## The Problem It Solves

The average job seeker spends **11 hours per week** on repetitive application tasks — searching the same boards daily, copy-pasting the same resume, writing near-identical cover letters, and manually tracking status in spreadsheets.

None of that work requires human judgment. Job Agent automates all of it.

---

## Core Capabilities

<br/>

### AI-Powered Resume Builder (16 Templates)
Design stunning, ATS-optimized resumes directly inside the platform. Choose from **16 professional templates** spanning Single-Column, Sidebar, Banner, Two-Column, Timeline, and Traditional layouts. Every template renders identically in both the live HTML preview and the downloaded PDF. Features include:
- **Import existing PDF** → AI parses and pre-fills all sections automatically
- **Live preview** with real-time rendering as you type
- **AI Enhancement** → GPT-4o rewrites your bullet points for maximum impact
- **One-click PDF download** with pixel-perfect fidelity across all 16 layouts
- **Deploy feature** to share a live URL of your resume
- **Multiple saved projects** (e.g., "Frontend Resume", "Leadership Resume")

Available templates: Classic · Modern · Minimal · Executive · Sharp · Scholar · Compact · Banner · Teal Banner · Timeline · Atlantic · Slate · Sidebar Light · Two Column · Mercury · Traditional

<br/>

### Intelligent Multi-Source Job Discovery (11 Sources)
Simultaneously searches **11 job boards** with a single query — RemoteOK, WeWorkRemotely, Indeed, LinkedIn, Glassdoor, Greenhouse, Lever, Adzuna, The Muse, Arbeitnow, and Naukri. Filters by role, location, remote preference, date posted, and **Experience Level** (Fresher · 1–2 yrs · 2–3 yrs · 3–5 yrs · 5–7 yrs · Senior · Custom). Every result is deduplicated and stored — you never see the same job twice.

<br/>

### Advanced Search Copilot & Saved Searches
Never re-type your search filters. Save your favorite search configurations (Role, Location, Sources, Experience Level) and switch between them with a single click. Watch the system work in real-time with the **Search Progress Radar** — a visual modal showing source scanning, deduplication, and AI matching progress.

<br/>

### Autonomous Company Discovery Engine (100+ Companies, 5 Sources)
The platform autonomously builds a database of companies hiring in your space from five sources — each with a live animated progress card showing exactly what's running:

| Source | What it finds |
|---|---|
| **Known Companies** | 100+ hand-verified tech companies with correct ATS board URLs (instant, zero scraping) |
| **Y Combinator** | Full YC portfolio — current and alumni batches |
| **GitHub Trending** | Companies behind trending open-source repositories |
| **VC Portfolios** | a16z, Sequoia, Accel, Bessemer, and more |
| **Wellfound** | Active hiring startups from the Wellfound (AngelList) board |

Add any company manually by pasting its website or job board URL — ATS type is auto-detected.

<br/>

### Public API Job Scraper (6 ATS Types, Zero Browser Automation)
Scrapes live job listings directly from each company's ATS via **public JSON APIs** — no browser, no proxy, no stealth needed. Supported ATS platforms:

| ATS | API used | Example companies |
|---|---|---|
| **Greenhouse** | `boards-api.greenhouse.io/v1/boards/{slug}/jobs` | Stripe, Uber, Anthropic, OpenAI, Deel, GitLab, Discord, Canva, Rivian, Monzo |
| **Lever** | `api.lever.co/v0/postings/{slug}?mode=json` | Netflix, Rippling, Brex, Plaid, Webflow, Notion, Cohere |
| **Ashby** | `jobs.ashbyhq.com/api/non-admin/job-board` | Vercel, Linear, Supabase, ElevenLabs, Groq, Zed, Modal, Cursor |
| **SmartRecruiters** | `api.smartrecruiters.com/v1/companies/{slug}/postings` | Twilio, Klarna, Zalando, Adyen, Booking |
| **Workday** | `{tenant}.myworkdayjobs.com/wday/cxs/{tenant}/{board}/jobs` | Shopify, Snowflake, CrowdStrike, Palantir, ServiceNow |
| **BambooHR** | `{slug}.bamboohr.com/careers/list` | Small-to-mid size companies on BambooHR |

All jobs are upserted with `onConflictDoNothing` — re-running never creates duplicates.

<br/>

### Smart Resume Selection
Upload multiple versions of your resume. When applying to any job, the platform automatically scores each resume against the job description using **pgvector Cosine Similarity** and selects the most relevant one. No manual switching. Every application goes out with the resume most likely to pass screening.

<br/>

### AI-Powered Resume Tailoring
Your master resume is rewritten for each specific job using GPT-4o. The AI restructures your experience, brings forward the most relevant skills, and mirrors the language in the job description — so your resume looks like it was written for that role specifically.

<br/>

### AI Cover Letter Generation
A tailored, professional cover letter for any job in seconds. The AI reads the job description, understands what the company values, and writes something genuine — not a template with your name swapped in.

<br/>

### Autonomous Daily Pipeline (4:00 AM)
The system runs a **fully autonomous 24/7 loop**. Every morning it discovers new companies, scrapes their latest job openings, calculates match scores, and sends a curated **Telegram digest** of your top "High-Match" roles.

<br/>

### Batch Apply
Select any number of jobs from your list and apply to all of them in one click. Smart Resume Selection runs independently per job. The system handles the full submission lifecycle — tailoring, form-filling, and submission.

<br/>

### Full Application Pipeline Tracker
Every application is tracked from submission through screening, interview, offer, and outcome. Update statuses manually or let automation update them. Export your entire history as a CSV at any time.

<br/>

### Analytics Dashboard
Understand where your search is working and where it isn't. See response rates broken down by job board, best days to apply, and application trends over time. Make decisions based on your own data.

<br/>

### Telegram Notifications
Real-time alerts when high-match jobs (80%+ score) are found, application status updates, daily summaries, and company discovery reports — all delivered directly to your Telegram.

---

## How It Works

**Step 1 — Build or Import Your Resume**
Use the Resume Builder to create a stunning ATS-optimized resume from scratch with 16 templates, or import your existing PDF and let AI pre-fill all sections instantly.

**Step 2 — Set Up Your Profile**
Upload multiple resume versions — one for Frontend, one for Backend, one for Leadership. The AI matches each to the right job automatically.

**Step 3 — Discover Companies**
Click **Load Known Companies** to instantly load 100+ top tech companies, or **Auto-Discover All** to pull from YC, GitHub Trending, VC portfolios, and Wellfound. Watch live per-source progress bars as each source completes.

**Step 4 — Scrape Live Jobs**
Click **Scrape All Jobs** — the platform hits each company's ATS public API directly, pulls live listings, and stores them with a real-time progress counter showing jobs found and companies processed.

**Step 5 — Let the Pipeline Run**
Enable the daily discovery pipeline. At 4:00 AM, the system finds new companies, scrapes their career pages, runs AI match scoring, and sends you a curated Telegram digest.

**Step 6 — 1-Click Apply**
Apply to individual jobs or batch-apply dozens at once. For each, the system selects the best resume, tailors it, writes a cover letter, and submits.

**Step 7 — Track & Optimize**
Monitor your pipeline on the Applications page. Use the Analytics dashboard to identify which sources yield the best response rates and optimize your strategy.

---

## Setup

You need accounts with the following services — all have free tiers:

- **[Supabase / PostgreSQL + pgvector](https://supabase.com)** — Database with vector support
- **[OpenAI](https://platform.openai.com)** — GPT-4o for all AI features
- **[SerpAPI / Serper](https://serper.dev)** — For Google Jobs & company discovery
- **[Resend](https://resend.com)** — Email notifications (optional)
- **[Telegram Bot](https://t.me/botfather)** — Real-time job alerts (optional)

```bash
# Clone and install
git clone https://github.com/yourusername/job-agent.git
cd job-agent
npm install

# Configure environment
cp .env.example .env.local
# Add: DATABASE_URL, OPENAI_API_KEY, SERPER_API_KEY, etc.

# Push schema to database
npx drizzle-kit push

# Run development server
npm run dev
```

---

## Platform Modules

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

## Resume Builder Templates

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

## Supported ATS Platforms

Companies using these ATS platforms are fully auto-scraped via public JSON APIs:

**Greenhouse** — `boards.greenhouse.io` · Anthropic, OpenAI, Stripe, Uber, Lyft, Spotify, Cloudflare, Datadog, Deel, GitLab, Automattic, Zapier, Discord, Canva, DoorDash, Instacart, Monzo, Wise, Robinhood, Rivian, Waymo, Gusto, Lattice, Retool, PostHog, Chainalysis, Coinbase, Databricks, and 20+ more

**Lever** — `jobs.lever.co` · Netflix, Rippling, Brex, Plaid, Notion, Cohere, Scale AI, Weights & Biases, Grafana Labs, Webflow, Kong, Front, and more

**Ashby** — `jobs.ashbyhq.com` · Vercel, Linear, Supabase, Cursor, ElevenLabs, Groq, Zed, Modal, Railway, Cal.com, Hugging Face, Letta, Clerk, Resend, Neon, and more

**SmartRecruiters** — Twilio, Klarna, Zalando, Booking.com, Adyen, IKEA

**Workday** — Shopify, Snowflake, CrowdStrike, Palantir, ServiceNow, Workday

**BambooHR** — Mid-size companies on BambooHR (auto-detected from URL)

---

## Built With

Next.js · TypeScript · Tailwind CSS · ShadCN UI · PostgreSQL (pgvector) · Drizzle ORM · OpenAI GPT-4o · TanStack Query · Recharts · @react-pdf/renderer · Resend · Telegram Bot API · Zod · pLimit · date-fns

---

<div align="center">

<br/>

*Built for people who treat their job search like a system, not a prayer.*

<br/>

</div>
