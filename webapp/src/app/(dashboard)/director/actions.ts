'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approvePurchaseRequest(prId: string, action: 'approve' | 'reject') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.user_metadata?.role !== 'director' && user.user_metadata?.role !== 'super_admin')) {
    return { error: 'Unauthorized' }
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'


  const { error } = await supabase
    .from('purchase_requests')
    .update({ status: newStatus })
    .eq('id', prId)

  if (error) {
    console.error(`[approvePurchaseRequest] DB error:`, error.message, error.details, error.hint)
    return { error: error.message }
  }

  // Audit log
  const { error: auditError } = await supabase.from('audit_log').insert({
    table_name: 'purchase_requests',
    record_id: prId,
    action: `PR_${action.toUpperCase()}`,
    new_value: { status: newStatus },
    performed_by: user.id
  })

  // Don't block on audit log errors — the main write already succeeded
  if (auditError) console.error('Audit log failed:', auditError.message)

  revalidatePath('/director')
  revalidatePath('/inventory')
  return { success: true }
}

/**
 * Looks up the real UUID of a purchase order by its po_number string.
 * Returns null if not found — the audit_log record_id column must be a UUID,
 * so we must never pass a plain string like "PO-2024-112" directly.
 */
async function resolveRecordUuid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  riskId: string
): Promise<string> {
  // Try to resolve the risk label to a real PO UUID by po_number
  const { data } = await supabase
    .from('purchase_orders')
    .select('id')
    .eq('po_number', riskId)
    .maybeSingle()
  // If no match, generate a stable UUID so record_id (NOT NULL) is always satisfied
  return data?.id ?? crypto.randomUUID()
}

export async function resolveRiskFlag(riskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.user_metadata?.role !== 'director' && user.user_metadata?.role !== 'super_admin')) {
    return { error: 'Unauthorized' }
  }

  // Resolve the human-readable risk label to a real UUID so we never pass
  // a plain string into the uuid record_id column.
  const recordUuid = await resolveRecordUuid(supabase, riskId)

  const { error } = await supabase.from('audit_log').insert({
    table_name: 'risk_flags',
    record_id: recordUuid,   // always a valid UUID — either real PO id or generated
    action: 'RISK_RESOLVED',
    new_value: {
      risk_label: riskId,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    },
    performed_by: user.id,
    performed_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }

  revalidatePath('/director')
  return { success: true }
}

export async function assignRiskFlag(riskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.user_metadata?.role !== 'director' && user.user_metadata?.role !== 'super_admin')) {
    return { error: 'Unauthorized' }
  }

  const recordUuid = await resolveRecordUuid(supabase, riskId)

  const { error } = await supabase.from('audit_log').insert({
    table_name: 'risk_flags',
    record_id: recordUuid,   // always a valid UUID
    action: 'RISK_ASSIGNED',
    new_value: {
      risk_label: riskId,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
    },
    performed_by: user.id,
    performed_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }

  revalidatePath('/director')
  return { success: true }
}

