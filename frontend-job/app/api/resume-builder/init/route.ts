import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS resume_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID REFERENCES profile(id) NOT NULL,
        name TEXT NOT NULL DEFAULT 'Untitled Resume',
        data JSONB NOT NULL DEFAULT '{}',
        template_id TEXT NOT NULL DEFAULT 'classic',
        status TEXT NOT NULL DEFAULT 'draft',
        deployed_resume_id UUID REFERENCES resumes(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
