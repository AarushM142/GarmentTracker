"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShoppingBag, Filter, IndianRupee, Clock, Box } from "lucide-react"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdvancedFilterBar, FilterState, matchDueDate, matchVolume } from "@/components/ui/AdvancedFilterBar"

type Order = {
  id: string
  po_number: string
  customer_name: string
  sku_list: Array<{ style_code: string; quantity: number; garment_type: string }> | null
  status: string
  delivery_date: string
  created_at: string
}

// ─── Urgency helpers ──────────────────────────────────────────────────────────
function getUrgency(deliveryDate: string | null) {
  if (!deliveryDate) return { text: '—', stripe: 'none', color: 'text-muted' }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(deliveryDate); due.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86_400_000)

  if (diffDays < 0) return { text: `Overdue ${Math.abs(diffDays)}d`, stripe: 'urgency-red', color: 'text-destructive font-bold' }
  if (diffDays === 0) return { text: 'Due today', stripe: 'urgency-red', color: 'text-destructive font-bold' }
  if (diffDays <= 3) return { text: `${diffDays} days left`, stripe: 'urgency-amber', color: 'text-warning font-bold' }
  return { text: `${diffDays} days`, stripe: 'urgency-green', color: 'text-success font-medium' }
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-surface-muted text-muted" },
  in_production: { label: "Planning", className: "bg-info-tint text-info" },
  pending_stock: { label: "Stock Gap", className: "bg-warning-tint text-warning" },
  material_released: { label: "Issued", className: "bg-info-tint text-info" },
  cutting: { label: "Cutting", className: "bg-primary-tint text-primary" },
  fusing: { label: "Fusing", className: "bg-primary-tint text-primary" },
  stitching: { label: "Stitching", className: "bg-primary-tint text-primary" },
  kaj_buttoning: { label: "Kaj/Btn", className: "bg-primary-tint text-primary" },
  finishing_ironing: { label: "Finishing", className: "bg-primary-tint text-primary" },
  qc: { label: "In QC", className: "bg-warning-tint text-warning" },
  rework: { label: "Rework", className: "bg-destructive-tint text-destructive" },
  packing: { label: "Packing", className: "bg-success-tint text-success" },
  dispatched: { label: "Transit", className: "bg-success-tint text-success" },
  closed: { label: "Closed", className: "bg-surface-muted text-muted" },
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [filters, setFilters] = useState<FilterState>({
    stages: [],
    dueDate: 'all',
    volumes: [],
    customerSearch: '',
    sortOrder: 'asc'
  })
  const router = useRouter()

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  const availableCustomers = useMemo(() => Array.from(new Set(orders.map(o => o.customer_name))), [orders])
  const availableStages = useMemo(() => Object.keys(statusConfig).map(s => ({ id: s, label: statusConfig[s].label })), [])

  const filtered = useMemo(() => {
    const result = orders.filter(o => {
      if (filters.stages.length > 0 && !filters.stages.includes(o.status)) return false
      if (!matchDueDate(o.delivery_date, filters.dueDate)) return false
      const totalQty = o.sku_list?.reduce((sum, s) => sum + (s.quantity || 0), 0) ?? 0
      if (!matchVolume(totalQty, filters.volumes)) return false
      if (filters.customerSearch && !o.customer_name.toLowerCase().includes(filters.customerSearch.toLowerCase())) return false
      return true
    })

    result.sort((a, b) => {
      if (!a.delivery_date && !b.delivery_date) return 0
      if (!a.delivery_date) return 1
      if (!b.delivery_date) return -1
      const dateA = new Date(a.delivery_date).getTime()
      const dateB = new Date(b.delivery_date).getTime()
      return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })
    return result
  }, [orders, filters])

  if (orders.length === 0) {
    return (
      <div className="card-premium p-24 text-center">
        <div className="w-20 h-20 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center bg-surface-muted shadow-inner">
          <ShoppingBag className="w-10 h-10 text-muted" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Pipeline Empty</h3>
        <p className="mt-2 text-muted max-w-xs mx-auto">Initialize your manufacturing flow by creating a new purchase order.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card-premium p-1 border border-border/40 bg-surface-muted/10">
        <AdvancedFilterBar
          availableCustomers={availableCustomers}
          availableStages={availableStages}
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({ stages: [], dueDate: 'all', volumes: [], customerSearch: '', sortOrder: 'asc' })}
        />
      </div>

      <div className="card-premium overflow-hidden border border-border/40">
        {/* Mobile View: Card Layout */}
        <div className="md:hidden divide-y divide-border/50">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted font-medium">
              No orders match current decision criteria.
            </div>
          ) : filtered.map((order, i) => {
            const cfg = statusConfig[order.status] ?? { label: order.status, className: "bg-surface-muted text-muted" }
            const { text, stripe, color } = getUrgency(order.delivery_date)
            const totalQty = order.sku_list?.reduce((sum, s) => sum + (s.quantity || 0), 0) ?? 0

            return (
              <div 
                key={order.id} 
                className={`p-4 animate-fade-up ${stripe}`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Link href={`/planner/${order.id}`} className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 font-mono text-sm font-black text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">
                      {order.po_number}
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary group-hover:text-primary">
                        Open <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </Link>
                    <span className="text-[10px] text-foreground/60 uppercase tracking-widest mt-0.5 block">Created {new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.1em] border border-transparent ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-bold text-muted">
                    {order.customer_name.charAt(0)}
                  </div>
                  <span className="font-bold text-foreground">{order.customer_name}</span>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground tabular-nums">{totalQty.toLocaleString()} Pcs</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Box className="w-3 h-3 text-foreground/60" />
                      <span className="text-[10px] text-foreground/60 font-bold">{order.sku_list?.length || 0} SKUs</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm ${color} flex items-center gap-1.5`}>
                      <Clock className="w-3.5 h-3.5" /> {text}
                    </span>
                    <span className="text-[10px] text-foreground/60 mt-0.5 font-medium">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No Deadline'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop View: Table Layout */}
        <div className="hidden md:block">
          <Table className="table-dense">
            <TableHeader>
              <TableRow className="bg-surface-muted/30">
                <TableHead className="pl-8">PO Reference</TableHead>
                <TableHead>Customer / Partner</TableHead>
                <TableHead>Volume Breakdown</TableHead>
                <TableHead>Stage Control</TableHead>
                <TableHead className="pr-8 text-right">Countdown</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24 text-sm text-muted font-medium">
                    No orders match current decision criteria.
                  </TableCell>
                </TableRow>
              ) : filtered.map((order, i) => {
                const cfg = statusConfig[order.status] ?? { label: order.status, className: "bg-surface-muted text-muted" }
                const { text, stripe, color } = getUrgency(order.delivery_date)
                const totalQty = order.sku_list?.reduce((sum, s) => sum + (s.quantity || 0), 0) ?? 0

                return (
                  <TableRow
                    key={order.id}
                    className={`group animate-fade-up border-b border-border/50 ${stripe}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <TableCell className="pl-8 py-5">
                      <div className="flex flex-col">
                        <Link href={`/planner/${order.id}`} className="inline-flex w-fit items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 font-mono text-sm font-black text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15">
                          {order.po_number}
                          <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
                            Open <ArrowUpRight className="w-3 h-3" />
                          </span>
                        </Link>
                        <span className="text-[10px] text-foreground/60 uppercase tracking-widest mt-0.5">Created {new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center text-xs font-bold text-muted">
                          {order.customer_name.charAt(0)}
                        </div>
                        <span className="font-bold text-foreground">{order.customer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground tabular-nums">{totalQty.toLocaleString()} Pcs</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Box className="w-3 h-3 text-foreground/60" />
                            <span className="text-[10px] text-foreground/60 font-bold">{order.sku_list?.length || 0} SKUs</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border border-transparent ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm ${color} flex items-center gap-1.5`}>
                          <Clock className="w-3.5 h-3.5" /> {text}
                        </span>
                        <span className="text-[10px] text-foreground/60 mt-0.5 font-medium">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No Deadline'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
}
