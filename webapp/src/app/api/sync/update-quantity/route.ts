import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/guards'
import { claimSyncAction, markSyncActionDone } from '@/lib/sync/idempotency'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const schema = z.object({
      actionId: z.string().uuid().optional(),
      poId: z.string().min(1),
      quantity: z.number().int().nonnegative(),
      version: z.number().int().nonnegative().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { actionId, poId, quantity, version } = parsed.data

    // Only production roles should be allowed to report quantities from the floor.
    const { supabase, user } = await requireRole([
      'production_supervisor',
      'cutting_master',
      'production_head',
      'production_coordinator',
      'director',
      'super_admin',
    ])

    if (actionId) {
      const claim = await claimSyncAction({ actionId, userId: user.id, actionType: 'UPDATE_QUANTITY' })
      if (claim === 'done') return NextResponse.json({ success: true })
      if (claim === 'in_flight') return NextResponse.json({ error: 'Retry later' }, { status: 503 })
    }

    // Atomic optimistic lock: update only if version matches (when provided).
    // This avoids a race between "read version" and "write".
    let query = supabase
      .from('purchase_orders')
      .update({
        packed_quantity: quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', poId)

    if (version !== undefined) {
      query = query.eq('version', version)
    }

    const { data, error } = await query.select('id').maybeSingle()
    if (error) return NextResponse.json({ error: 'Failed to sync quantity update' }, { status: 500 })

    // If version was provided and no row matched, it's a conflict.
    if (version !== undefined && !data) {
      return NextResponse.json({ error: 'Conflict' }, { status: 409 })
    }

    if (actionId) {
      await markSyncActionDone({ actionId, userId: user.id })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
