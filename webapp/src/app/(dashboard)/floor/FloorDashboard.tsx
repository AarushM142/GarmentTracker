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
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-success">Live Floor Tracking</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
            Production Control
          </h2>
          <p className="text-secondary font-medium mt-1">Real-time tracking for {userRole.replace('_', ' ')}</p>
        </div>
        
        <div className="flex items-center gap-4">
           <Button variant="secondary" onClick={selectAll} className="h-12" icon={<CheckSquare className="w-4 h-4" />}>
              {selectedVisibleIds.length === filteredOrders.length && filteredOrders.length > 0 ? 'Deselect All' : 'Select All'}
           </Button>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────── */}
      <div className="card-premium p-1 border border-border bg-background">
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
        <div className="p-4 rounded-2xl bg-destructive-tint border border-destructive/20 flex items-center gap-4 animate-fade-in">
           <div className="w-10 h-10 rounded-xl bg-destructive text-primary-foreground flex items-center justify-center shadow-lg shadow-destructive/20">
              <AlertCircle className="w-6 h-6" />
           </div>
           <p className="text-sm font-bold text-foreground">
             Attention: {filteredOrders.filter(o => getUrgency(o.delivery_date) === 'overdue').length} orders are overdue. Prioritize these on the floor immediately.
           </p>
        </div>
      )}

      {/* ── Content Grid ──────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div className="card-premium p-20 text-center border border-border shadow-sm">
          <div className="w-20 h-20 rounded-[2.5rem] bg-surface-muted mx-auto mb-6 flex items-center justify-center text-muted shadow-inner">
            <Timer className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No active orders in your queue</h3>
          <p className="text-muted mt-2 max-w-xs mx-auto">New production tasks will appear here as they are issued from store or planning.</p>
        </div>
      ) : (
        <div className={viewMode === 'cards' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start" : "space-y-4"}>
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
      <div className="fixed bottom-[100px] md:bottom-8 left-1/2 -translate-x-1/2 glass px-4 md:px-8 py-3 md:py-4 rounded-3xl shadow-2xl border border-primary/20 z-50 flex items-center gap-4 md:gap-8 animate-fade-up w-[90%] md:w-auto overflow-x-auto">
         <div className="flex flex-col flex-shrink-0">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Selection</span>
            <span className="text-sm font-bold text-foreground">{selectedIds.length} Order{selectedIds.length === 1 ? '' : 's'}</span>
         </div>
         <div className="h-8 w-px bg-border/50 flex-shrink-0" />

         <div className="flex gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              icon={<Zap className="w-4 h-4" />}
              onClick={handleBatchAutoIssue}
              loading={loadingId === 'batch-issue'}
              disabled={loadingId !== null || !hasAutoIssueEligibleSelection}
              title={!hasAutoIssueEligibleSelection ? 'Select planning-stage orders to auto-issue materials' : undefined}
            >
               Auto-Issue
            </Button>
            <Button 
              size="sm" 
              onClick={handleBatchNextStage} 
              loading={loadingId === 'batch'}
              disabled={loadingId !== null || !hasNextStageEligibleSelection}
              title={!hasNextStageEligibleSelection ? 'Selected orders do not have an available next stage' : undefined}
            >
               Move to Next Stage
            </Button>
            <Button variant="icon" size="icon" aria-label="Clear selected orders" onClick={() => setSelectedIds([])} icon={<XCircle className="w-6 h-6" />} />
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
        return // Stop if quantity update fails (optional, depends on preference)
      }
    }

    await onUpdate(order.id, confirmModal.nextStatus)
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
    {confirmModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setConfirmModal(null)}>
        <div className="bg-surface border border-border rounded-[2.5rem] shadow-2xl p-8 w-full max-w-sm mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-bold text-foreground mb-1">{confirmModal.label}</h3>
          <p className="text-sm text-muted mb-8 font-medium">Record actual piece count for production yield tracking.</p>
          
          <div className="space-y-6 mb-8">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-3 text-center">Actual Pieces Completed</label>
              <input
                type="number"
                min={0}
                value={piecesInput}
                onChange={e => setPiecesInput(e.target.value)}
                className="w-full bg-surface-muted/30 border border-border/60 rounded-3xl px-6 py-6 text-4xl font-bold text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-center tabular-nums"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-center gap-6 px-4 py-4 rounded-2xl bg-surface-muted/20 border border-border/40">
               <div className="text-center">
                  <p className="text-[9px] font-bold text-muted uppercase">Expected</p>
                  <p className="text-lg font-bold text-foreground">{confirmModal.expectedQty}</p>
               </div>
               <div className="w-px h-8 bg-border/50" />
               <div className="text-center">
                  <p className="text-[9px] font-bold text-muted uppercase">Yield Loss</p>
                  <p className={`text-lg font-bold ${parseInt(piecesInput) < confirmModal.expectedQty ? 'text-destructive' : 'text-success'}`}>
                    {confirmModal.expectedQty - (parseInt(piecesInput) || 0)}
                  </p>
               </div>
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-2">Production Notes (Optional)</label>
              <textarea
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="e.g. Minor yield loss due to fabric defect..."
                className="w-full bg-surface-muted/30 border border-border/60 rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setConfirmModal(null)} className="flex-1">Cancel</Button>
            <Button onClick={submitConfirm} className="flex-1">Confirm & Next</Button>
          </div>
        </div>
      </div>
    )}

    <div className={`group relative card-premium p-8 flex flex-col animate-fade-up bg-surface ${delivery?.urgency === 'red' ? 'urgency-red bg-destructive-tint/10' : delivery?.urgency === 'amber' ? 'urgency-amber bg-warning-tint/10' : ''}`}>
      <Button 
        variant="icon"
        size="icon"
        aria-label={isSelected ? `Deselect ${order.po_number}` : `Select ${order.po_number}`}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`absolute top-4 right-4 transition-all ${isSelected ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-surface-muted text-muted'}`}
        icon={isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
      />

      <div className="flex justify-between items-start mb-6 pr-8">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-2 block">
            {order.po_number}
          </span>
          <h4 className="text-xl font-bold text-foreground truncate max-w-[200px] tracking-tight">{order.customer_name}</h4>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
         <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border border-transparent ${statusBadgeMap[order.status] || 'bg-surface-muted text-muted'}`}>
            {statusLabels[order.status] || order.status}
         </div>
         {delivery && delivery.urgency !== 'none' && (
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border bg-surface ${delivery.class} border-border`}>
              {delivery.text}
            </span>
         )}
      </div>

      <div className="flex-1 mb-8">
        <div 
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${order.po_number}`}
          className="cursor-pointer hover:bg-surface-muted/50 p-4 -mx-4 rounded-2xl transition-all border border-transparent hover:border-border/40 focus:outline-none focus:ring-4 focus:ring-primary/10" 
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
              <span>{order.sku_list?.length || 0} Products</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{totalExpectedQty} Pcs Total</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          
          {isExpanded && (
            <div className="mt-6 space-y-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">SKU Details</h5>
                {loadingBom && (
                  <p className="text-xs text-muted font-bold">Loading BOM...</p>
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
                          <span className="text-[8px] uppercase text-muted font-bold">{size}</span>
                          <span className="text-xs font-bold text-foreground">{sku.sizes?.[size] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {bom && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">BOM Breakdown</h5>
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
    <div className="space-y-3">
      <div className="flex justify-between relative">
        <div className="absolute left-[12px] right-[12px] top-1.5 h-[2px] bg-surface-muted z-0" />
        <div 
          className="absolute left-[12px] top-1.5 h-[2px] bg-primary z-0 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1)" 
          style={{ width: `calc(${Math.max(0, (activeIndex / (phases.length - 1)) * 100)}% - 24px)` }} 
        />
        {phases.map((phase, idx) => {
          const isActive = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          return (
            <div key={phase.label} className="relative z-10">
              <div className={`w-3.5 h-3.5 rounded-full border-[3px] transition-all duration-700 ${isActive ? 'border-primary bg-primary' : 'border-surface-muted bg-surface'} ${isCurrent ? 'ring-4 ring-primary/20 scale-125' : ''}`} />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[9px] font-bold uppercase text-muted tracking-widest px-0.5">
        {phases.map((phase, idx) => (
          <span key={phase.label} className={idx <= activeIndex ? 'text-primary' : 'opacity-40'}>{phase.label}</span>
        ))}
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
    <Button disabled className="w-full h-12 bg-surface-muted text-muted font-bold animate-shimmer">
      Processing Workflow...
    </Button>
  )

  const isStore = role === 'store_manager' || role === 'super_admin'
  const isCutter = role === 'cutting_master' || role === 'super_admin'
  const isSuper = role === 'production_supervisor' || role === 'super_admin'

  if (isStore) {
    if (order.status === 'in_production') {
      return (
        <Button onClick={() => onUpdate(order.id, 'material_released')} className="w-full h-12" icon={<Layers className="w-4 h-4" />}>
           Issue Materials to Floor
        </Button>
      )
    }
  }

  if (isCutter) {
    if (order.status === 'material_released') {
      return (
        <Button onClick={() => onUpdate(order.id, 'cutting')} className="w-full h-12" icon={<Scissors className="w-4 h-4" />}>
           Initialize Cutting
        </Button>
      )
    }
    if (order.status === 'cutting') {
      return (
        <Button onClick={() => requestConfirm('fusing', 'Finalize Cutting')} className="w-full h-12" icon={<CheckCircle2 className="w-4 h-4" />}>
           Complete Cutting Stage
        </Button>
      )
    }
  }

  if (isSuper) {
    if (order.status === 'qc') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => onUpdate(order.id, 'packing')} icon={<ClipboardCheck className="w-4 h-4" />} className="bg-success hover:bg-success/90 shadow-success/10">
            Pass QC
          </Button>
          <Button onClick={() => onUpdate(order.id, 'rework')} variant="destructive" icon={<AlertCircle className="w-4 h-4" />}>
            Fail QC
          </Button>
        </div>
      )
    }

    const stageMap: Record<string, { label: string, next: string, icon: any, confirm?: boolean }> = {
      'fusing': { label: 'Complete Fusing', next: 'stitching', icon: CheckCircle, confirm: true },
      'stitching': { label: 'Complete Stitching', next: 'kaj_buttoning', icon: CheckCircle, confirm: true },
      'kaj_buttoning': { label: 'Complete Kaj & Button', next: 'finishing_ironing', icon: CheckCircle, confirm: true },
      'finishing_ironing': { label: 'Complete Finishing', next: 'qc', icon: CheckCircle, confirm: true },
    }

    const action = stageMap[order.status]
    if (action) {
      return (
        <Button 
          onClick={() => action.confirm ? requestConfirm(action.next, action.label) : onUpdate(order.id, action.next)} 
          className="w-full h-12"
          icon={<action.icon className="w-4 h-4" />}
        >
          {action.label}
        </Button>
      )
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 py-2 text-muted">
       <Info className="w-4 h-4" />
       <span className="text-xs font-bold uppercase tracking-widest">Awaiting Stage Transition</span>
    </div>
  )
}

function OrderListRow({ order, index, userRole, onUpdate, showToast, isLoading, isSelected, onSelect, requestConfirm }: any) {
   return (
     <div className={`group card-premium p-4 flex items-center justify-between gap-6 transition-all hover:bg-surface-muted/30 ${isSelected ? 'bg-primary-tint border-primary/20' : ''}`}>
        <div className="flex items-center gap-4">
           <Button 
             variant="icon" 
             size="icon" 
             aria-label={isSelected ? `Deselect ${order.po_number}` : `Select ${order.po_number}`}
             onClick={(e: any) => { e.stopPropagation(); onSelect(); }} 
             className={`w-6 h-6 rounded-lg border transition-all ${isSelected ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-surface-muted text-muted border-border hover:border-primary/40'}`}
             icon={isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-40" />}
           />
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">{order.po_number}</span>
              <span className="text-sm font-bold text-foreground truncate max-w-[120px]">{order.customer_name}</span>
           </div>
        </div>
        <div className="flex-1 flex items-center justify-center max-w-md">
           <PhaseProgress status={order.status} />
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden lg:block">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-transparent shadow-sm ${statusBadgeMap[order.status] || 'bg-surface-muted text-muted'}`}>
                 {statusLabels[order.status] || order.status}
              </span>
           </div>
           <div className="w-56">
              {renderActionButtons(order, userRole, onUpdate, isLoading, requestConfirm)}
           </div>
        </div>
     </div>
   )
}
