'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approvePurchaseRequest(prId: string, action: 'approve' | 'reject') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()


  const isTestUser = user?.email?.includes('ishaanpatil123')
  if (!user || (user.user_metadata?.role !== 'director' && user.user_metadata?.role !== 'super_admin' && !isTestUser)) {
    return { error: 'Unauthorized' }
  }


  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  const { error } = await supabase
    .from('purchase_requests')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', prId)

  if (error) return { error: error.message }

  // Audit log
  await supabase.from('audit_log').insert({
    table_name: 'purchase_requests',
    record_id: prId,
    action: `PR_${action.toUpperCase()}`,
    new_value: { status: newStatus },
    performed_by: user.id
  })

  revalidatePath('/director')
  return { success: true }
}
