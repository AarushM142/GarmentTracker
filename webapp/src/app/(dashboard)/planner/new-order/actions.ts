'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { captureError } from '@/lib/logger'
import { requireRole } from '@/lib/auth/guards'

type SKUItem = { 
  garment_type: string; 
  style_code: string; 
  s: number; 
  m: number; 
  l: number; 
  xl: number; 
  xxl: number 
}

export async function createPurchaseOrder(prevState: any, formData: FormData) {
  try {
    const { supabase, user } = await requireRole(['super_admin', 'director', 'production_head', 'production_coordinator'])

    const rawSkuList = formData.get('sku_list')
    
    // Parse SKU list
    let skuList: SKUItem[] = []
    try {
      skuList = JSON.parse(rawSkuList as string || '[]')
    } catch (e) { 
      return { error: 'Invalid SKU data format', success: false } 
    }

    if (skuList.length === 0 || !skuList[0].style_code) {
      return { error: 'At least one SKU with a style code is required', success: false }
    }

    // Build sku_list for DB
    const dbSkuList = skuList.map(s => ({
      garment_type: s.garment_type,
      style_code: s.style_code,
      quantity: (Number(s.s) || 0) + (Number(s.m) || 0) + (Number(s.l) || 0) + (Number(s.xl) || 0) + (Number(s.xxl) || 0),
      sizes: { s: s.s, m: s.m, l: s.l, xl: s.xl, xxl: s.xxl },
    }))

    // Handle optional file upload
    let poFileUrl: string | null = null
    const poFile = formData.get('po_file') as File | null
    if (poFile && poFile.size > 0) {
      try {
        const safeName = poFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileName = `${Date.now()}-${safeName}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('po-files')
          .upload(`${user.id}/${fileName}`, poFile)
        
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('po-files').getPublicUrl(uploadData.path)
          poFileUrl = urlData?.publicUrl || null
        }
      } catch (e) {
        captureError(e, { action: 'createPurchaseOrder/fileUpload', user_id: user.id })
      }
    }

    // Insert PO
    const poNumber = formData.get('po_number') as string
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber || `PO-${Date.now().toString().slice(-6)}`,
        customer_name: formData.get('customer_name') as string,
        office_address: formData.get('office_address') as string || null,
        delivery_address: formData.get('delivery_address') as string || null,
        po_date: formData.get('po_date') as string || null,
        delivery_date: formData.get('delivery_date') as string || null,
        payment_term: formData.get('payment_term') as string || null,
        po_amount_inr: parseFloat(formData.get('po_amount_inr') as string) || 0,
        advance_amount_inr: parseFloat(formData.get('advance_amount_inr') as string) || 0,
        supplier_contact: formData.get('supplier_contact') as string || null,
        po_file_url: poFileUrl,
        sku_list: dbSkuList,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (poError || !po) {
      captureError(poError, { action: 'createPurchaseOrder/insert', user_id: user.id })
      return { error: poError?.message || 'Failed to create PO', success: false }
    }

    // Invoke Edge Function for BOM calculation
    try {
      await supabase.functions.invoke('calculate-bom', {
        body: { po_id: po.id }
      })
    } catch (e) {
      captureError(e, { action: 'createPurchaseOrder/bom', user_id: user.id })
    }

    // Log audit
    await supabase.from('audit_log').insert({
      table_name: 'purchase_orders',
      record_id: po.id,
      action: 'CREATE',
      new_value: { po_number: po.po_number, status: 'draft' },
      performed_by: user.id,
      performed_at: new Date().toISOString()
    })

    revalidatePath('/planner')
    revalidatePath('/inventory')
  } catch (error: any) {
    captureError(error, { action: 'createPurchaseOrder' })
    return { error: error.message || 'An unexpected error occurred', success: false }
  }

  // Redirect MUST be outside try/catch in some Next versions to avoid catching the redirect "error"
  redirect('/planner')
}

export async function releasePO(poId: string) {
  const { supabase, user } = await requireRole(['super_admin', 'director', 'production_head', 'production_coordinator'])

  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'in_production', updated_at: new Date().toISOString() })
    .eq('id', poId)
    .eq('status', 'draft') // Safety: only release if still in draft

  if (error) return { error: error.message }

  await supabase.from('audit_log').insert({
    table_name: 'purchase_orders',
    record_id: poId,
    action: 'RELEASE_TO_PRODUCTION',
    new_value: { status: 'in_production' },
    performed_by: user.id,
    performed_at: new Date().toISOString(),
  })

  revalidatePath('/planner')
  revalidatePath('/floor')
  revalidatePath(`/planner/${poId}`)
  return { success: true }
}

export async function retryBOM(poId: string) {
  try {
    const { supabase, user } = await requireRole(['super_admin', 'director', 'production_head', 'production_coordinator'])
    
    const { data, error } = await supabase.functions.invoke('calculate-bom', {
      body: { po_id: poId }
    })

    if (error) throw error
    
    revalidatePath(`/planner/${poId}`)
    return { success: true }
  } catch (e: any) {
    captureError(e, { action: 'retryBOM', poId })
    return { error: e.message || 'BOM calculation failed' }
  }
}
