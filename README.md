<div align="center">

# Job Agent AI Platform

*Your Personal AI-Powered Career Copilot*

[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green.svg)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/AI-GPT--4o-purple.svg)](https://openai.com)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()

</div>

---

## Overview

Job Agent is a full-stack AI automation platform that handles the entire job search pipeline — from scraping listings across 8+ job boards, to generating tailored resumes and cover letters, to auto-submitting applications. Upload your resume, set your preferences, and let the agent work while you sleep.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | ShadCN UI v4 |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM + postgres.js |
| AI | OpenAI GPT-4o |
| State | TanStack Query v5 |
| Charts | Recharts |
| Automation | Playwright |
| Email | Resend |

---

## Features

### Multi-Resume Smart Selection
Upload multiple resumes (e.g. "Frontend", "Backend", "Fullstack"). When applying to any job, the platform automatically scores each active resume against the job description using keyword matching and picks the best one — no API calls, runs in under 1ms per resume. You can label, activate/deactivate, and delete resumes individually.

### Job Search — 8+ Sources
Search across RemoteOK, WeWorkRemotely, Indeed, LinkedIn, Glassdoor, Greenhouse, and Lever simultaneously. Filters include role, location, remote preference, date posted, and experience level (Fresher, 1–2 yrs, 2–3 yrs, 3–5 yrs, 5–7 yrs, Senior, or custom). Add specific Greenhouse/Lever board URLs for direct scraping.

### Saved Searches
Save any combination of search filters with a name. Reload them instantly with one click — useful when searching for multiple different role types regularly.

### AI Resume Tailoring
One click rewrites your resume for a specific job using GPT-4o — highlighting the exact skills and keywords the employer is looking for.

### AI Cover Letter Generator
Generate a tailored, professional cover letter for any job in seconds. Copy to clipboard or regenerate as many times as you want.

### Batch Apply
Select multiple jobs with checkboxes, then apply to all of them at once. Each job independently gets the best-matching resume via Smart Selection.

### Application Tracker
Full pipeline view of every application — status from `pending` → `applied` → `interviewing` → `accepted`/`rejected`. Click any application for the detail view with status management buttons. Export all applications as CSV.

### Analytics Dashboard
- Applications over time (line chart)
- Status breakdown (pie chart)
- Response rate by job source — see which board actually replies
- Best day of week to apply — combo bar + line chart showing application count vs response rate

### Duplicate Job Detector
Jobs are deduplicated at the database level during every scrape. Same job from the same source is silently skipped — your jobs list stays clean.

### Chrome Extension — LinkedIn Easy Apply Bot
A Manifest v3 Chrome extension that watches for LinkedIn Easy Apply modals and automatically fills in phone number, location, work authorization (Yes), and visa sponsorship (No). Shows a brief confirmation badge when it fills a form. Set up your profile details once in the extension popup.

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- An [OpenAI](https://platform.openai.com) API key (GPT-4o access)
- A [Resend](https://resend.com) API key (for email notifications, optional)

### 2. Install dependencies

```bash
cd job-agent
npm install
```

### 3. Configure environment

Create `.env.local` in the `job-agent` directory:

```env
# Supabase — use the Transaction Pooler URL (port 6543) from Connect > ORM tab
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-[region].pooler.supabase.com:6543/postgres

NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OpenAI
OPENAI_API_KEY=sk-...

# Resend (optional — for email notifications)
RESEND_API_KEY=re_...
USER_EMAIL=you@example.com

# Telegram (optional — for Telegram notifications)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### 4. Push database schema

```bash
npx tsx scripts/create-saved-searches.ts
npx tsx scripts/add-resume-label.ts
npm run db:push
```

> Note: If `db:push` fails with a constraint parsing error (known drizzle-kit bug on some Supabase plans), the migration scripts above handle the required tables directly.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage Flow

1. **Upload resume** — go to `/resume`, upload a PDF. AI parses skills, experience, and education automatically. Upload multiple resumes and label them.

2. **Search for jobs** — go to `/search`, enter a role, select sources and filters, click Start Auto-Search. Jobs are saved to your database.

3. **Review jobs** — go to `/jobs`, browse the table. Click Tailor to rewrite your resume for that role, Letter to generate a cover letter, or Apply to auto-submit.

4. **Batch apply** — check multiple jobs and use the sticky Apply bar at the bottom to apply to all at once.

5. **Track progress** — go to `/applications` to see all applications and update statuses. Export as CSV anytime.

6. **Analyze** — go to `/analytics` to see response rates by source and the best days to apply.

---

## Chrome Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. Click the extension icon → enter your phone number and location
5. Go to LinkedIn → open any Easy Apply job → the extension auto-fills the form

---

## Project Structure

```
job-agent/
├── app/
│   ├── (dashboard)/          # All main pages (resume, jobs, search, analytics, etc.)
│   └── api/                  # API routes
│       ├── jobs/             # Scrape, apply, batch-apply, cover-letter, tailor
│       ├── resume/           # Upload, parse, PATCH (label/active), DELETE
│       ├── applications/     # List, detail, status update
│       ├── saved-searches/   # CRUD for saved search filters
│       └── analytics/        # Stats aggregation
├── lib/
│   ├── db/                   # Drizzle schema + queries
│   ├── scrapers/             # Job board scrapers (Greenhouse, Lever, universal)
│   ├── openai/               # Resume parsing, matching, tailoring, cover letters
│   ├── analytics/            # Analytics engine
│   ├── automation/           # Playwright auto-apply engine
│   └── utils/
│       ├── resume-matcher.ts # Fast keyword-based resume scoring
│       └── file-upload.ts    # Resume file handling
├── components/
│   ├── layout/               # Sidebar, Header
│   ├── jobs/                 # CoverLetterModal
│   ├── resume/               # TailoredResumeModal
│   └── ui/                   # ShadCN components
└── chrome-extension/         # LinkedIn Easy Apply bot
```

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio (database GUI)
```
