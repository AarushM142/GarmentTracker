'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'super_admin') {
    return { error: 'Unauthorized' }
  }

  // We use the custom RPC function created earlier to bypass the need for service_role key
  const { error } = await supabase.rpc('update_user_role', {
    target_user_id: userId,
    new_role: newRole
  })

  if (error) return { error: error.message }

  // Log to audit
  await supabase.from('audit_log').insert({
    table_name: 'users',
    record_id: userId,
    action: 'ROLE_UPDATE',
    new_value: { role: newRole },
    performed_by: user.id
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function updatePermission(role: string, permission: string, isEnabled: boolean) {
  // In a real app, this would update a permissions table or jsonb column on a role table
  // For the MVP, we simulate success
  revalidatePath('/admin')
  return { success: true }
}
