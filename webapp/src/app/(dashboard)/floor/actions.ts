'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePOStatus(poId: string, newStatus: string, knownVersion?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // "Issue to Floor" is a multi-step operation — use the atomic PostgreSQL function
  // which locks inventory rows, deducts BOM, and updates the PO in one transaction.
  if (newStatus === 'material_released') {
    const { data, error } = await supabase.rpc('issue_to_floor', {
      p_po_id: poId,
      p_user_id: user.id,
    })

    if (error) return { error: error.message }

    const result = data as { success?: boolean; warning?: string; error?: string; low_stock_alerts?: any[] }
    if (result?.error) return { error: result.error }

    revalidatePath('/floor')
    revalidatePath('/planner')
    revalidatePath('/director')
    revalidatePath('/inventory')
    return { success: true, lowStockAlerts: result?.low_stock_alerts ?? [] }
  }

  // All other stage transitions use the optimistic-lock update function.
  // Fetch the current version if not supplied by the caller.
  let version = knownVersion
  if (version === undefined) {
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('version')
      .eq('id', poId)
      .single()
    version = po?.version ?? 1
  }

  const { data, error } = await supabase.rpc('update_po_status_locked', {
    p_po_id: poId,
    p_new_status: newStatus,
    p_version: version,
    p_user_id: user.id,
  })

  if (error) return { error: error.message }

  const result = data as { success?: boolean; error?: string; message?: string }
  if (result?.error === 'conflict') {
    return { error: result.message || 'Conflict: order was modified. Please refresh.' }
  }

  revalidatePath('/floor')
  revalidatePath('/planner')
  revalidatePath('/director')
  return { success: true }
}

export async function logQC(poId: string, result: 'pass' | 'fail', reworkNote?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const nextStatus = result === 'pass' ? 'packing' : 'rework'

  // Fetch current version for optimistic locking
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('version')
    .eq('id', poId)
    .single()

  const { data: updateResult, error: updateError } = await supabase.rpc('update_po_status_locked', {
    p_po_id: poId,
    p_new_status: nextStatus,
    p_version: po?.version ?? 1,
    p_user_id: user.id,
  })

  if (updateError) return { error: updateError.message }

  const updateData = updateResult as { success?: boolean; error?: string; message?: string }
  if (updateData?.error === 'conflict') {
    return { error: updateData.message || 'Conflict: order was modified. Please refresh.' }
  }

  // Insert QC inspection record
  const { error: qcError } = await supabase
    .from('qc_inspections')
    .insert({
      po_id: poId,
      result,
      rework_note: reworkNote || null,
      inspected_by: user.id
    })

  if (qcError) return { error: qcError.message }

  revalidatePath('/floor')
  return { success: true }
}

export async function getOrderBOM(poId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bom_items')
    .select('*')
    .eq('po_id', poId)

  if (error) return { error: error.message }
  return { data }
}
