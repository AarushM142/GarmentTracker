'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'

export async function addStock(materialId: string, addedQty: number) {
  const { supabase, user } = await requireRole(['store_manager', 'super_admin'])

  // Get current qty
  const { data: material, error: fetchError } = await supabase
    .from('inventory')
    .select('quantity_on_hand')
    .eq('id', materialId)
    .single()

  if (fetchError || !material) return { error: 'Material not found' }

  const newQty = (material.quantity_on_hand || 0) + addedQty

  // Update
  const { error: updateError } = await supabase
    .from('inventory')
    .update({ quantity_on_hand: newQty, updated_at: new Date().toISOString() })
    .eq('id', materialId)

  if (updateError) return { error: updateError.message }

  // Audit log
  await supabase.from('audit_log').insert({
    table_name: 'inventory',
    record_id: materialId,
    action: 'ADD_STOCK',
    new_value: { added_qty: addedQty, total_qty: newQty },
    performed_by: user.id
  })

  revalidatePath('/inventory')
  return { success: true }
}

export async function generatePurchaseRequest(materialId: string, requestedQty: number) {
  const { supabase, user } = await requireRole(['super_admin', 'production_head', 'production_supervisor', 'store_manager'])

  const prNumber = `PR-${Date.now().toString().slice(-6)}`

  const { error } = await supabase
    .from('purchase_requests')
    .insert({
      pr_number: prNumber,
      material_id: materialId,
      requested_qty: requestedQty,
      status: 'pending',
      requested_by: user.id
    })

  if (error) return { error: error.message }

  revalidatePath('/inventory')
  return { success: true, prNumber }
}

export async function addInventoryItem(formData: FormData) {
  const { supabase, user } = await requireRole(['super_admin', 'store_manager', 'director'])

  const materialName = (formData.get('material_name') as string)?.trim()
  const unit = (formData.get('unit') as string)?.trim()
  const quantity = parseFloat(formData.get('quantity') as string) || 0
  const lowStockThreshold = parseFloat(formData.get('low_stock_threshold') as string) || null

  if (!materialName || !unit) {
    return { error: 'Material name and unit are required' }
  }

  const { data: newItem, error } = await supabase
    .from('inventory')
    .insert({
      material_name: materialName,
      unit,
      quantity_on_hand: quantity,
      low_stock_threshold: lowStockThreshold,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error || !newItem) return { error: error?.message || 'Failed to create item' }

  await supabase.from('audit_log').insert({
    table_name: 'inventory',
    record_id: newItem.id,
    action: 'ADD_MATERIAL',
    new_value: { material_name: materialName, unit, quantity_on_hand: quantity },
    performed_by: user.id,
  })

  revalidatePath('/inventory')
  return { success: true }
}
