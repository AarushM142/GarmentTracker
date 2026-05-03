import { createClient } from '@/lib/supabase/server'
import { Calendar } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('purchase_orders')
    .select('id, po_number, customer_name, status, delivery_date, created_at')
    .neq('status', 'closed')
    .neq('status', 'dispatched')
    .order('delivery_date', { ascending: true })

  const getTimelinePosition = (dateStr: string | null) => {
    if (!dateStr) return { left: '80%', width: '20%' }
    const delivery = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 3600 * 24))
    const maxDays = 30
    let left = 0
    let width = Math.max(5, (diffDays / maxDays) * 100)
    if (diffDays < 0) { left = 0; width = 5 }
    if (width > 100) width = 100
    return { left: `${left}%`, width: `${width}%` }
  }

  return (
    <div className="space-y-7 animate-fade-in relative z-10">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 font-medium">
          <Link href="/planner" className="hover:text-foreground transition-colors">Planner</Link>
          <span>/</span>
          <span className="text-foreground font-bold">Production Schedule</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Production Timeline
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Gantt-style overview of active orders and delivery deadlines.</p>
          </div>
          <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 flex items-center gap-2 shadow-sm">
            <Calendar className="w-4 h-4" /> 30-Day Outlook
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden border border-border shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="w-1/4 font-bold text-xs text-muted-foreground uppercase tracking-widest">Order / Client</div>
          <div className="w-3/4 flex justify-between px-4 font-bold text-xs text-muted-foreground uppercase tracking-widest">
            <span>Today</span>
            <span>+15 Days</span>
            <span>+30 Days</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {orders?.map(order => {
            const { width } = getTimelinePosition(order.delivery_date)
            const isOverdue = order.delivery_date && new Date(order.delivery_date) < new Date()
            
            return (
              <div key={order.id} className="flex items-center group">
                <div className="w-1/4 pr-4">
                  <p className="font-bold text-foreground truncate">{order.po_number}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold truncate">{order.customer_name}</p>
                </div>
                <div className="w-3/4 relative h-10 bg-muted/30 rounded-2xl border border-border overflow-hidden flex items-center px-1">
                  <div 
                    className={`h-8 rounded-xl flex items-center px-3 shadow-sm transition-all duration-500 ${isOverdue ? 'bg-destructive/10 border border-destructive/20' : 'bg-primary shadow-primary/20'}`}
                    style={{ width }}
                  >
                    <span className={`text-[10px] font-bold truncate ${isOverdue ? 'text-destructive' : 'text-primary-foreground'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {order.delivery_date && (
                    <div className="absolute right-3 text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors bg-white/80 px-2 py-0.5 rounded-full shadow-sm border border-border">
                      Due: {new Date(order.delivery_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          
          {orders?.length === 0 && (
             <div className="text-center py-8 text-muted-foreground text-sm font-medium">No active orders scheduled.</div>
          )}
        </div>
      </div>
    </div>
  )
}
