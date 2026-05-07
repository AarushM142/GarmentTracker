'use client'

import { useState } from 'react'
import { updateUserRole, updatePermission } from './actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Users, Activity, Lock, CheckCircle2, ChevronRight, UserCog } from 'lucide-react'

type UserData = {
  id: string
  email: string
  role: string | null
  created_at: string
}

type AuditLog = {
  id: string
  table_name: string
  action: string
  old_value: any
  new_value: any
  performed_by: string
  performed_at: string
}

const ROLES = [
  'super_admin', 'director', 'production_head', 'production_coordinator', 
  'production_supervisor', 'store_manager', 'cutting_master', 'accounts_manager'
]

export function AdminDashboard({ users, auditLogs }: { users: UserData[], auditLogs: AuditLog[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleRoleChange(userId: string, newRole: string) {
    setLoadingId(userId)
    await updateUserRole(userId, newRole)
    setLoadingId(null)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-full mb-8 border border-border">
          <TabsTrigger value="users" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">
            <Users className="w-4 h-4 mr-2" /> Master User Control
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">
            <Activity className="w-4 h-4 mr-2" /> Global Audit Logs
          </TabsTrigger>
          <TabsTrigger value="permissions" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">
            <Shield className="w-4 h-4 mr-2" /> Permission Matrix
          </TabsTrigger>
        </TabsList>

        {/* ── Users Tab ────────────────────────────────────── */}
        <TabsContent value="users">
          <div className="card-premium overflow-hidden border border-border shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-primary" /> User Directory
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Manage hierarchy and system access for {users.length} accounts.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-xs border-b border-border">Email / ID</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-xs border-b border-border">Assigned Role</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-xs text-right border-b border-border">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">{user.email}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{user.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className="po-input text-xs font-bold w-48"
                          value={user.role || 'unassigned'}
                          disabled={loadingId === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          <option value="unassigned" disabled>Select role...</option>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {loadingId === user.id ? (
                          <span className="text-xs font-bold text-muted-foreground animate-pulse">Updating...</span>
                        ) : (
                          <span className="text-xs font-bold text-primary flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Audit Logs Tab ───────────────────────────────── */}
        <TabsContent value="audit">
          <div className="card-premium overflow-hidden border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> System Activity Stream
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Immutable record of all state changes across the factory.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-xs border-b border-border">Timestamp</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-xs border-b border-border">Action</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-xs border-b border-border">Resource</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-xs border-b border-border">User ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-muted-foreground">
                        {new Date(log.performed_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-[10px] font-bold uppercase border border-border">
                          {log.action}
                        </span>
                        <div className="text-xs text-muted-foreground mt-1 font-mono break-all max-w-xs">
                          {JSON.stringify(log.new_value)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-foreground uppercase tracking-wider">{log.table_name}</td>
                      <td className="px-6 py-4 text-[10px] text-muted-foreground font-mono">{log.performed_by}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground font-medium">No audit logs found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Permission Matrix Tab ────────────────────────── */}
        <TabsContent value="permissions">
          <div className="card-premium p-12 flex flex-col items-center justify-center text-center gap-6 border border-dashed border-border shadow-sm">
             <div className="w-16 h-16 rounded-[2rem] bg-muted flex items-center justify-center text-muted-foreground shadow-sm">
               <Lock className="w-8 h-8" />
             </div>
             <div>
               <h3 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Advanced Permission Matrix</h3>
               <p className="text-muted-foreground text-sm max-w-md mt-2 font-medium">
                 Granular toggle control over specific features (e.g. &quot;Approve for Delivery&quot;) will be available here in a future update. Standard RBAC is currently active.
               </p>
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
