'use client'

import { useState, useEffect, useCallback } from 'react'
import { updatePOStatus, logQC, getOrderBOM } from './actions'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle2, AlertCircle, Play, CheckCircle, 
  Scissors, Box, Layers, ClipboardCheck, Timer, ChevronDown, Filter,
  LayoutGrid, List
} from 'lucide-react'
import { useMemo } from 'react'
import { AdvancedFilterBar, FilterState, matchDueDate, matchVolume } from '@/components/ui/AdvancedFilterBar'

type Order = {
  id: string
  po_number: string
  customer_name: string
  status: string
  sku_list: any[] | null
  delivery_date: string | null
}

// ─── Urgency helpers ─────────────────────────────────────────────────────────
function getUrgency(deliveryDate: string | null): 'overdue' | 'urgent' | 'ok' | 'none' {
  if (!deliveryDate) return 'none'
  const today = new Date(); today.setHours(0,0,0,0)
  const due = new Date(deliveryDate); due.setHours(0,0,0,0)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 3) return 'urgent'
  return 'ok'
}

function getRelativeDelivery(deliveryDate: string | null) {
  if (!deliveryDate) return null
  const today = new Date(); today.setHours(0,0,0,0)
  const due = new Date(deliveryDate); due.setHours(0,0,0,0)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return { text: `Overdue ${Math.abs(diffDays)}d`, className: 'bg-red-100 text-red-700 border-red-200' }
  if (diffDays === 0) return { text: 'Due today', className: 'bg-red-100 text-red-700 border-red-200' }
  if (diffDays === 1) return { text: '1 day left', className: 'bg-amber-100 text-amber-700 border-amber-200' }
  if (diffDays <= 3) return { text: `${diffDays} days left`, className: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { text: `${diffDays} days`, className: 'bg-muted text-muted-foreground border-border' }
}

const urgencyBorder: Record<string, string> = {
  overdue: 'border-l-4 border-l-red-500',
  urgent:  'border-l-4 border-l-amber-400',
  ok:      'border-l-[3px] border-l-transparent',
  none:    'border-l-[3px] border-l-transparent',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  in_production: 'Planning',
  pending_stock: 'Waiting for Stock',
  material_released: 'Material Ready',
  cutting: 'In Cutting',
  fusing: 'In Fusing',
  stitching: 'In Stitching',
  kaj_buttoning: 'Kaj & Button',
  finishing_ironing: 'Finishing',
  qc: 'In QC',
  rework: 'Rework Required',
  packing: 'Ready for Packing'
}

export function FloorDashboard({ orders, userRole }: { orders: Order[], userRole: string }) {
  const [activeTab, setActiveTab] = useState('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'error' | 'warning'; message: string } | null>(null)
  const [liveOrders, setLiveOrders] = useState<Order[]>(orders)
  const [viewMode, setViewMode] = useState<'cards'|'list'>(() => orders.length > 10 ? 'list' : 'cards')
  
  const [filters, setFilters] = useState<FilterState>({
    stages: [],
    dueDate: 'all',
    volumes: [],
    customerSearch: '',
    sortOrder: 'asc'
  })

  const availableCustomers = useMemo(() => Array.from(new Set(orders.map(o => o.customer_name))), [orders])
  const availableStages = useMemo(() => Object.entries(statusLabels).map(([id, label]) => ({ id, label })), [])

  // Realtime subscription — patches local state when any order changes on the server
  useEffect(() => {
    setLiveOrders(orders)
  }, [orders])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('floor-po-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'purchase_orders' },
        (payload) => {
          setLiveOrders(prev =>
            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } as Order : o)
          )
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function showToast(type: 'error' | 'warning', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  async function handleStatusUpdate(id: string, nextStatus: string) {
    setLoadingId(id)
    const res = await updatePOStatus(id, nextStatus)
    setLoadingId(null)

    if (res?.error) {
      showToast('error', res.error)
      return
    }
    if (res?.lowStockAlerts && res.lowStockAlerts.length > 0) {
      const names = res.lowStockAlerts.map((a: any) => `${a.material} (${a.remaining} left)`).join(', ')
      showToast('warning', `⚠ Low stock after issue: ${names}`)
    }
  }

  // Filter live orders based on role AND user-selected filters
  const filteredOrders = useMemo(() => {
    let result = liveOrders.filter(o => {
      // Role-based visibility
      let visible = true
      if (userRole === 'store_manager') visible = ['draft', 'in_production', 'pending_stock', 'material_released'].includes(o.status)
      else if (userRole === 'cutting_master') visible = ['material_released', 'cutting'].includes(o.status)
      else if (userRole === 'production_supervisor') visible = ['cutting', 'fusing', 'stitching', 'kaj_buttoning', 'finishing_ironing', 'qc', 'rework'].includes(o.status)
      
      if (!visible) return false

      // Custom filters
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
  }, [liveOrders, userRole, filters])

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl text-sm font-bold border shadow-sm animate-fade-in ${
          toast.type === 'error'
            ? 'bg-destructive/10 text-destructive border-destructive/20'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
        }`}>
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 text-xs">✕</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Floor Control Center
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">Real-time production tracking for {userRole.replace('_', ' ')}</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'cards' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Cards
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <AdvancedFilterBar 
        availableCustomers={availableCustomers}
        availableStages={availableStages}
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({ stages: [], dueDate: 'all', volumes: [], customerSearch: '', sortOrder: 'asc' })}
      />

      {filteredOrders.length === 0 ? (
        <div className="card-premium p-16 text-center border border-border shadow-sm">
          <div className="w-16 h-16 rounded-[2rem] bg-muted mx-auto mb-6 flex items-center justify-center text-muted-foreground shadow-sm">
            <Timer className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>No active orders in your queue</h3>
          <p className="text-muted-foreground mt-2 font-medium">New orders will appear here as they move through production.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-2">
          {filteredOrders.map((order, i) => (
            <OrderListRow 
              key={order.id} 
              order={order} 
              index={i}
              userRole={userRole} 
              onUpdate={handleStatusUpdate}
              isLoading={loadingId === order.id}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order, i) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              index={i}
              userRole={userRole} 
              onUpdate={handleStatusUpdate}
              isLoading={loadingId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, index, userRole, onUpdate, isLoading }: { 
  order: Order, 
  index: number,
  userRole: string, 
  onUpdate: (id: string, status: string) => Promise<void>,
  isLoading: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [bom, setBom] = useState<any[] | null>(null)
  const [loadingBom, setLoadingBom] = useState(false)
  // Confirmation modal for "Complete [Stage]" actions
  const [confirmModal, setConfirmModal] = useState<{ nextStatus: string; label: string; expectedQty: number } | null>(null)
  const [piecesInput, setPiecesInput] = useState('')

  const urgency = getUrgency(order.delivery_date)
  const delivery = getRelativeDelivery(order.delivery_date)
  const totalExpectedQty = order.sku_list?.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) ?? 0

  function requestConfirm(nextStatus: string, label: string) {
    setPiecesInput(String(totalExpectedQty))
    setConfirmModal({ nextStatus, label, expectedQty: totalExpectedQty })
  }

  async function submitConfirm() {
    if (!confirmModal) return
    const pieces = parseInt(piecesInput, 10)
    const yieldLoss = confirmModal.expectedQty - (isNaN(pieces) ? 0 : pieces)
    // Log yield loss if significant
    if (yieldLoss > 0) {
      // We pass the yield info as a note — can be expanded to a dedicated log later
      console.info(`Yield loss at ${confirmModal.label}: ${yieldLoss} pcs short on ${order.po_number}`)
    }
    setConfirmModal(null)
    await onUpdate(order.id, confirmModal.nextStatus)
  }

  useEffect(() => {
    if (isExpanded && !bom) {
      setLoadingBom(true)
      getOrderBOM(order.id).then(res => {
        if (res.data) setBom(res.data)
        setLoadingBom(false)
      })
    }
  }, [isExpanded, order.id, bom])



  return (
    <>
    {/* ── Confirmation Modal ─────────────────────────────────────────────── */}
    {confirmModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmModal(null)}>
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-sm font-bold text-foreground mb-1">{confirmModal.label}</h3>
          <p className="text-xs text-muted-foreground mb-5">Enter the number of pieces completed at this stage.</p>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Pieces Completed</label>
          <input
            type="number"
            min={0}
            value={piecesInput}
            onChange={e => setPiecesInput(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 mb-1 text-center tabular-nums"
            autoFocus
          />
          <p className="text-[10px] text-muted-foreground text-center mb-5">
            Expected: <span className="font-bold">{confirmModal.expectedQty.toLocaleString()} pcs</span>
            {parseInt(piecesInput) < confirmModal.expectedQty && parseInt(piecesInput) >= 0 && (
              <span className="text-amber-600 font-bold"> · {confirmModal.expectedQty - parseInt(piecesInput)} pcs yield loss</span>
            )}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 rounded-full border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={submitConfirm} className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">Confirm</button>
          </div>
        </div>
      </div>
    )}

    <div className={`relative card-premium p-6 flex flex-col h-full animate-fade-up border border-border shadow-sm ${urgencyBorder[urgency]}`}>
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-sm z-20">
        {index + 1}
      </div>
      <div className="flex justify-between items-start mb-5">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1 block">
            {order.po_number}
          </span>
          <h4 className="font-bold text-foreground truncate max-w-[180px]">{order.customer_name}</h4>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
            {statusLabels[order.status] || order.status}
          </div>
          {delivery && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${delivery.className}`}>
              {delivery.text}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 mb-4">
        <div 
          className="cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-xl transition-colors" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
              <Box className="w-3.5 h-3.5" />
              <span>{order.sku_list?.length || 0} SKUs</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          
          {isExpanded ? (
            <div className="mt-3 space-y-4 animate-fade-in cursor-default" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SKUs</h5>
                {order.sku_list?.map((sku, idx) => (
                  <div key={idx} className="bg-muted/40 rounded-lg p-2.5 border border-border/50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-foreground">{sku.garment_type}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{sku.style_code}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {['s', 'm', 'l', 'xl', 'xxl'].map(size => (
                        <div key={size} className="bg-background rounded flex flex-col items-center justify-center py-1 border border-border/30">
                          <span className="text-[8px] uppercase text-muted-foreground font-bold">{size}</span>
                          <span className="text-xs font-semibold">{sku.sizes?.[size] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Materials Required</h5>
                {loadingBom ? (
                  <div className="text-[10px] text-muted-foreground font-medium animate-pulse">Loading BOM...</div>
                ) : bom && bom.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {bom.map((item, idx) => (
                      <div key={idx} className="bg-muted/30 rounded p-2 flex flex-col gap-1 border border-border/50">
                        <span className="text-[10px] font-bold text-foreground truncate" title={item.material_name}>{item.material_name}</span>
                        <span className="text-xs font-semibold text-foreground">{item.required_qty} <span className="text-muted-foreground">{item.unit}</span></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] text-muted-foreground font-medium">No materials required.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-1.5 text-[11px] text-muted-foreground/80 line-clamp-1 font-medium pl-5">
              {order.sku_list?.map(s => s.garment_type).join(', ') || 'No SKUs'}
            </div>
          )}
        </div>

        {/* Remove redundant absolute delivery — shown in header chip now */}
      </div>

      <div className="mb-4">
        <PhaseProgress status={order.status} />
      </div>

      <div className="pt-4 border-t border-border">
        {renderActionButtons(order, userRole, onUpdate, isLoading, requestConfirm)}
      </div>
    </div>
    </>
  )
}

function renderActionButtons(
  order: Order, role: string,
  onUpdate: (id: string, s: string) => Promise<void>,
  loading: boolean,
  requestConfirm: (nextStatus: string, label: string) => void
) {
  if (loading) return (
    <button disabled className="w-full py-3 rounded-full bg-muted text-muted-foreground text-sm font-bold animate-pulse">
      Processing...
    </button>
  )

  // Store Manager Actions
  if (role === 'store_manager' || role === 'super_admin') {
    if (order.status === 'in_production') {
      return (
        <button onClick={() => onUpdate(order.id, 'material_released')} className="w-full btn-primary gap-2 text-sm">
          <Layers className="w-4 h-4" /> Issue to Floor
        </button>
      )
    }
    if (order.status === 'pending_stock') {
      return (
        <button onClick={() => onUpdate(order.id, 'material_released')} className="w-full btn-primary gap-2 text-sm bg-primary/90 hover:bg-primary">
          <Layers className="w-4 h-4" /> Stock Arrived — Issue
        </button>
      )
    }
  }

  // Cutting Master Actions
  if (role === 'cutting_master' || role === 'super_admin') {
    if (order.status === 'material_released') {
      return (
        <button onClick={() => onUpdate(order.id, 'cutting')} className="w-full btn-primary gap-2 text-sm">
          <Scissors className="w-4 h-4" /> Start Cutting
        </button>
      )
    }
    if (order.status === 'cutting') {
      return (
        <button onClick={() => requestConfirm('fusing', 'Complete Cutting')} className="w-full btn-primary gap-2 text-sm bg-primary/80">
          <CheckCircle2 className="w-4 h-4" /> Complete Cutting
        </button>
      )
    }
  }

  // Supervisor Actions
  if (role === 'production_supervisor' || role === 'super_admin') {
    const stages = [
      { id: 'fusing', label: 'Start Fusing', icon: Play, next: 'fusing' },
      { id: 'fusing_active', label: 'Complete Fusing', icon: CheckCircle, next: 'stitching', current: 'fusing' },
      { id: 'stitching', label: 'Start Stitching', icon: Play, next: 'stitching' },
      { id: 'stitching_active', label: 'Complete Stitching', icon: CheckCircle, next: 'kaj_buttoning', current: 'stitching' },
      { id: 'kaj_buttoning', label: 'Start Kaj & Button', icon: Play, next: 'kaj_buttoning' },
      { id: 'kaj_buttoning_active', label: 'Complete Kaj & Button', icon: CheckCircle, next: 'finishing_ironing', current: 'kaj_buttoning' },
      { id: 'finishing_ironing', label: 'Start Finishing', icon: Play, next: 'finishing_ironing' },
      { id: 'finishing_ironing_active', label: 'Complete Finishing', icon: CheckCircle, next: 'qc', current: 'finishing_ironing' },
    ]

    // Special case for QC
    if (order.status === 'qc') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onUpdate(order.id, 'packing')} className="py-3 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-primary/20 hover:scale-105 transition-transform">
            <ClipboardCheck className="w-3.5 h-3.5" /> Pass QC
          </button>
          <button onClick={() => onUpdate(order.id, 'rework')} className="py-3 rounded-full bg-destructive text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-destructive/20 hover:scale-105 transition-transform">
            <AlertCircle className="w-3.5 h-3.5" /> Fail QC
          </button>
        </div>
      )
    }

    if (order.status === 'rework') {
      return (
        <button onClick={() => onUpdate(order.id, 'stitching')} className="w-full bg-secondary text-secondary-foreground py-3 rounded-full gap-2 text-sm font-bold shadow-sm hover:scale-105 transition-transform flex items-center justify-center">
          <Play className="w-4 h-4" /> Send to Stitching
        </button>
      )
    }

    // Dynamic stage progression
    const currentStage = stages.find(s => s.current === order.status)
    if (currentStage) {
       return (
        <button onClick={() => onUpdate(order.id, currentStage.next)} className="w-full btn-primary gap-2 text-sm">
          <currentStage.icon className="w-4 h-4" /> {currentStage.label}
        </button>
      )
    }

    const nextMap: Record<string, { label: string, next: string, icon: any }> = {
      'fusing': { label: 'Complete Fusing', next: 'stitching', icon: CheckCircle },
      'stitching': { label: 'Complete Stitching', next: 'kaj_buttoning', icon: CheckCircle },
      'kaj_buttoning': { label: 'Complete Kaj & Button', next: 'finishing_ironing', icon: CheckCircle },
      'finishing_ironing': { label: 'Complete Finishing', next: 'qc', icon: CheckCircle },
    }

    const map = nextMap[order.status]
    if (map) {
      return (
        <button onClick={() => requestConfirm(map.next, map.label)} className="w-full btn-primary gap-2 text-sm">
          <map.icon className="w-4 h-4" /> {map.label}
        </button>
      )
    }
  }

  return <p className="text-center text-xs text-muted-foreground py-2 font-medium">No actions available</p>
}

function PhaseProgress({ status }: { status: string }) {
  const phases = [
    { label: 'Plan', match: ['draft', 'in_production', 'pending_stock'] },
    { label: 'Mat', match: ['material_released'] },
    { label: 'Cut', match: ['cutting', 'fusing'] },
    { label: 'Stitch', match: ['stitching', 'kaj_buttoning', 'finishing_ironing'] },
    { label: 'QC', match: ['qc', 'rework'] },
    { label: 'Pack', match: ['packing', 'dispatched', 'closed'] },
  ]
  
  const currentIndex = phases.findIndex(p => p.match.includes(status))
  const activeIndex = currentIndex === -1 ? 0 : currentIndex
  
  return (
    <div className="pt-2 pb-1">
      <div className="flex justify-between relative mb-2">
        <div className="absolute left-[10px] right-[10px] top-1.5 h-[2px] bg-muted z-0" />
        <div 
          className="absolute left-[10px] top-1.5 h-[2px] bg-primary z-0 transition-all duration-500" 
          style={{ width: `calc(${Math.max(0, (activeIndex / (phases.length - 1)) * 100)}% - 20px)` }} 
        />
        {phases.map((phase, idx) => {
          const isActive = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          return (
            <div key={phase.label} className="relative z-10 flex flex-col items-center bg-card rounded-full">
              <div className={`w-3.5 h-3.5 rounded-full border-[2.5px] transition-colors duration-500 ${isActive ? 'border-primary bg-primary' : 'border-muted bg-card'} ${isCurrent ? 'ring-4 ring-primary/20' : ''}`} />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground px-0.5">
        {phases.map((phase, idx) => (
          <span key={phase.label} className={idx <= activeIndex ? 'text-foreground' : 'opacity-60'}>{phase.label}</span>
        ))}
      </div>
    </div>
  )
}

function MiniPhaseProgress({ status }: { status: string }) {
  const phases = [
    { label: 'Plan', match: ['draft', 'in_production', 'pending_stock'] },
    { label: 'Mat', match: ['material_released'] },
    { label: 'Cut', match: ['cutting', 'fusing'] },
    { label: 'Stitch', match: ['stitching', 'kaj_buttoning', 'finishing_ironing'] },
    { label: 'QC', match: ['qc', 'rework'] },
    { label: 'Pack', match: ['packing', 'dispatched', 'closed'] },
  ]
  const currentIndex = phases.findIndex(p => p.match.includes(status))
  const activeIndex = currentIndex === -1 ? 0 : currentIndex
  return (
    <div className="flex justify-between relative w-full items-center">
      <div className="absolute left-1 right-1 top-1.5 h-[2px] bg-muted z-0" />
      <div 
        className="absolute left-1 top-1.5 h-[2px] bg-primary z-0 transition-all duration-500" 
        style={{ width: `calc(${Math.max(0, (activeIndex / (phases.length - 1)) * 100)}% - 8px)` }} 
      />
      {phases.map((phase, idx) => {
        const isActive = idx <= activeIndex;
        const isCurrent = idx === activeIndex;
        return (
          <div key={phase.label} className="relative z-10 flex flex-col items-center bg-card rounded-full" title={phase.label}>
            <div className={`w-3 h-3 rounded-full border-2 transition-colors duration-500 ${isActive ? 'border-primary bg-primary' : 'border-muted bg-card'} ${isCurrent ? 'ring-2 ring-primary/20' : ''}`} />
          </div>
        )
      })}
    </div>
  )
}

function OrderListRow({ order, index, userRole, onUpdate, isLoading }: { 
  order: Order, 
  index: number,
  userRole: string, 
  onUpdate: (id: string, status: string) => Promise<void>,
  isLoading: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [bom, setBom] = useState<any[] | null>(null)
  const [loadingBom, setLoadingBom] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ nextStatus: string, label: string, expectedQty: number } | null>(null)
  const [piecesInput, setPiecesInput] = useState('')

  const urgency = getUrgency(order.delivery_date)
  const delivery = getRelativeDelivery(order.delivery_date)
  const totalExpectedQty = order.sku_list?.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) ?? 0

  function requestConfirm(nextStatus: string, label: string) {
    setPiecesInput(String(totalExpectedQty))
    setConfirmModal({ nextStatus, label, expectedQty: totalExpectedQty })
  }

  async function submitConfirm() {
    if (!confirmModal) return
    const pieces = parseInt(piecesInput, 10)
    const yieldLoss = confirmModal.expectedQty - (isNaN(pieces) ? 0 : pieces)
    if (yieldLoss > 0) {
      console.info(`Yield loss at ${confirmModal.label}: ${yieldLoss} pcs short on ${order.po_number}`)
    }
    setConfirmModal(null)
    await onUpdate(order.id, confirmModal.nextStatus)
  }

  useEffect(() => {
    if (isExpanded && !bom) {
      setLoadingBom(true)
      getOrderBOM(order.id).then(res => {
        if (res.data) setBom(res.data)
        setLoadingBom(false)
      })
    }
  }, [isExpanded, order.id, bom])

  return (
    <>
    {confirmModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmModal(null)}>
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
          <h3 className="text-sm font-bold text-foreground mb-1">{confirmModal.label}</h3>
          <p className="text-xs text-muted-foreground mb-5">Enter the number of pieces completed at this stage.</p>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Pieces Completed</label>
          <input
            type="number"
            min={0}
            value={piecesInput}
            onChange={e => setPiecesInput(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-lg font-bold text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 mb-1 text-center tabular-nums"
            autoFocus
          />
          <p className="text-[10px] text-muted-foreground text-center mb-5">
            Expected: <span className="font-bold">{confirmModal.expectedQty.toLocaleString()} pcs</span>
            {parseInt(piecesInput) < confirmModal.expectedQty && parseInt(piecesInput) >= 0 && (
              <span className="text-amber-600 font-bold"> · {confirmModal.expectedQty - parseInt(piecesInput)} pcs yield loss</span>
            )}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 rounded-full border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            <button onClick={submitConfirm} className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">Confirm</button>
          </div>
        </div>
      </div>
    )}

    <div className={`bg-card border border-border shadow-sm rounded-lg overflow-hidden transition-colors ${urgencyBorder[urgency]} animate-fade-up`}>
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 cursor-pointer hover:bg-muted/30 gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-6 h-6 rounded bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex flex-col truncate min-w-[120px]">
            <span className="text-[10px] uppercase tracking-widest font-bold text-secondary truncate">{order.po_number}</span>
            <h4 className="font-bold text-sm text-foreground truncate">{order.customer_name}</h4>
          </div>
          <div className="hidden md:flex flex-col pl-4 border-l border-border min-w-[80px]">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Volume</span>
            <span className="text-xs font-bold text-foreground">{totalExpectedQty} pcs</span>
          </div>
          <div className="flex-1 max-w-[200px] hidden lg:block px-4 ml-4">
            <MiniPhaseProgress status={order.status} />
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
            {statusLabels[order.status] || order.status}
          </div>
          {delivery && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${delivery.className}`}>
              {delivery.text}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-border bg-muted/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SKUs</h5>
              {order.sku_list?.map((sku, idx) => (
                <div key={idx} className="bg-card rounded-lg p-2.5 border border-border/50 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-foreground">{sku.garment_type}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{sku.style_code}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {['s', 'm', 'l', 'xl', 'xxl'].map(size => (
                      <div key={size} className="bg-muted/30 rounded flex flex-col items-center justify-center py-1 border border-border/30">
                        <span className="text-[8px] uppercase text-muted-foreground font-bold">{size}</span>
                        <span className="text-xs font-semibold">{sku.sizes?.[size] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Materials Required</h5>
              {loadingBom ? (
                <div className="text-[10px] text-muted-foreground font-medium animate-pulse">Loading BOM...</div>
              ) : bom && bom.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {bom.map((item, idx) => (
                    <div key={idx} className="bg-card rounded p-2 flex flex-col gap-1 border border-border/50 shadow-sm">
                      <span className="text-[10px] font-bold text-foreground truncate" title={item.material_name}>{item.material_name}</span>
                      <span className="text-xs font-semibold text-foreground">{item.required_qty} <span className="text-muted-foreground">{item.unit}</span></span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground font-medium">No materials required.</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            {renderActionButtons(order, userRole, onUpdate, isLoading, requestConfirm)}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
