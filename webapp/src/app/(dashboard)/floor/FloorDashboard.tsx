'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { updatePOStatus, logQC, getOrderBOM, updatePOQuantity, addPONote } from './actions'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle2, AlertCircle, Play, CheckCircle, 
  Scissors, Box, Layers, ClipboardCheck, Timer, ChevronDown, Filter,
  LayoutGrid, List, CheckSquare, Square, Zap, Info, XCircle
} from 'lucide-react'
import { AdvancedFilterBar, FilterState, matchDueDate, matchVolume } from '@/components/ui/AdvancedFilterBar'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/Dialog'
import { cn } from '@/lib/utils'

type Order = {
  id: string
  po_number: string
  customer_name: string
  status: string
  sku_list: any[] | null
  delivery_date: string | null
  created_at: string
  version: number
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
  if (diffDays < 0) return { text: `Overdue ${Math.abs(diffDays)}d`, urgency: 'red', class: 'text-destructive' }
  if (diffDays === 0) return { text: 'Due today', urgency: 'red', class: 'text-destructive' }
  if (diffDays === 1) return { text: '1 day left', urgency: 'amber', class: 'text-warning' }
  if (diffDays <= 3) return { text: `${diffDays} days left`, urgency: 'amber', class: 'text-warning' }
  return { text: `${diffDays} days`, urgency: 'none', class: 'text-secondary' }
}

const statusBadgeMap: Record<string, string> = {
  draft: 'bg-surface-muted text-muted',
  in_production: 'bg-info-tint text-info',
  pending_stock: 'bg-warning-tint text-warning',
  material_released: 'bg-info-tint text-info',
  cutting: 'bg-primary-tint text-primary',
  fusing: 'bg-primary-tint text-primary',
  stitching: 'bg-primary-tint text-primary',
  kaj_buttoning: 'bg-primary-tint text-primary',
  finishing_ironing: 'bg-primary-tint text-primary',
  qc: 'bg-warning-tint text-warning',
  rework: 'bg-destructive-tint text-destructive',
  packing: 'bg-success-tint text-success',
  dispatched: 'bg-success-tint text-success'
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

const BATCH_NEXT_STATUS: Record<string, string> = {
  draft: 'in_production',
  in_production: 'material_released',
  pending_stock: 'material_released',
  material_released: 'cutting',
  cutting: 'fusing',
  fusing: 'stitching',
  stitching: 'kaj_buttoning',
  kaj_buttoning: 'finishing_ironing',
  finishing_ironing: 'qc',
  qc: 'packing',
  rework: 'qc'
}

export function FloorDashboard({ orders, userRole }: { orders: Order[], userRole: string }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'error' | 'warning' | 'success'; message: string } | null>(null)
  const [liveOrders, setLiveOrders] = useState<Order[]>(orders)
  const [viewMode, setViewMode] = useState<'cards'|'list'>(() => orders.length > 10 ? 'list' : 'cards')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  const [filters, setFilters] = useState<FilterState>({
    stages: [],
    dueDate: 'all',
    volumes: [],
    customerSearch: '',
    sortOrder: 'asc'
  })

  const availableCustomers = useMemo(() => Array.from(new Set(orders.map(o => o.customer_name))), [orders])
  const availableStages = useMemo(() => Object.entries(statusLabels).map(([id, label]) => ({ id, label })), [])

  useEffect(() => {
    // Reconcile after server refreshes while preserving real-time updates between refreshes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  function showToast(type: 'error' | 'warning' | 'success', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  async function handleStatusUpdate(id: string, nextStatus: string) {
    const order = liveOrders.find(o => o.id === id)
    if (!order) return

    // Optimistic UI Update
    const previousOrders = [...liveOrders]
    setLiveOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus, version: (o.version || 0) + 1 } : o))

    try {
      const result = await updatePOStatus(id, nextStatus, order.version)
      
      if (result.error) {
        showToast('error', result.error)
        setLiveOrders(previousOrders) // Rollback on failure
        return false
      }
      
      router.refresh()
      return true
    } catch (err) {
      console.error('Failed to update status:', err)
      setLiveOrders(previousOrders) // Rollback on error
      showToast('error', 'Failed to update status. Please check your connection.')
      return false
    }
  }

  async function handleBatchNextStage() {
    if (selectedIds.length === 0) return
    
    setLoadingId('batch')
    const eligibleOrders = selectedIds
      .map(id => liveOrders.find(o => o.id === id))
      .filter((order): order is Order => Boolean(order && BATCH_NEXT_STATUS[order.status]))

    if (eligibleOrders.length === 0) {
      showToast('warning', 'Selected orders cannot move to the next stage yet')
      return
    }

    try {
      let successCount = 0

      for (const order of eligibleOrders) {
        const nextStatus = BATCH_NEXT_STATUS[order.status]
        const updated = await handleStatusUpdate(order.id, nextStatus)
        if (updated) {
          successCount++
        }
      }

      setSelectedIds([])
      if (successCount > 0) {
        showToast('success', `${successCount} order${successCount === 1 ? '' : 's'} moved to next stage`)
        router.refresh()
      }
    } finally {
      setLoadingId(null)
    }
  }

  async function handleBatchAutoIssue() {
    if (selectedIds.length === 0) return
    if (userRole !== 'store_manager' && userRole !== 'super_admin') {
      showToast('error', 'Only store managers can issue materials')
      return
    }

    const eligibleOrders = selectedIds
      .map(id => liveOrders.find(o => o.id === id))
      .filter((order): order is Order => Boolean(order && (order.status === 'in_production' || order.status === 'pending_stock')))

    if (eligibleOrders.length === 0) {
      showToast('warning', 'Select planning-stage orders to auto-issue materials')
      return
    }

    setLoadingId('batch-issue')
    try {
      let successCount = 0
      for (const order of eligibleOrders) {
        const updated = await handleStatusUpdate(order.id, 'material_released')
        if (updated) {
          successCount++
        }
      }
      setSelectedIds([])
      if (successCount > 0) {
        showToast('success', `${successCount} order${successCount === 1 ? '' : 's'} issued to floor`)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const filteredOrders = useMemo(() => {
    const result = liveOrders.filter(o => {
      let visible = true
      if (userRole === 'store_manager') visible = ['draft', 'in_production', 'pending_stock', 'material_released'].includes(o.status)
      else if (userRole === 'cutting_master') visible = ['material_released', 'cutting'].includes(o.status)
      else if (userRole === 'production_supervisor') visible = ['cutting', 'fusing', 'stitching', 'kaj_buttoning', 'finishing_ironing', 'qc', 'rework'].includes(o.status)
      
      if (!visible) return false
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
  }, [liveOrders, userRole, filters])

  const filteredOrderIds = useMemo(() => filteredOrders.map(o => o.id), [filteredOrders])
  const selectedVisibleIds = useMemo(
    () => selectedIds.filter(id => filteredOrderIds.includes(id)),
    [selectedIds, filteredOrderIds]
  )
  const selectedOrders = useMemo(
    () => selectedIds.map(id => liveOrders.find(o => o.id === id)).filter((order): order is Order => Boolean(order)),
    [selectedIds, liveOrders]
  )
  const hasAutoIssueEligibleSelection = selectedOrders.some(order => order.status === 'in_production' || order.status === 'pending_stock')
  const hasNextStageEligibleSelection = selectedOrders.some(order => BATCH_NEXT_STATUS[order.status])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAll = () => {
    if (filteredOrders.length === 0) {
      setSelectedIds([])
      showToast('warning', 'No visible orders to select')
      return
    }

    if (selectedVisibleIds.length === filteredOrders.length) {
      setSelectedIds(prev => prev.filter(id => !filteredOrderIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredOrderIds])))
    }
  }

  return (
    <>
    {toast && (
      <div className="fixed top-6 left-1/2 z-[120] -translate-x-1/2 px-5 py-3 rounded-full bg-[#1a1a1a] text-white shadow-2xl border border-white/10 flex items-center gap-3 animate-fade-up">
        {toast.type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-success" />
        ) : (
          <AlertCircle className={toast.type === 'error' ? "w-4 h-4 text-destructive" : "w-4 h-4 text-warning"} />
        )}
        <span className="text-xs font-bold">{toast.message}</span>
      </div>
    )}
    <div className="space-y-8 animate-fade-up">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-success">Live Floor Tracking</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            Production Control
          </h2>
          <p className="text-secondary font-medium text-sm md:text-base">Real-time tracking for {userRole.replace('_', ' ')}</p>
        </div>
        
        <div className="flex items-center gap-3">
           <Button 
             variant="secondary" 
             onClick={selectAll} 
             className="flex-1 md:flex-none h-14 md:h-12 px-6 rounded-2xl" 
             icon={<CheckSquare className="w-5 h-5 md:w-4 md:h-4" />}
           >
              {selectedVisibleIds.length === filteredOrders.length && filteredOrders.length > 0 ? 'Deselect All' : 'Select All'}
           </Button>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <div className="card-premium p-1 border border-border bg-background overflow-hidden">
        <AdvancedFilterBar 
          availableCustomers={availableCustomers}
          availableStages={availableStages}
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({ stages: [], dueDate: 'all', volumes: [], customerSearch: '', sortOrder: 'asc' })}
        />
      </div>

      {/* ── Intelligent Hints ─────────────────────────────────────── */}
      {filteredOrders.some(o => getUrgency(o.delivery_date) === 'overdue') && (
        <div className="p-4 rounded-2xl bg-destructive-tint border border-destructive/20 flex items-center gap-4 animate-fade-in shadow-sm shadow-destructive/5">
           <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-destructive text-primary-foreground flex items-center justify-center shadow-lg shadow-destructive/20">
              <AlertCircle className="w-6 h-6" />
           </div>
           <p className="text-sm font-bold text-foreground leading-snug">
             Attention: {filteredOrders.filter(o => getUrgency(o.delivery_date) === 'overdue').length} orders are overdue. Prioritize these on the floor immediately.
           </p>
        </div>
      )}

      {/* ── Content Grid ──────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div className="card-premium p-12 md:p-20 text-center border border-border shadow-sm">
          <div className="w-20 h-20 rounded-[2.5rem] bg-surface-muted mx-auto mb-6 flex items-center justify-center text-muted shadow-inner">
            <Timer className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No active orders in your queue</h3>
          <p className="text-muted mt-2 max-w-xs mx-auto">New production tasks will appear here as they are issued from store or planning.</p>
        </div>
      ) : (
        <div className={viewMode === 'cards' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start" : "space-y-4"}>
          {filteredOrders.map((order, i) => (
            viewMode === 'cards' ? (
              <OrderCard 
                key={order.id} 
                order={order} 
                index={i}
                userRole={userRole} 
                onUpdate={handleStatusUpdate}
                showToast={showToast}
                isLoading={loadingId === order.id}
                isSelected={selectedIds.includes(order.id)}
                onSelect={() => toggleSelect(order.id)}
              />
            ) : (
              <OrderListRow 
                key={order.id} 
                order={order} 
                index={i}
                userRole={userRole} 
                onUpdate={handleStatusUpdate}
                showToast={showToast}
                requestConfirm={(nextStatus: string) => handleStatusUpdate(order.id, nextStatus)}
                isLoading={loadingId === order.id}
                isSelected={selectedIds.includes(order.id)}
                onSelect={() => toggleSelect(order.id)}
              />
            )
          ))}
        </div>
      )}
    </div>

    {/* ── Batch Actions Bar ─────────────────────────────────────── */}
    {selectedIds.length > 0 && (
      <div className="fixed bottom-[88px] md:bottom-8 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[140] px-4 md:px-0">
        <div className="glass px-5 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-primary/20 flex flex-col md:flex-row items-center gap-4 md:gap-8 animate-fade-up max-w-lg mx-auto md:max-w-none">
           <div className="flex items-center justify-between w-full md:w-auto gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Selection</span>
                <span className="text-base font-bold text-foreground">{selectedIds.length} Order{selectedIds.length === 1 ? '' : 's'}</span>
              </div>
              <div className="h-8 w-px bg-border/50 hidden md:block" />
              <Button 
                variant="icon" 
                size="icon" 
                className="md:hidden h-10 w-10 bg-surface-muted text-muted"
                aria-label="Clear selected orders" 
                onClick={() => setSelectedIds([])} 
                icon={<XCircle className="w-5 h-5" />} 
              />
           </div>

           <div className="flex gap-2 w-full md:w-auto">
              <Button 
                variant="secondary" 
                className="flex-1 md:flex-none h-14 md:h-12 rounded-2xl md:px-6"
                icon={<Zap className="w-4 h-4" />}
                onClick={handleBatchAutoIssue}
                loading={loadingId === 'batch-issue'}
                disabled={loadingId !== null || !hasAutoIssueEligibleSelection}
              >
                 Auto-Issue
              </Button>
              <Button 
                className="flex-[2] md:flex-none h-14 md:h-12 rounded-2xl md:px-8"
                onClick={handleBatchNextStage} 
                loading={loadingId === 'batch'}
                disabled={loadingId !== null || !hasNextStageEligibleSelection}
              >
                 Next Stage
              </Button>
              <Button 
                variant="icon" 
                size="icon" 
                className="hidden md:flex h-12 w-12 bg-surface-muted text-muted"
                aria-label="Clear selected orders" 
                onClick={() => setSelectedIds([])} 
                icon={<XCircle className="w-6 h-6" />} 
              />
           </div>
        </div>
      </div>
    )}
    </>
  )
}

function OrderCard({ order, index, userRole, onUpdate, showToast, isLoading, isSelected, onSelect }: { 
  order: Order, 
  index: number,
  userRole: string, 
  onUpdate: (id: string, status: string) => Promise<unknown>,
  showToast: (type: 'error' | 'warning' | 'success', message: string) => void,
  isLoading: boolean,
  isSelected: boolean,
  onSelect: () => void
}) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [bom, setBom] = useState<any[] | null>(null)
  const [loadingBom, setLoadingBom] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ nextStatus: string; label: string; expectedQty: number } | null>(null)
  const [piecesInput, setPiecesInput] = useState('')
  const [noteInput, setNoteInput] = useState('')

  const delivery = getRelativeDelivery(order.delivery_date)
  const totalExpectedQty = order.sku_list?.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) ?? 0

  function requestConfirm(nextStatus: string, label: string) {
    setPiecesInput(String(totalExpectedQty))
    setNoteInput('')
    setConfirmModal({ nextStatus, label, expectedQty: totalExpectedQty })
  }

  async function submitConfirm() {
    if (!confirmModal) return
    const pieces = parseInt(piecesInput, 10)
    const nextStatus = confirmModal.nextStatus
    setConfirmModal(null)
    
    // Add Note if provided
    if (noteInput.trim()) {
      const res = await addPONote(order.id, noteInput.trim(), 'comment')
      if (res.error) showToast('error', `Note failed: ${res.error}`)
    }

    // Update Quantity if different from expected
    if (pieces !== confirmModal.expectedQty) {
      const res = await updatePOQuantity(order.id, pieces, order.version)
      if (res.error) {
        showToast('error', `Quantity update failed: ${res.error}`)
        return
      }
    }

    await onUpdate(order.id, nextStatus)
    router.refresh()
  }

  async function toggleExpanded() {
    const nextExpanded = !isExpanded
    setIsExpanded(nextExpanded)
    if (nextExpanded && !bom && !loadingBom) {
      setLoadingBom(true)
      try {
        const res = await getOrderBOM(order.id)
        if (res.data) setBom(res.data)
      } finally {
        setLoadingBom(false)
      }
    }
  }

  return (
    <>
    <Dialog
      isOpen={!!confirmModal}
      onClose={() => setConfirmModal(null)}
      title={confirmModal?.label || ''}
      description="Record actual piece count for production yield tracking."
      onConfirm={submitConfirm}
      confirmLabel="Confirm & Next"
    >
      <div className="space-y-6 mb-2">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-3 text-center">Actual Pieces Completed</label>
          <input
            type="number"
            min={0}
            value={piecesInput}
            onChange={e => setPiecesInput(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-4 text-4xl font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-center tabular-nums"
            autoFocus
          />
        </div>
        <div className="flex items-center justify-center gap-6 px-4 py-4 rounded-2xl bg-gray-50 border border-gray-100">
           <div className="text-center">
              <p className="text-[9px] font-bold text-muted uppercase">Expected</p>
              <p className="text-lg font-bold text-foreground">{confirmModal?.expectedQty}</p>
           </div>
           <div className="w-px h-8 bg-gray-200" />
           <div className="text-center">
              <p className="text-[9px] font-bold text-muted uppercase">Yield Loss</p>
              <p className={`text-lg font-bold ${parseInt(piecesInput) < (confirmModal?.expectedQty || 0) ? 'text-destructive' : 'text-success'}`}>
                {(confirmModal?.expectedQty || 0) - (parseInt(piecesInput) || 0)}
              </p>
           </div>
        </div>
        
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-2">Production Notes (Optional)</label>
          <textarea
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            placeholder="e.g. Minor yield loss due to fabric defect..."
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[80px] resize-none"
          />
        </div>
      </div>
    </Dialog>

    <div className={cn(
      "group relative card-premium p-5 md:p-8 flex flex-col animate-fade-up bg-surface",
      delivery?.urgency === 'red' ? 'urgency-red bg-destructive-tint/10' : delivery?.urgency === 'amber' ? 'urgency-amber bg-warning-tint/10' : '',
      isSelected && "ring-2 ring-primary border-primary/20 bg-primary-tint/5"
    )}>
      <Button 
        variant="icon"
        size="icon"
        aria-label={isSelected ? `Deselect ${order.po_number}` : `Select ${order.po_number}`}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn(
          "absolute top-4 right-4 transition-all h-12 w-12 md:h-10 md:w-10 rounded-xl",
          isSelected ? "bg-primary text-white hover:bg-primary-dark" : "bg-surface-muted text-muted"
        )}
        icon={isSelected ? <CheckSquare className="w-6 h-6 md:w-5 md:h-5" /> : <Square className="w-6 h-6 md:w-5 md:h-5" />}
      />

      <div className="flex justify-between items-start mb-4 md:mb-6 pr-12">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-primary mb-1 block">
            {order.po_number}
          </span>
          <h4 className="text-xl font-black text-foreground truncate max-w-[180px] md:max-w-[200px] tracking-tight">{order.customer_name}</h4>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6 md:mb-8">
         <div className={cn(
           "inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent shadow-sm",
           statusBadgeMap[order.status] || 'bg-surface-muted text-muted'
         )}>
            {statusLabels[order.status] || order.status}
         </div>
         {delivery && delivery.urgency !== 'none' && (
            <span className={cn(
              "text-[10px] font-black px-4 py-2 rounded-xl border bg-white shadow-sm",
              delivery.class,
              "border-border"
            )}>
              {delivery.text}
            </span>
         )}
      </div>

      <div className="flex-1 mb-6 md:mb-8">
        <div 
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${order.po_number}`}
          className="cursor-pointer hover:bg-surface-muted/50 p-4 -mx-2 md:-mx-4 rounded-2xl transition-all border border-transparent hover:border-border/40 focus:outline-none focus:ring-4 focus:ring-primary/10" 
          onClick={toggleExpanded}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              toggleExpanded()
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-secondary font-bold">
              <Box className="w-4 h-4 text-primary" />
              <span>{order.sku_list?.length || 0} SKU</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{totalExpectedQty} Pcs</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          
          {isExpanded && (
            <div className="mt-6 space-y-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-3">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">SKU Details</h5>
                {loadingBom && (
                  <p className="text-xs text-muted font-bold animate-pulse">Loading BOM...</p>
                )}
                {order.sku_list?.map((sku: any, idx: number) => (
                  <div key={idx} className="bg-background rounded-2xl p-4 border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-foreground">{sku.garment_type}</span>
                      <span className="text-[10px] font-bold text-muted uppercase">{sku.style_code}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                       {['s', 'm', 'l', 'xl', 'xxl'].map(size => (
                        <div key={size} className="bg-surface rounded-xl flex flex-col items-center justify-center py-2 border border-border/40 shadow-sm">
                          <span className="text-[8px] uppercase text-muted font-black">{size}</span>
                          <span className="text-xs font-bold text-foreground">{sku.sizes?.[size] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {bom && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">BOM Breakdown</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {bom.map((item: any, idx: number) => (
                      <div key={idx} className="bg-background rounded-xl p-3 flex justify-between items-center border border-border/40 shadow-sm">
                        <span className="text-xs font-bold text-foreground">{item.material_name}</span>
                        <span className="text-xs font-bold text-primary">{item.required_qty} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <PhaseProgress status={order.status} />
        <div className="pt-6 border-t border-border/50">
          {renderActionButtons(order, userRole, onUpdate, isLoading, requestConfirm)}
        </div>
      </div>
    </div>
    </>
  )
}

function PhaseProgress({ status }: { status: string }) {
  const phases = [
    { label: 'Plan', icon: LayoutGrid, match: ['draft', 'in_production', 'pending_stock'] },
    { label: 'Mat', icon: Layers, match: ['material_released'] },
    { label: 'Cut', icon: Scissors, match: ['cutting', 'fusing'] },
    { label: 'Stitch', icon: Box, match: ['stitching', 'kaj_buttoning', 'finishing_ironing'] },
    { label: 'QC', icon: ClipboardCheck, match: ['qc', 'rework'] },
    { label: 'Pack', icon: CheckCircle2, match: ['packing', 'dispatched', 'closed'] },
  ]
  const currentIndex = phases.findIndex(p => p.match.includes(status))
  const activeIndex = currentIndex === -1 ? 0 : currentIndex
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between relative px-2">
        <div className="absolute left-[20px] right-[20px] top-1.5 h-[2px] bg-surface-muted z-0" />
        <div 
          className="absolute left-[20px] top-1.5 h-[2px] bg-primary z-0 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)" 
          style={{ width: `calc(${Math.max(0, (activeIndex / (phases.length - 1)) * 100)}% - 40px)` }} 
        />
        {phases.map((phase, idx) => {
          const isActive = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          const Icon = phase.icon;
          return (
            <div key={phase.label} className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-4 h-4 rounded-full border-[3px] transition-all duration-700",
                isActive ? 'border-primary bg-primary' : 'border-surface-muted bg-surface',
                isCurrent ? 'ring-4 ring-primary/20 scale-125' : ''
              )} />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between px-1">
        {phases.map((phase, idx) => {
          const isCurrent = idx === activeIndex;
          const isActive = idx <= activeIndex;
          const Icon = phase.icon;
          return (
            <div key={phase.label} className="flex flex-col items-center flex-1 min-w-0">
               {/* Show icon on mobile, text on MD+ if not current */}
               <Icon className={cn(
                 "w-3.5 h-3.5 md:hidden mb-1 transition-colors",
                 isActive ? "text-primary" : "text-muted/40",
                 isCurrent && "animate-pulse"
               )} />
               <span className={cn(
                 "text-[9px] font-black uppercase tracking-tight text-center truncate w-full transition-colors",
                 isActive ? 'text-primary' : 'text-muted/40',
                 !isCurrent && "hidden md:block" // Hide non-current labels on mobile
               )}>
                 {phase.label}
               </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderActionButtons(
  order: Order, role: string,
  onUpdate: (id: string, s: string) => Promise<unknown>,
  loading: boolean,
  requestConfirm: (nextStatus: string, label: string) => void
) {
  if (loading) return (
    <Button disabled className="w-full h-14 md:h-12 bg-surface-muted text-muted font-black animate-shimmer rounded-2xl">
      Processing Workflow...
    </Button>
  )

  const isStore = role === 'store_manager' || role === 'super_admin'
  const isCutter = role === 'cutting_master' || role === 'super_admin'
  const isSuper = role === 'production_supervisor' || role === 'super_admin'

  const mobileBtnClass = "w-full h-14 md:h-12 rounded-2xl text-sm font-black uppercase tracking-widest"

  if (isStore) {
    if (order.status === 'in_production') {
      return (
        <Button onClick={() => onUpdate(order.id, 'material_released')} className={mobileBtnClass} icon={<Layers className="w-5 h-5 md:w-4 md:h-4" />}>
           Issue Materials
        </Button>
      )
    }
  }

  if (isCutter) {
    if (order.status === 'material_released') {
      return (
        <Button onClick={() => onUpdate(order.id, 'cutting')} className={mobileBtnClass} icon={<Scissors className="w-5 h-5 md:w-4 md:h-4" />}>
           Start Cutting
        </Button>
      )
    }
    if (order.status === 'cutting') {
      return (
        <Button onClick={() => requestConfirm('fusing', 'Finalize Cutting')} className={mobileBtnClass} icon={<CheckCircle2 className="w-5 h-5 md:w-4 md:h-4" />}>
           Complete Cutting
        </Button>
      )
    }
  }

  if (isSuper) {
    if (order.status === 'qc') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => onUpdate(order.id, 'packing')} icon={<ClipboardCheck className="w-5 h-5 md:w-4 md:h-4" />} className={cn(mobileBtnClass, "bg-success hover:bg-success/90 shadow-lg shadow-success/20 text-white")}>
            Pass
          </Button>
          <Button onClick={() => onUpdate(order.id, 'rework')} variant="destructive" icon={<AlertCircle className="w-5 h-5 md:w-4 md:h-4" />} className={mobileBtnClass}>
            Rework
          </Button>
        </div>
      )
    }

    const stageMap: Record<string, { label: string, next: string, icon: any, confirm?: boolean }> = {
      'fusing': { label: 'Complete Fusing', next: 'stitching', icon: CheckCircle, confirm: true },
      'stitching': { label: 'Complete Stitching', next: 'kaj_buttoning', icon: CheckCircle, confirm: true },
      'kaj_buttoning': { label: 'Complete Kaj/Btn', next: 'finishing_ironing', icon: CheckCircle, confirm: true },
      'finishing_ironing': { label: 'Complete Finishing', next: 'qc', icon: CheckCircle, confirm: true },
    }

    const action = stageMap[order.status]
    if (action) {
      return (
        <Button 
          onClick={() => action.confirm ? requestConfirm(action.next, action.label) : onUpdate(order.id, action.next)} 
          className={mobileBtnClass}
          icon={<action.icon className="w-5 h-5 md:w-4 md:h-4" />}
        >
          {action.label}
        </Button>
      )
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl border border-gray-100">
       <Info className="w-4 h-4 text-muted" />
       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Awaiting Action</span>
    </div>
  )
}

function OrderListRow({ order, index, userRole, onUpdate, showToast, isLoading, isSelected, onSelect, requestConfirm }: any) {
   const delivery = getRelativeDelivery(order.delivery_date)
   return (
     <div className={cn(
       "group card-premium p-4 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 transition-all hover:bg-surface-muted/30",
       isSelected && "bg-primary-tint border-primary/20 ring-1 ring-primary/10"
     )}>
        {/* Top row: checkbox + info + mobile badge */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
           <Button 
             variant="icon" 
             size="icon" 
             aria-label={isSelected ? `Deselect ${order.po_number}` : `Select ${order.po_number}`}
             onClick={(e: any) => { e.stopPropagation(); onSelect(); }} 
             className={cn(
               "flex-shrink-0 w-10 h-10 md:w-6 md:h-6 rounded-xl md:rounded-lg border transition-all",
               isSelected ? "bg-primary text-white border-primary shadow-sm shadow-primary/20" : "bg-surface-muted text-muted border-border hover:border-primary/40"
             )}
             icon={isSelected ? <CheckSquare className="w-5 h-5 md:w-4 md:h-4" /> : <Square className="w-5 h-5 md:w-4 md:h-4 opacity-40" />}
           />
           <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">{order.po_number}</span>
              <span className="text-sm font-bold text-foreground truncate">{order.customer_name}</span>
           </div>
           {/* Mobile-only: inline badge */}
           <div className="md:hidden flex items-center gap-2 flex-shrink-0">
              <span className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide border border-transparent shadow-sm",
                statusBadgeMap[order.status] || "bg-surface-muted text-muted"
              )}>
                {statusLabels[order.status] || order.status}
              </span>
              {delivery && delivery.urgency !== 'none' && (
                <span className={cn("text-[9px] font-black", delivery.class)}>
                  {delivery.text}
                </span>
              )}
           </div>
        </div>

        {/* Phase progress — hidden on mobile to reduce clutter */}
        <div className="hidden md:flex flex-1 items-center justify-center max-w-md">
           <PhaseProgress status={order.status} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 md:gap-6">
           <div className="hidden lg:block">
              <span className={cn(
                "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-transparent shadow-sm",
                statusBadgeMap[order.status] || "bg-surface-muted text-muted"
              )}>
                 {statusLabels[order.status] || order.status}
              </span>
           </div>
           <div className="w-full md:w-56">
              {renderActionButtons(order, userRole, onUpdate, isLoading, requestConfirm)}
           </div>
        </div>
     </div>
   )
}
