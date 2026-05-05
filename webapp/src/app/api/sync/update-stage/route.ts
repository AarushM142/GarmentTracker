import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updatePOStatus } from '@/app/(dashboard)/floor/actions'
import { requireUser } from '@/lib/auth/guards'
import { claimSyncAction, markSyncActionDone } from '@/lib/sync/idempotency'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const schema = z.object({
      actionId: z.string().uuid().optional(),
      poId: z.string().min(1),
      newStatus: z.string().min(1),
      version: z.number().int().nonnegative().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { actionId, poId, newStatus, version } = parsed.data

    // Idempotency claim (crash-safe). If actionId is absent, proceed best-effort.
    if (actionId) {
      const { user } = await requireUser()
      const claim = await claimSyncAction({ actionId, userId: user.id, actionType: 'UPDATE_STAGE' })
      if (claim === 'done') return NextResponse.json({ success: true })
      if (claim === 'in_flight') return NextResponse.json({ error: 'Retry later' }, { status: 503 })
      // claimed => proceed and mark done after successful mutation
      const result = await updatePOStatus(poId, newStatus, version)
      if (result.error) {
        if (result.error.toLowerCase().includes('conflict') || result.error.toLowerCase().includes('modified')) {
          return NextResponse.json({ error: 'Conflict' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to sync stage update' }, { status: 500 })
      }
      await markSyncActionDone({ actionId, userId: user.id })
      return NextResponse.json({ success: true })
    }

    const result = await updatePOStatus(poId, newStatus, version);

    if (result.error) {
      if (result.error.toLowerCase().includes('conflict') || result.error.toLowerCase().includes('modified')) {
        return NextResponse.json({ error: 'Conflict' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to sync stage update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
