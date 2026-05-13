import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCopilotUser } from '@/lib/copilot-auth';
import { db } from '@/lib/db';
import { profile, resumes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  // Accept both session (dashboard) and Bearer token (extension)
  const userId = await getCopilotUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  if (!row) return NextResponse.json(null);

  // Also fetch active resume URL for the extension
  const [resume] = await db
    .select({ fileUrl: resumes.fileUrl, version: resumes.version })
    .from(resumes)
    .where(eq(resumes.profileId, row.id))
    .limit(1);

  // Return in the extension's expected profile schema format
  // This maps the DB columns to the nested profile object the extension stores
  const extensionProfile = {
    personal: {
      firstName: row.name?.split(' ')[0] ?? '',
      lastName:  row.name?.split(' ').slice(1).join(' ') ?? '',
      email:     row.email,
      phone:     row.phone ?? '',
      city:      (row.preferredLocations as string[] | null)?.[0] ?? '',
      state:     '',
      country:   '',
      linkedIn:  row.linkedin ?? '',
      github:    row.github ?? '',
      portfolio: row.portfolio ?? '',
    },
    work: {
      title:          (row.preferredRoles as string[] | null)?.[0] ?? '',
      yearsExp:       0,
      currentCompany: '',
      summary:        row.bio ?? '',
      openToRelocate: false,
      remoteOnly:     row.remotePreference === 'remote',
      availableDate:  '',
    },
    compensation: {
      desiredSalary:  row.salaryMin ?? 0,
      currency:       'USD',
      salaryFlexible: true,
    },
    workAuth: {
      status:             'citizen',
      requireSponsorship: false,
    },
    education:   [],
    eeoc:        {},
    resumeUrl:   resume?.fileUrl ?? '',
    resumeVersion: String(resume?.version ?? '1'),
  };

  return NextResponse.json(extensionProfile);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const [existing] = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(profile)
      .set({
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        bio: body.bio ?? null,
        linkedin: body.linkedin ?? null,
        github: body.github ?? null,
        portfolio: body.portfolio ?? null,
        remotePreference: body.remotePreference ?? null,
        salaryMin: body.salaryMin ?? null,
        salaryMax: body.salaryMax ?? null,
        preferredRoles: body.preferredRoles ?? null,
        preferredLocations: body.preferredLocations ?? null,
        updatedAt: new Date(),
      })
      .where(eq(profile.userId, session.user.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(profile)
    .values({
      userId: session.user.id,
      name: body.name ?? session.user.name ?? '',
      email: body.email ?? session.user.email ?? '',
      phone: body.phone ?? null,
      bio: body.bio ?? null,
      linkedin: body.linkedin ?? null,
      github: body.github ?? null,
      portfolio: body.portfolio ?? null,
      remotePreference: body.remotePreference ?? null,
      salaryMin: body.salaryMin ?? null,
      salaryMax: body.salaryMax ?? null,
      preferredRoles: body.preferredRoles ?? null,
      preferredLocations: body.preferredLocations ?? null,
    })
    .returning();

  return NextResponse.json(created);
}
