import { applicationStatusUpdateSchema } from '@/lib/validations/applications';
import { NextRequest, NextResponse } from 'next/server';
import { getApplicationById, updateApplicationStatus, deleteApplication } from '@/lib/actions/applications';
import { applicationIntelligence } from '@/lib/intelligence/application-intelligence';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await getApplicationById(id);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = applicationStatusUpdateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const { status, errorMessage: notes } = parsed.data;
    const app = await updateApplicationStatus(id, status as any, notes);
    // Record outcome event for intelligence tracking (fire-and-forget)
    applicationIntelligence.recordOutcome({ applicationId: id, newStatus: status as any }).catch(() => {});
    return NextResponse.json(app);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = await deleteApplication(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Application deleted successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    console.error('[DELETE /api/applications/:id]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
