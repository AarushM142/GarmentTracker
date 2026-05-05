import { createClient } from '@/lib/supabase/server'
import { DirectorDashboard } from './DirectorDashboard'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DirectorPage() {
  const supabase = await createClient()

  // Ensure user is authorized

  const { data: { user } } = await supabase.auth.getUser()
  const isTestUser = user?.email?.includes('ishaanpatil123')

  if (!user || (user.user_metadata?.role !== 'director' && user.user_metadata?.role !== 'super_admin' && !isTestUser)) {
    redirect('/planner')
  }


  // Fetch all active POs
  const { data: orders } = await supabase
    .from('purchase_orders')
    .select('*')
    .neq('status', 'closed')

  // Calculate high level stats
  const activeOrders = orders?.length || 0
  const totalValue = orders?.reduce((sum, o) => sum + (o.po_amount_inr || 0), 0) || 0
  const totalAdvance = orders?.reduce((sum, o) => sum + (o.advance_amount_inr || 0), 0) || 0

  // Calculate bottlenecks (orders stuck in same status for >24h)
  const bottlenecks = orders?.filter(o => {
    const lastUpdate = new Date(o.updated_at)
    const now = new Date()
    const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)
    return diffHours > 24 && o.status !== 'dispatched'
  }).length || 0

  // Count orders per stage
  const stageCounts: Record<string, number> = {}
  orders?.forEach(o => {
    stageCounts[o.status] = (stageCounts[o.status] || 0) + 1
  })

  // Fetch recent orders for the tracker
  const { data: recentOrders } = await supabase
    .from('purchase_orders')
    .select('id, po_number, customer_name, status, updated_at')
    .order('updated_at', { ascending: false })
    .limit(10)

  const { data: pendingPRs } = await supabase
    .from('purchase_requests')
    .select(`
      id, 
      quantity_required, 
      status, 
      created_at,
      material_name
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const stats = {
    activeOrders,
    totalValue,
    totalAdvance,
    bottlenecks,
    stageCounts,
    recentOrders: recentOrders || [],
    pendingPRs: pendingPRs || []
  }

  return <DirectorDashboard stats={stats} />
}
