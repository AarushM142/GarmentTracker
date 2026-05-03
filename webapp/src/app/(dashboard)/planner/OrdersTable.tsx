"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShoppingBag, Filter } from "lucide-react"
import Link from "next/link"
import { useState, useMemo } from "react"
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
function getUrgency(deliveryDate: string | null): 'overdue' | 'urgent' | 'ok' | 'none' {
  if (!deliveryDate) return 'none'
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(deliveryDate)
  due.setHours(0, 0, 0, 0)
  
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 3) return 'urgent'
  return 'ok'
}

function getRelativeDelivery(deliveryDate: string | null): { text: string; className: string } {
  if (!deliveryDate) return { text: '—', className: 'text-muted-foreground' }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(deliveryDate)
  due.setHours(0, 0, 0, 0)
  
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)}d`, className: 'text-red-600 font-bold' }
  if (diffDays === 0) return { text: 'Due today', className: 'text-red-500 font-bold' }
  if (diffDays === 1) return { text: '1 day left', className: 'text-amber-600 font-bold' }
  if (diffDays <= 3) return { text: `${diffDays} days left`, className: 'text-amber-600 font-semibold' }
  return { text: `${diffDays} days`, className: 'text-muted-foreground font-medium' }
}

const urgencyStripe: Record<string, string> = {
  overdue: 'border-l-4 border-l-red-500',
  urgent:  'border-l-4 border-l-amber-400',
  ok:      'border-l-4 border-l-transparent',
  none:    'border-l-4 border-l-transparent',
}

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  draft:             { label: "Draft",          className: "bg-slate-100 text-slate-600 border border-slate-200" },
  in_production:     { label: "Planning",       className: "bg-indigo-50 text-indigo-700 border border-indigo-100" },
  pending_stock:     { label: "Awaiting Stock", className: "bg-amber-50 text-amber-700 border border-amber-100" },
  material_released: { label: "Material Ready", className: "bg-blue-50 text-blue-700 border border-blue-100" },
  cutting:           { label: "Cutting",        className: "bg-blue-50 text-blue-700 border border-blue-100" },
  fusing:            { label: "Fusing",         className: "bg-blue-50 text-blue-700 border border-blue-100" },
  stitching:         { label: "Stitching",      className: "bg-purple-50 text-purple-700 border border-purple-100" },
  kaj_buttoning:     { label: "Kaj & Button",   className: "bg-purple-50 text-purple-700 border border-purple-100" },
  finishing_ironing: { label: "Finishing",      className: "bg-purple-50 text-purple-700 border border-purple-100" },
  qc:                { label: "QC",             className: "bg-yellow-50 text-yellow-700 border border-yellow-100" },
  rework:            { label: "Reworking",      className: "bg-red-50 text-red-700 border border-red-100" },
  packing:           { label: "Packing",        className: "bg-orange-50 text-orange-700 border border-orange-100" },
  dispatched:        { label: "In Transit",     className: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
  closed:            { label: "Closed",         className: "bg-slate-50 text-slate-500 border border-slate-200" },
}

const ALL_STATUSES = Object.keys(statusConfig)
const URGENCY_OPTIONS = ['all', 'overdue', 'urgent', 'ok'] as const

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [filters, setFilters] = useState<FilterState>({
    stages: [],
    dueDate: 'all',
    volumes: [],
    customerSearch: '',
    sortOrder: 'asc'
  })

  const availableCustomers = useMemo(() => Array.from(new Set(orders.map(o => o.customer_name))), [orders])
  const availableStages = useMemo(() => ALL_STATUSES.map(s => ({ id: s, label: statusConfig[s]?.label ?? s })), [])

  const filtered = useMemo(() => {
    let result = orders.filter(o => {
      // Stage
      if (filters.stages.length > 0 && !filters.stages.includes(o.status)) return false
      
      // Due Date
      if (!matchDueDate(o.delivery_date, filters.dueDate)) return false
      
      // Volume
      const totalQty = o.sku_list?.reduce((sum, s) => sum + (s.quantity || 0), 0) ?? 0
      if (!matchVolume(totalQty, filters.volumes)) return false

      // Customer
      if (filters.customerSearch && !o.customer_name.toLowerCase().includes(filters.customerSearch.toLowerCase())) return false
      
      return true
    })

    // Sort by delivery date
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
      <div className="card-premium p-16 text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-muted">
          <ShoppingBag className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">No orders yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">Create your first purchase order to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <AdvancedFilterBar 
        availableCustomers={availableCustomers}
        availableStages={availableStages}
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ stages: [], dueDate: 'all', volumes: [], customerSearch: '', sortOrder: 'asc' })}
      />

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="card-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border text-left">
              <TableHead className="w-2 p-0" />
              <TableHead className="w-12 font-bold text-[10px] uppercase tracking-widest text-muted-foreground pl-6">#</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">PO Number</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Customer</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">SKUs / Qty</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Delivery</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground font-medium">
                  No orders match the selected filters.
                </TableCell>
              </TableRow>
            ) : filtered.map((order, i) => {
              const cfg = statusConfig[order.status] ?? { label: order.status.replace(/_/g, ' '), className: "bg-slate-100 text-slate-600 border border-slate-200" }
              const urgency = getUrgency(order.delivery_date)
              const delivery = getRelativeDelivery(order.delivery_date)
              const totalQty = order.sku_list?.reduce((sum, s) => sum + (s.quantity || 0), 0) ?? 0

              return (
                <TableRow
                  key={order.id}
                  className={`animate-fade-up transition-colors hover:bg-muted/30 border-b border-border cursor-pointer ${urgencyStripe[urgency]}`}
                  style={{ animationDelay: `${i * 40}ms`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <TableCell className="p-0 w-0" />
                  <TableCell className="text-[11px] font-bold text-muted-foreground pl-6">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-bold text-foreground">
                    <Link href={`/planner/${order.id}`} className="hover:text-primary hover:underline transition-colors">
                      {order.po_number}
                    </Link>
                  </TableCell>
                  <TableCell className="font-bold text-foreground">{order.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.sku_list && order.sku_list.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-foreground font-bold tabular-nums">{totalQty.toLocaleString()} pcs</span>
                        <span className="text-[10px] text-muted-foreground">{order.sku_list.length} SKU{order.sku_list.length > 1 ? 's' : ''}</span>
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.className}`}>
                      {cfg.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${delivery.className}`}>{delivery.text}</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

