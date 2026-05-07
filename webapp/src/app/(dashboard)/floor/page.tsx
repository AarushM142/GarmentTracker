import { createClient } from '@/lib/supabase/server'
import { FloorDashboard } from './FloorDashboard'
import { redirect } from 'next/navigation'
import { captureError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export default async function FloorTracker() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userRole = user.user_metadata?.role || 'floor'

  // Fetch orders that are in production or released
  const { data: orders, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .neq('status', 'closed')
    .neq('status', 'dispatched')
    .order('updated_at', { ascending: false })

  if (error) {
    captureError(error, { action: 'FloorPage/fetchOrders' })
  }

  return (
    <FloorDashboard 
      orders={orders || []} 
      userRole={userRole} 
    />
  )
}
