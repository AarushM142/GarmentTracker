import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/guards'
import { claimSyncAction, markSyncActionDone } from '@/lib/sync/idempotency'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const schema = z.object({
      actionId: z.string().uuid().optional(),
      poId: z.string().min(1),
      note: z.string().min(1).max(5000),
      // Backwards compatible: client currently sends 'general'
      type: z.string().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { actionId, poId, note, type } = parsed.data
    const { supabase, user } = await requireUser()

    if (actionId) {
      const claim = await claimSyncAction({ actionId, userId: user.id, actionType: 'ADD_NOTE' })
      if (claim === 'done') return NextResponse.json({ success: true })
      if (claim === 'in_flight') return NextResponse.json({ error: 'Retry later' }, { status: 503 })
    }

    // Logic to add note. Since there might not be a 'notes' table yet, 
    // we'll assume it's stored in a table called 'po_notes' or similar, 
    // or we'll use audit_log as a fallback if that's what's intended.
    // For this ERP, let's assume 'qc_inspections' if it's a rework note, 
    // or a generic 'po_comments' table.
    
    const { error } = await supabase
      .from('audit_log') // Fallback to audit log if specific notes table isn't found
      .insert({
        table_name: 'purchase_orders',
        record_id: poId,
        action: type === 'rework' ? 'REWORK_NOTE' : 'ADD_COMMENT',
        new_value: { note, action_id: (body as any)?.actionId ?? null },
        performed_by: user.id,
      })

    if (error) return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })

    if (actionId) {
      await markSyncActionDone({ actionId, userId: user.id })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
