'use server'

import { createClient } from '@/lib/supabase/server'
import { generateDeliveryChallan } from '@/lib/utils/mock-functions'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'

export async function approveCredit(orderId: string) {
  const { supabase, user } = await requireRole(['accounts_manager', 'super_admin'])

  const { error } = await supabase
    .from('purchase_orders')
    .update({ credit_approved: true, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { error: error.message }
  revalidatePath('/(dashboard)/accounts', 'page')
  return { success: true }
}

export async function logPayment(formData: FormData) {
  const { supabase, user } = await requireRole(['accounts_manager', 'super_admin'])

  const orderId = formData.get('orderId') as string
  const amount = parseFloat(formData.get('amount') as string)
  const note = formData.get('note') as string

  if (!orderId || isNaN(amount) || amount <= 0) {
    return { error: 'Invalid payment amount' }
  }

  // Insert the payment record
  const { error: insertError } = await supabase
    .from('payments')
    .insert({
      po_id: orderId,
      amount,
      payment_date: new Date().toISOString().split('T')[0],
      note: note || null,
      logged_by: user.id,
    })

  if (insertError) return { error: insertError.message }

  // Update advance_amount_inr on purchase_orders to reflect the new total received
  const { data: allPayments, error: sumError } = await supabase
    .from('payments')
    .select('amount')
    .eq('po_id', orderId)

  if (!sumError && allPayments) {
    const totalReceived = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    await supabase
      .from('purchase_orders')
      .update({ advance_amount_inr: totalReceived, updated_at: new Date().toISOString() })
      .eq('id', orderId)
  }

  revalidatePath('/(dashboard)/accounts', 'page')
  return { success: true }
}

export async function closePO(orderId: string) {
  const { supabase } = await requireRole(['accounts_manager', 'super_admin'])

  // Fetch PO and verify it meets criteria
  const { data: order, error: fetchError } = await supabase
    .from('purchase_orders')
    .select('status, po_amount_inr, advance_amount_inr, credit_approved')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) return { error: 'Order not found' }
  if (order.status !== 'dispatched') return { error: 'Order must be dispatched before closing' }

  const balance = (Number(order.po_amount_inr) || 0) - (Number(order.advance_amount_inr) || 0)
  if (balance > 0 && !order.credit_approved) {
    return { error: 'Payment balance must be zero or credit must be approved before closing' }
  }

  // Verify POD exists
  const { data: pod, error: podError } = await supabase
    .from('delivery_proofs')
    .select('id')
    .eq('po_id', orderId)
    .limit(1)

  if (podError || !pod || pod.length === 0) {
    return { error: 'Proof of Delivery (POD) must be uploaded before closing the order' }
  }

  // Update status
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath('/(dashboard)/accounts', 'page')
  return { success: true }
}

export async function updateLogistics(formData: FormData) {
  const { supabase, user } = await requireRole(['accounts_manager', 'super_admin'])

  const orderId = formData.get('orderId') as string
  const courierName = formData.get('courierName') as string
  const trackingNumber = formData.get('trackingNumber') as string
  const packedQuantity = parseInt(formData.get('packedQuantity') as string) || null

  if (!orderId || !courierName || !trackingNumber) {
    return { error: 'All fields are required' }
  }

  // Guard: Ensure order has passed QC before allowing dispatch
  const { data: order, error: fetchError } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) return { error: 'Order not found' }

  const allowedStatuses = ['packing', 'qc']
  if (!allowedStatuses.includes(order.status)) {
    return { error: `Cannot dispatch order in status: "${order.status}". Order must be in QC or Packing.` }
  }

  const { error } = await supabase
    .from('purchase_orders')
    .update({
      courier_name: courierName,
      tracking_number: trackingNumber,
      packed_quantity: packedQuantity,
      status: 'dispatched',
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    table_name: 'purchase_orders',
    record_id: orderId,
    action: 'DISPATCH',
    new_value: { courier_name: courierName, tracking_number: trackingNumber, packed_quantity: packedQuantity },
    performed_by: user.id,
  })

  revalidatePath('/(dashboard)/accounts', 'page')
  return { success: true }
}

export async function uploadPOD(formData: FormData) {
  const { supabase, user } = await requireRole(['accounts_manager', 'super_admin'])

  const orderId = formData.get('orderId') as string
  const file = formData.get('pod_file') as File

  if (!file || file.size === 0) return { error: 'No file provided' }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileName = `${orderId}-${Date.now()}-${safeName}`
  const { data, error: uploadError } = await supabase.storage
    .from('delivery-proofs')
    .upload(`${user.id}/${fileName}`, file)

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage.from('delivery-proofs').getPublicUrl(data.path)

  const { error: dbError } = await supabase
    .from('delivery_proofs')
    .insert({
      po_id: orderId,
      storage_path: data.path,
      public_url: urlData?.publicUrl ?? null,
      uploaded_by: user.id
    })

  if (dbError) return { error: dbError.message }

  revalidatePath('/(dashboard)/accounts', 'page')
  return { success: true }
}

export async function generateChallan(orderId: string) {
  const { supabase } = await requireRole(['accounts_manager', 'super_admin'])

  const { data, error } = await supabase.functions.invoke('generate-challan', {
    body: { po_id: orderId }
  })
  
  if (error) return { error: error.message }
  
  revalidatePath('/(dashboard)/accounts', 'page')
  return data
}
