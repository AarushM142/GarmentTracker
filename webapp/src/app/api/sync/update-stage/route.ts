import { NextResponse } from 'next/server';
import { updatePOStatus } from '@/app/(dashboard)/floor/actions';

export async function POST(request: Request) {
  try {
    const { poId, newStatus, version } = await request.json();

    if (!poId || !newStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await updatePOStatus(poId, newStatus, version);

    if (result.error) {
      if (result.error.toLowerCase().includes('conflict') || result.error.toLowerCase().includes('modified')) {
        return NextResponse.json({ error: result.error }, { status: 409 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('API Sync update-stage error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
