import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from './AdminDashboard'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { captureError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'super_admin') {
    redirect('/planner')
  }

  const { data: users, error: usersError } = await supabase.rpc('get_auth_users')
  if (usersError) captureError(usersError, { action: 'AdminPage/fetchUsers', user_role: 'super_admin' })

  const { data: auditLogs, error: auditError } = await supabase
    .from('audit_log')
    .select('*')
    .order('performed_at', { ascending: false })
    .limit(50)
  if (auditError) captureError(auditError, { action: 'AdminPage/fetchAuditLog', user_role: 'super_admin' })

  return (
    <div className="space-y-7 relative z-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-destructive/10 text-destructive shadow-sm">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Super Admin Center
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            System configuration, user access, and global audit trails.
          </p>
        </div>
      </div>

      <AdminDashboard 
        users={users || []} 
        auditLogs={auditLogs || []} 
      />
    </div>
  )
}
