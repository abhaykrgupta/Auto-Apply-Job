import { getResumes, toggleResumeActive, updateResumeLabel, deleteResume } from '@/lib/actions/resume';
import { resumeUpdateSchema, resumeDeleteSchema } from '@/lib/validations/resume';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await getResumes();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/resume GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const parsed = resumeUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { id, isActive, label } = parsed.data;

    if (typeof isActive === 'boolean') await toggleResumeActive(id, isActive);
    if (typeof label === 'string') await updateResumeLabel(id, label);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const parsed = resumeDeleteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { id } = parsed.data;
    await deleteResume(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
