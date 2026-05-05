import { createClient } from '@/lib/supabase/server'

export type ClaimResult = 'claimed' | 'done' | 'in_flight'

export async function claimSyncAction(params: {
  actionId: string
  userId: string
  actionType: string
}): Promise<ClaimResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('sync_claim_action', {
    p_action_id: params.actionId,
    p_user_id: params.userId,
    p_action_type: params.actionType,
  })
  if (error) {
    // Fail closed as in-flight so caller retries later (prevents duplicate apply).
    return 'in_flight'
  }
  return (data ?? 'in_flight') as ClaimResult
}

export async function markSyncActionDone(params: { actionId: string; userId: string }) {
  const supabase = await createClient()
  await supabase.rpc('sync_mark_done', {
    p_action_id: params.actionId,
    p_user_id: params.userId,
  })
}

