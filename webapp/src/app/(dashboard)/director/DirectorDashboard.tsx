'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { approvePurchaseRequest, resolveRiskFlag, assignRiskFlag } from './actions'
import { 
  BarChart3, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, IndianRupee,
  Inbox, XCircle,
  AlertCircle, ArrowDownRight, Zap,
  Settings, Activity,
  ChevronRight, Info, Banknote, BoxIcon, Layers
} from 'lucide-react'
import { Sparkline } from '@/components/Sparkline'
import { Button } from '@/components/ui/button'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/Tooltip"
import { cn } from '@/lib/utils'

interface RecentOrder {
  id: string
  po_number: string
  customer_name: string
  status: string
  updated_at: string
}

interface PendingPR {
  id: string
  quantity_required: number
  status: string
  created_at: string
  material_name: string
}

type Stats = {
  activeOrders: number
  totalValue: number
  totalAdvance: number
  bottlenecks: number
  stageCounts: Record<string, number>
  recentOrders: RecentOrder[]
  pendingPRs: PendingPR[]
}

type AnalyticsModal =
  | { type: 'payment-gap'; title: string }
  | { type: 'bottlenecks'; title: string }

const STAGE_LABELS: Record<string, string> = {
  draft: 'Planning',
  in_production: 'Ready',
  material_released: 'Issued',
  cutting: 'Cutting',
  fusing: 'Fusing',
  stitching: 'Stitching',
  kaj_buttoning: 'Kaj/Btn',
  finishing_ironing: 'Finishing',
  qc: 'In QC',
  rework: 'Rework',
  packing: 'Packing',
  dispatched: 'Transit'
}

export function DirectorDashboard({ stats }: { stats: Stats }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [notifications, setNotifications] = useState<{id: string, msg: string}[]>([])
  
  // Prototype States
  const [localPendingPRs, setLocalPendingPRs] = useState(stats.pendingPRs)
  const [riskModal, setRiskModal] = useState<{ isOpen: boolean, title: string, type?: 'resolve' | 'assign' | 'matrix', id?: string } | null>(null)
  const [analyticsModal, setAnalyticsModal] = useState<AnalyticsModal | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const notificationCounter = useRef(0)
  const [pipelineView, setPipelineView] = useState<'units' | 'health'>('units')
  const [risks, setRisks] = useState([
    { id: 'PO-2024-112', severity: 'red', title: 'PO-2024-112 Delayed', desc: 'Stuck in Fusing for 48h+. Likely machinery failure on Line 4.', impact: 'DELIVERY RISK', icon: Clock },
    { id: 'MAT-2024-115', severity: 'amber', title: 'Material Shortage', desc: '240m Cotton Canvas short for PO-2024-115. Scheduled: Tomorrow.', impact: 'HALT RISK', icon: IndianRupee },
  ])

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const addNotification = (msg: string) => {
    notificationCounter.current += 1
    const id = `notification-${notificationCounter.current}`
    setNotifications(prev => [...prev, { id, msg }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  const handleResolveRisk = (id: string, title: string) => {
    setRiskModal({ isOpen: true, title, type: 'resolve', id })
  }

  const handleAssignRisk = (id: string, title: string) => {
    setRiskModal({ isOpen: true, title, type: 'assign', id })
  }

  const confirmResolve = async (id: string) => {
    setLoadingId(`resolve-${id}`)
    try {
      const result = await resolveRiskFlag(id)
      if (result.error) {
        addNotification(`Error: ${result.error}`)
        return
      }
      setRisks(prev => prev.filter(r => r.id !== id))
      addNotification(`Risk ${id} resolved and archived.`)
      router.refresh()
    } catch {
      addNotification('Failed to resolve risk. Try again.')
    } finally {
      setLoadingId(null)
      setRiskModal(null)
    }
  }

  const handleAssignConfirm = async (id: string) => {
    setLoadingId(`assign-${id}`)
    try {
      const result = await assignRiskFlag(id)
      if (result.error) {
        addNotification(`Error: ${result.error}`)
        return
      }
      addNotification('Task delegated and logged.')
      router.refresh()
    } catch {
      addNotification('Failed to delegate. Try again.')
    } finally {
      setLoadingId(null)
      setRiskModal(null)
    }
  }

  const handleApprove = async (id: string, action: 'approve' | 'reject', itemName: string) => {
    setLoadingId(id)
    try {
      const result = await approvePurchaseRequest(id, action)
      if (result.error) {
        addNotification(`Error: ${result.error}`)
        return
      }
      setLocalPendingPRs(prev => prev.filter(pr => pr.id !== id))
      addNotification(`${itemName} ${action === 'approve' ? 'Authorized' : 'Rejected'}`)
      router.refresh()
    } catch {
      addNotification('Request failed. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  const outstanding = stats.totalValue - stats.totalAdvance
  const collectionRate = stats.totalValue > 0 ? (stats.totalAdvance / stats.totalValue) * 100 : 0

  return (
    <TooltipProvider>
      {/* ── Toast Notification System (Bottom Center) ──────────── */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-3 pointer-events-none">
         {notifications.map(n => (
           <div key={n.id} className="bg-[#1a1a1a] text-white px-8 py-4 rounded-full shadow-2xl border border-white/10 flex items-center gap-4 animate-fade-up pointer-events-auto">
              <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                 <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <span className="text-sm font-bold tracking-tight">{n.msg}</span>
           </div>
         ))}
      </div>

      {/* ── Risk Management Modal ── */}
      {riskModal?.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/35 animate-fade-in p-4" onClick={() => setRiskModal(null)}>
           <div className="w-full max-w-lg p-8 shadow-2xl animate-scale-in bg-white border border-gray-100 rounded-xl" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-8">
                 <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#1a1a1a] mb-1">{riskModal.type === 'resolve' ? 'Resolve Intelligence Alert' : riskModal.type === 'assign' ? 'Assign Accountability' : 'Risk Assessment Matrix'}</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Subject: {riskModal.title}</p>
              
              <div className="p-6 rounded-lg bg-[#f7f7f5]/80 border border-gray-100 mb-10">
                 <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {riskModal.type === 'resolve' 
                      ? "Confirming resolution will archive this alert and log the executive intervention in the audit trail. This cannot be undone."
                      : riskModal.type === 'assign'
                        ? "Select a department head to delegate this risk. A high-priority notification will be sent to their workstation immediately."
                        : "Escalating this bottleneck to the Production Head. This action will be logged in the immutable audit trail."
                    }
                 </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setRiskModal(null)} variant="secondary" className="flex-1 h-12 rounded-lg">Cancel</Button>
                {riskModal.type === 'resolve' ? (
                   <Button 
                     onClick={() => confirmResolve(riskModal.id!)} 
                     loading={loadingId === `resolve-${riskModal.id}`}
                     className="flex-1 h-12 bg-success text-white rounded-lg shadow-md shadow-success/20"
                   >Confirm Resolution</Button>
                 ) : (
                   <Button 
                     onClick={() => riskModal.type === 'assign' ? handleAssignConfirm(riskModal.id!) : (addNotification('Escalation Logged'), setRiskModal(null))} 
                     loading={loadingId === `assign-${riskModal.id}`}
                     className="flex-1 h-12 bg-[#2F3E34] text-white rounded-lg shadow-md shadow-primary/20"
                   >
                     {riskModal.type === 'assign' ? 'Delegate Task' : 'Escalate Now'}
                   </Button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* ── System Health Modal ── */}
      {showHealthModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 animate-fade-in p-4" onClick={() => setShowHealthModal(false)}>
           <div className="w-full max-w-lg p-8 shadow-2xl animate-scale-in bg-white border border-gray-100 rounded-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                       <Activity className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-[#1a1a1a]">System Health</h3>
                       <p className="text-xs text-gray-400 font-medium mt-1">Live telemetry from factory floor servers.</p>
                    </div>
                 </div>
                 <Button variant="secondary" size="icon" aria-label="Close system health" onClick={() => setShowHealthModal(false)}>
                    <XCircle className="w-5 h-5" />
                 </Button>
              </div>
              
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">API Latency</p>
                       <p className="text-xl font-bold text-[#1a1a1a]">42ms</p>
                       <div className="h-1 w-full bg-gray-200 mt-3 rounded-full overflow-hidden"><div className="h-full bg-success w-[88%]" /></div>
                    </div>
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Database</p>
                       <p className="text-xl font-bold text-success">Synced</p>
                       <div className="h-1 w-full bg-gray-200 mt-3 rounded-full overflow-hidden"><div className="h-full bg-success w-[100%]" /></div>
                    </div>
                 </div>
                 <div className="p-6 rounded-xl border border-primary/10 bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <Settings className="w-5 h-5 text-primary animate-spin-slow" />
                       <span className="text-sm font-bold text-[#1a1a1a]">Autopilot Stability: 99.8%</span>
                    </div>
                 </div>
              </div>

              <Button onClick={() => setShowHealthModal(false)} className="w-full mt-10 h-12 bg-primary text-white rounded-lg">
                Close Diagnostics
              </Button>
           </div>
        </div>
      )}

      {/* ── KPI Analysis Modal ── */}
      {analyticsModal && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/35 animate-fade-in p-4" onClick={() => setAnalyticsModal(null)}>
          <div className="w-full max-w-xl p-8 shadow-2xl animate-scale-in bg-white border border-gray-100 rounded-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-8 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                  {analyticsModal.type === 'payment-gap' ? 'Receivables Analysis' : 'Production Analysis'}
                </p>
                <h3 className="text-2xl font-bold text-[#1a1a1a]">{analyticsModal.title}</h3>
                <p className="text-xs text-gray-400 font-medium mt-2">
                  {analyticsModal.type === 'payment-gap'
                    ? 'Outstanding collection exposure based on current order value and advances.'
                    : 'Current bottleneck count from live production stage data.'}
                </p>
              </div>
              <Button variant="secondary" size="icon" aria-label="Close analysis" onClick={() => setAnalyticsModal(null)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            {analyticsModal.type === 'payment-gap' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <MetricTile label="Projected" value={`₹${(stats.totalValue / 100000).toFixed(1)}L`} />
                  <MetricTile label="Collected" value={`₹${(stats.totalAdvance / 100000).toFixed(1)}L`} />
                  <MetricTile label="Gap" value={`₹${(outstanding / 100000).toFixed(1)}L`} tone="risk" />
                </div>
                <div className="p-5 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                    <span>Collection Rate</span>
                    <span>{Math.round(collectionRate)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white border border-gray-100 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, collectionRate)}%` }} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1 h-11 rounded-lg" onClick={() => setAnalyticsModal(null)}>Close</Button>
                  <Button className="flex-1 h-11 rounded-lg bg-[#2F3E34] text-white" onClick={() => { window.location.href = '/accounts' }}>
                    Review Receivables
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <MetricTile label="Bottlenecks" value={stats.bottlenecks.toString()} tone={stats.bottlenecks > 5 ? 'risk' : 'normal'} />
                  <MetricTile label="Active Orders" value={stats.activeOrders.toString()} />
                </div>
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  {Object.entries(stats.stageCounts).slice(0, 6).map(([stage, count]) => (
                    <div key={stage} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0 border-gray-100">
                      <span className="text-xs font-bold text-gray-500">{STAGE_LABELS[stage] || stage}</span>
                      <span className="text-sm font-black text-[#1a1a1a] tabular-nums">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full h-11 rounded-lg bg-[#2F3E34] text-white" onClick={() => setAnalyticsModal(null)}>
                  Close Analysis
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-8 animate-fade-up">
        {/* ── Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4 px-4 lg:px-16">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-success/80">Live Operations Dashboard</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-[#1a1a1a] mb-1">Command Center</h2>
            <p className="text-gray-400 font-medium text-xs">Operational intelligence & executive authorizations.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-white px-6 py-2 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Load Factor</p>
                <div className="flex items-center gap-3">
                   <p className="text-sm font-bold text-[#1a1a1a]">14 Lines · 82%</p>
                   <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                </div>
             </div>
             <Button 
               variant="primary" 
               onClick={() => setShowHealthModal(true)}
               icon={<Zap className="w-4 h-4" />}
               className="h-12 px-6 rounded-xl bg-[#2F3E34] hover:bg-[#1a1a1a] shadow-md shadow-primary/15 text-white focus-visible:ring-4 focus-visible:ring-primary/20"
             >
               System Health
             </Button>
          </div>
        </div>

        {/* ── Urgency Strip ── */}
        <div className="flex items-center justify-between gap-6 px-4 lg:px-16">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide flex-1">
             <button type="button" onClick={() => addNotification("Analyzing Delayed Orders...")} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/5 text-destructive border border-destructive/10 text-[9px] font-black uppercase tracking-widest hover:bg-destructive/10 hover:border-destructive/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-destructive/10 transition-all">
                <div className="w-1 h-1 rounded-full bg-destructive animate-pulse" />
                2 Orders Delayed
             </button>
             <button type="button" onClick={() => addNotification("Reviewing Material Shortages...")} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/5 text-warning border border-warning/10 text-[9px] font-black uppercase tracking-widest hover:bg-warning/10 hover:border-warning/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning/10 transition-all">
                <AlertTriangle className="w-3 h-3" /> Material Risk
             </button>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2 bg-white px-4 py-1.5 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-400 tabular-nums">
             <Clock className="w-3 h-3 text-primary" /> {currentTime ? currentTime.toLocaleTimeString('en-GB', { hour12: false }) : '--:--:--'}
          </div>
        </div>

        {/* ── KPI Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 lg:px-16">
          <KPICard 
            label="Active Orders" value={stats.activeOrders.toString()} 
            icon={TrendingUp} trend="+8.2%" trendDir="up" context="₹0.1L projected"
            sparkData={[30, 45, 32, 50, 48, 62, 58]} color="primary" tooltip="Current lots active."
          />
          <KPICard 
            label="Revenue Projection" value={`₹${(stats.totalValue / 100000).toFixed(1)}L`} 
            icon={Banknote} trend="+12.4%" trendDir="up" context="₹20K above target"
            sparkData={[20, 25, 45, 30, 55, 70, 85]} color="secondary" tooltip="Total potential revenue."
          />
          <KPICard 
            label="Payment Gap" value={`₹${(outstanding / 100000).toFixed(1)}L`} 
            icon={BarChart3} trend="-2.1%" trendDir="down" context="High Priority"
            sparkData={[80, 75, 70, 72, 65, 60, 55]} color="accent" priority="red-tint" tooltip="Outstanding balance."
            onClick={() => setAnalyticsModal({ type: 'payment-gap', title: 'Payment Gap' })}
          />
          <KPICard 
            label="Floor Bottlenecks" value={stats.bottlenecks.toString()} 
            icon={AlertTriangle} trend={stats.bottlenecks > 5 ? "Critical" : "Stable"} trendDir={stats.bottlenecks > 5 ? "up" : "down"}
            context={stats.bottlenecks > 5 ? "Action Required" : "Within limits"}
            sparkData={[2, 4, 3, 5, 8, 4, 3]} color={stats.bottlenecks > 5 ? "destructive" : "muted"} priority={stats.bottlenecks > 5 ? "red" : "none"} tooltip="Production delays."
            onClick={() => setAnalyticsModal({ type: 'bottlenecks', title: 'Floor Bottlenecks' })}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 lg:px-16">
          {/* ── Left: Risks & Pipeline ── */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Intelligence: Critical Risks (Horizontal List Refactor) */}
            <section className="p-8 bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-destructive">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-bold text-[#1a1a1a] text-lg flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive" /> Intelligence: Critical Risks
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-300 cursor-help hover:text-primary transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-[10px] font-bold">AI-driven bottleneck detection & predictive risk analysis.</p>
                        </TooltipContent>
                      </Tooltip>
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium mt-1">High-priority items requiring executive attention.</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setRiskModal({ isOpen: true, title: "Global Assessment Matrix", type: 'matrix' })} className="h-9 rounded-lg border-primary/15 bg-primary/5 px-4 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 hover:border-primary/25">Full Matrix</Button>
              </div>

              <div className="space-y-3">
                 {risks.length === 0 ? (
                   <div className="p-10 text-center border-2 border-dashed border-gray-100 rounded-lg">
                      <CheckCircle2 className="w-10 h-10 text-success mx-auto opacity-20 mb-4" />
                      <p className="text-xs text-gray-400 font-medium">No critical risks requiring intervention.</p>
                   </div>
                  ) : risks.map(risk => (
                    <RiskItem 
                      key={risk.id}
                      id={risk.id}
                      severity={risk.severity} 
                      title={risk.title} 
                      desc={risk.desc} 
                      impact={risk.impact}
                      icon={risk.icon}
                      onResolve={() => handleResolveRisk(risk.id, risk.title)}
                      onAssign={() => handleAssignRisk(risk.id, risk.title)}
                    />
                  ))}
              </div>
            </section>

            {/* Production Pulse (Pipeline Refactor) */}
            <div className="p-8 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="font-bold text-[#1a1a1a] text-lg flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" /> Production Pipeline
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium mt-1">Real-time throughput across manufacturing stages.</p>
                </div>
                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                   <button 
                     onClick={() => setPipelineView('units')}
                     className={cn(
                       "px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
                       pipelineView === 'units' ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-gray-600"
                     )}
                   >
                     Units
                   </button>
                   <button 
                     onClick={() => setPipelineView('health')}
                     className={cn(
                       "px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
                       pipelineView === 'health' ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-gray-600"
                     )}
                   >
                     Health
                   </button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {Object.entries(stats.stageCounts).slice(0, 6).map(([stage, count], idx, arr) => (
                  <div key={stage} className="flex items-center flex-1 min-w-[140px]">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest truncate">{STAGE_LABELS[stage] || stage}</span>
                        <span className={cn(
                          "text-xs font-bold tabular-nums transition-all",
                          pipelineView === 'health' ? (count > 50 ? "text-success" : "text-warning") : "text-primary"
                        )}>
                          {pipelineView === 'units' ? count.toLocaleString() : (count > 50 ? "Optimal" : "Delayed")}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                        <div 
                          className="h-full bg-primary transition-all duration-1000" 
                          style={{ width: `${Math.min(100, (count / (stats.activeOrders || 1)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                    {idx < arr.length - 1 && <ChevronRight className="w-4 h-4 text-gray-200 mx-3 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Efficiency ── */}
          <div className="lg:col-span-4">
             <div className="p-8 bg-white rounded-xl border border-gray-100 shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-bold text-[#1a1a1a] text-lg flex items-center gap-3">
                     <TrendingUp className="w-5 h-5 text-primary" /> Capital Efficiency
                   </h3>
                   <Tooltip>
                      <TooltipTrigger asChild>
                         <Info className="w-4 h-4 text-gray-300 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-white border shadow-xl rounded-lg p-4 max-w-xs">
                        <p className="text-[10px] font-black uppercase text-primary mb-1">Efficiency Metrics</p>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">Conversion of WIP to cash realization.</p>
                      </TooltipContent>
                   </Tooltip>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center py-10">
                   <div className="relative w-48 h-48 mb-10">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="80" fill="transparent" stroke="#f9fafb" strokeWidth="12" />
                        <circle 
                          cx="96" cy="96" r="80" fill="transparent" stroke="var(--primary)" strokeWidth="12" 
                          strokeDasharray={502} strokeDashoffset={502 - (502 * collectionRate) / 100} 
                          strokeLinecap="round" className="transition-all duration-[1500ms]" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-black text-[#1a1a1a] tracking-tighter">{Math.round(collectionRate)}%</span>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">Realized</span>
                      </div>
                   </div>
                   
                   <div className="w-full space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Collected</span>
                         <span className="text-sm font-black text-[#1a1a1a]">₹{(stats.totalAdvance / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Projected</span>
                         <span className="text-sm font-black text-[#1a1a1a]">₹{(stats.totalValue / 100000).toFixed(1)}L</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* ── Approval Inbox ── */}
        <div className="px-4 lg:px-16 mb-20">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-10 h-10 rounded-lg bg-[#2F3E34] text-white flex items-center justify-center">
                   <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a1a] text-lg">Approval Inbox</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Authorizations for materials & resources.</p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-md bg-destructive text-white text-[9px] font-black uppercase tracking-widest animate-pulse">
                {localPendingPRs.length} URGENT
              </span>
            </div>
            
            <div className="divide-y divide-gray-50">
              {localPendingPRs.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto opacity-20" />
                  <p className="text-xs text-gray-400 font-medium">All clear. No pending approvals.</p>
                </div>
              ) : localPendingPRs.map((pr, idx) => (
                <div key={pr.id} className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:bg-gray-50/50 transition-all">
                  <div className="flex items-center gap-8">
                     <div className="w-14 h-14 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-300">
                        <BoxIcon className="w-7 h-7" />
                     </div>
                     <div className="space-y-1">
                        <div className="flex items-center gap-3">
                           <span className="text-[9px] font-black text-primary uppercase tracking-widest">Procurement</span>
                           <span className="text-[9px] font-bold text-gray-300">ID: {pr.id.slice(0, 8)}</span>
                        </div>
                        <h4 className="text-lg font-bold text-[#1a1a1a]">{pr.material_name}</h4>
                        <div className="flex gap-6 text-[11px] font-bold text-gray-400">
                           <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {idx === 0 ? "2h" : "5h"} ago</span>
                           <span className="flex items-center gap-2 text-[#1a1a1a]"><Activity className="w-3.5 h-3.5 text-primary" /> Qty: {pr.quantity_required}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => handleApprove(pr.id, 'reject', pr.material_name)} loading={loadingId === pr.id} className="px-6 h-10 rounded-lg text-xs font-bold hover:border-destructive/25 hover:bg-destructive/5 hover:text-destructive">Reject</Button>
                    <Button onClick={() => handleApprove(pr.id, 'approve', pr.material_name)} loading={loadingId === pr.id} className="px-6 h-10 rounded-lg bg-primary text-white text-xs font-bold shadow-md shadow-primary/15">Authorize</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* ── Active Production Orders ── */}
        <ProductionOrderList />
      </div>
    </TooltipProvider>
  )
}

function ProductionOrderList() {
  const stages = ['PLAN', 'MAT', 'CUT', 'STITCH', 'QC', 'PACK'];
  
  const [orders, setOrders] = useState([
    { id: 1, title: 'Winter Collection 2026', currentStageIndex: 2 },
    { id: 2, title: 'Acme Corp Uniforms', currentStageIndex: 0 },
    { id: 3, title: 'Global Retail Basics', currentStageIndex: 4 }
  ]);

  const advanceStage = (orderId: number) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId && order.currentStageIndex < stages.length - 1) {
        return { ...order, currentStageIndex: order.currentStageIndex + 1 };
      }
      return order;
    }));
  };

  const getStageName = (index: number) => {
    const stageMap: Record<string, string> = {
      'PLAN': 'Planning',
      'MAT': 'Materials',
      'CUT': 'Cutting',
      'STITCH': 'Stitching',
      'QC': 'Quality Control',
      'PACK': 'Packing'
    };
    return stageMap[stages[index]] || stages[index];
  };

  return (
    <div className="px-4 lg:px-16 mb-20">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-lg bg-[#2F3E34] text-white flex items-center justify-center">
               <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1a1a1a] text-lg">Active Production Orders</h3>
              <p className="text-[11px] text-gray-400 font-medium">Track and advance manufacturing stages interactively.</p>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-50">
          {orders.map(order => {
            const isCompleted = order.currentStageIndex >= stages.length - 1;
            
            return (
              <div key={order.id} className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-12 hover:bg-gray-50/50 transition-all">
                <div className="flex-1 space-y-8">
                  <div className="flex items-center gap-4">
                    <h4 className="text-xl font-bold text-[#1a1a1a]">{order.title}</h4>
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                      IN {getStageName(order.currentStageIndex).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Stepper UI */}
                  <div className="flex items-center w-full max-w-2xl pt-2 pb-6">
                    {stages.map((stage, idx) => {
                      const isPast = idx < order.currentStageIndex;
                      const isCurrent = idx === order.currentStageIndex;
                      const isFuture = idx > order.currentStageIndex;
                      
                      return (
                        <div key={stage} className="flex items-center flex-1 last:flex-none">
                          <div className="relative flex flex-col items-center justify-center">
                            <div className="relative flex items-center justify-center w-6 h-6">
                               {isPast && (
                                 <div className="w-4 h-4 rounded-full bg-primary z-10 shadow-sm" />
                               )}
                               {isCurrent && (
                                 <>
                                   <div className="absolute w-8 h-8 rounded-full bg-primary/20 animate-pulse" />
                                   <div className="w-4 h-4 rounded-full bg-primary z-10 shadow-md" />
                                 </>
                               )}
                               {isFuture && (
                                 <div className="w-4 h-4 rounded-full border-2 border-gray-200 bg-white z-10" />
                               )}
                            </div>
                            
                            <span className={cn(
                              "absolute top-8 text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap",
                              (isPast || isCurrent) ? "text-[#1a1a1a]" : "text-gray-300"
                            )}>
                              {stage}
                            </span>
                          </div>
                          
                          {idx < stages.length - 1 && (
                            <div className={cn(
                              "flex-1 h-1 mx-2 rounded-full",
                              isPast ? "bg-primary" : "bg-gray-100"
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center pt-4 lg:pt-0">
                  <Button 
                    onClick={() => advanceStage(order.id)}
                    disabled={isCompleted}
                    className={cn(
                      "px-8 h-14 rounded-xl text-xs font-bold transition-all w-full lg:w-auto focus-visible:ring-4 focus-visible:ring-primary/15",
                      isCompleted ? "bg-gray-200 text-gray-400" : "bg-[#2F3E34] text-white hover:bg-primary shadow-md shadow-primary/15 hover:-translate-y-0.5"
                    )}
                  >
                    {isCompleted ? "Mark Completed" : `Complete ${getStageName(order.currentStageIndex)} Stage`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RiskItem({ id, severity, title, desc, icon: Icon, impact, onResolve, onAssign }: {
  id: string
  severity: string
  title: string
  desc: string
  icon: React.ElementType
  impact: string
  onResolve: () => void
  onAssign: () => void
}) {
   return (
      <div className={cn(
         "p-6 rounded-xl border-l-4 transition-all hover:translate-x-1",
         severity === 'red' ? "bg-red-50/50 border-red-500" : "bg-amber-50/50 border-amber-500"
      )}>
         <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
               <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  severity === 'red' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
               )}>
                  <Icon className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="font-bold text-[#1a1a1a]">{title}</h4>
                  <span className={cn(
                     "text-[9px] font-black tracking-widest px-2 py-0.5 rounded uppercase",
                     severity === 'red' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  )}>
                     {impact}
                  </span>
               </div>
            </div>
            <p className="text-[10px] font-bold text-gray-400 font-mono">{id}</p>
         </div>
         <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">{desc}</p>
         <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" onClick={onAssign} className="h-9 px-4 rounded-md text-[10px] font-black uppercase hover:border-primary/25 hover:bg-primary/5 hover:text-primary">Assign</Button>
            <Button size="sm" onClick={onResolve} className="h-9 px-4 rounded-md bg-[#2F3E34] text-white text-[10px] font-black uppercase shadow-md shadow-primary/15">Resolve</Button>
         </div>
      </div>
   )
}

function MetricTile({ label, value, tone = 'normal' }: {
  label: string
  value: string
  tone?: 'normal' | 'risk'
}) {
  return (
    <div className={cn(
      "p-5 rounded-lg border bg-gray-50",
      tone === 'risk' ? "border-red-100 bg-red-50/50" : "border-gray-100"
    )}>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={cn("text-2xl font-black tabular-nums", tone === 'risk' ? "text-destructive" : "text-[#1a1a1a]")}>{value}</p>
    </div>
  )
}

function KPICard({ label, value, icon: Icon, trend, trendDir, sparkData, context, priority = 'none', tooltip, onClick }: {
  label: string
  value: string
  icon: React.ElementType
  trend: string
  trendDir: 'up' | 'down'
  sparkData: number[]
  color: string
  context: string
  priority?: 'red' | 'red-tint' | 'none'
  tooltip: string
  onClick?: () => void
}) {
  const isUp = trendDir === 'up'
  const interactiveClass = onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : "cursor-default"
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={(event) => {
            if (!onClick) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onClick()
            }
          }}
          className={cn(
            "p-6 bg-white border border-gray-100 rounded-xl shadow-sm transition-all h-[180px] flex flex-col justify-between group relative focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
            interactiveClass,
            priority === 'red-tint' && "border-red-100 bg-red-50/30"
          )}
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
             <Info className="w-3.5 h-3.5 text-gray-300" />
          </div>
          <div className="flex items-start justify-between">
            <div className={cn(
              "w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 transition-all",
              onClick && "group-hover:bg-primary group-hover:text-white"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="h-8 w-20">
               <Sparkline data={sparkData} color={isUp ? '#5D7052' : '#EF4444'} strokeWidth={2} />
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-3xl font-black text-[#1a1a1a] tracking-tighter">{value}</h4>
              <span className={cn("text-[9px] font-black flex items-center gap-0.5", isUp ? 'text-success' : 'text-destructive')}>
                {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {trend}
              </span>
            </div>
            <p className="text-[9px] font-bold text-gray-300 italic mt-1">{context}</p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-white border rounded-lg p-3 shadow-lg">
         <p className="text-[10px] font-medium text-gray-500">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
