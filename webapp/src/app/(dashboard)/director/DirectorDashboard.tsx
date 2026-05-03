'use client'

import { useState } from 'react'
import { 
  BarChart3, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, IndianRupee,
  ChevronRight, ArrowUpRight, Inbox, XCircle
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { approvePurchaseRequest } from './actions'

type Stats = {
  activeOrders: number
  totalValue: number
  totalAdvance: number
  bottlenecks: number
  stageCounts: Record<string, number>
  recentOrders: any[]
  pendingPRs: any[]
}

export function DirectorDashboard({ stats }: { stats: Stats }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleApprove = async (id: string, action: 'approve' | 'reject') => {
    setLoadingId(id)
    await approvePurchaseRequest(id, action)
    setLoadingId(null)
  }

  const stageLabels: Record<string, string> = {
    draft: 'Draft',
    in_production: 'Planning',
    material_released: 'Store',
    cutting: 'Cutting',
    fusing: 'Fusing',
    stitching: 'Stitching',
    kaj_buttoning: 'Kaj & Button',
    finishing_ironing: 'Finishing',
    qc: 'QC',
    rework: 'Reworking',
    packing: 'Packing',
    dispatched: 'In Transit'
  }

  const outstanding = stats.totalValue - stats.totalAdvance
  const collectionRate = stats.totalValue > 0 ? (stats.totalAdvance / stats.totalValue) * 100 : 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Director's Suite
          </h2>
          <p className="text-muted-foreground font-medium">Real-time factory pulse and financial authorizations.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 rounded-full bg-white border border-border flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-foreground">LIVE: 14 LINES ACTIVE</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-full mb-8 border border-border">
          <TabsTrigger value="overview" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold">
            <BarChart3 className="w-4 h-4 mr-2" /> Executive Overview
          </TabsTrigger>
          <TabsTrigger value="inbox" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold relative">
            <Inbox className="w-4 h-4 mr-2" /> Approval Inbox
            {stats.pendingPRs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {stats.pendingPRs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* ── Top KPI Cards ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard label="Active Orders" value={stats.activeOrders.toString()} icon={TrendingUp} trend="+2 this week" color="primary" />
            <KPICard label="Total Value (PO)" value={`₹${(stats.totalValue / 100000).toFixed(1)}L`} icon={IndianRupee} trend="Projected Revenue" color="secondary" />
            <KPICard label="Outstanding" value={`₹${(outstanding / 100000).toFixed(1)}L`} icon={BarChart3} trend={`${Math.round(100 - collectionRate)}% pending`} color="accent" />
            <KPICard label="Bottlenecks" value={stats.bottlenecks.toString()} icon={AlertTriangle} trend="Orders stalled >24h" color={stats.bottlenecks > 0 ? "destructive" : "muted"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Production Heatmap ────────────────────────────── */}
            <div className="lg:col-span-2 card-premium p-8 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <LayersIcon className="w-5 h-5 text-primary" /> Production Heatmap
                </h3>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Orders by Stage</span>
              </div>
              <div className="space-y-6">
                {Object.entries(stats.stageCounts).map(([stage, count], i) => {
                  if (count === 0) return null
                  const max = Math.max(...Object.values(stats.stageCounts))
                  const percentage = (count / max) * 100
                  return (
                    <div key={stage} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-muted-foreground">{stageLabels[stage] || stage}</span>
                        <span className="font-bold text-foreground">{count} units</span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, opacity: 0.4 + (percentage / 150) }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Financial Health ──────────────────────────────── */}
            <div className="card-premium p-8 flex flex-col border border-border shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-8 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" /> Financial Pulse
              </h3>
              <div className="flex-1 flex flex-col justify-center items-center gap-8 py-4">
                 <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" fill="transparent" stroke="#F0EBE5" strokeWidth="12" />
                      <circle cx="80" cy="80" r="70" fill="transparent" stroke="#5D7052" strokeWidth="12" strokeDasharray={440} strokeDashoffset={440 - (440 * collectionRate) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-bold text-foreground">{Math.round(collectionRate)}%</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Collected</span>
                    </div>
                 </div>
                 <div className="w-full space-y-4">
                    <div className="flex justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20">
                      <span className="text-xs font-bold text-primary uppercase">Received</span>
                      <span className="font-bold text-foreground">₹{(stats.totalAdvance / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex justify-between p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
                      <span className="text-xs font-bold text-secondary uppercase">Outstanding</span>
                      <span className="font-bold text-foreground">₹{(outstanding / 1000).toFixed(1)}k</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="space-y-6">
          <div className="card-premium overflow-hidden border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Inbox className="w-5 h-5 text-primary" /> Pending Authorizations
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Review and approve high-value material requests.</p>
            </div>
            
            {stats.pendingPRs.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Inbox Zero</h3>
                <p className="text-muted-foreground text-sm font-medium">No pending requests require your authorization.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.pendingPRs.map(pr => (
                  <div key={pr.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1.5 bg-secondary/10 text-secondary text-[10px] font-bold uppercase rounded-full border border-secondary/20">
                          Purchase Request
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">ID: {pr.id.slice(0,8)}</span>
                      </div>
                      <h4 className="font-bold text-foreground">{pr.material_name}</h4>
                      <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Required Quantity: <span className="font-bold text-foreground">{pr.quantity_required}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleApprove(pr.id, 'reject')}
                        disabled={loadingId === pr.id}
                        className="px-5 py-2.5 rounded-full text-sm font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors flex items-center gap-2 disabled:opacity-50 border border-destructive/20"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button 
                        onClick={() => handleApprove(pr.id, 'approve')}
                        disabled={loadingId === pr.id}
                        className="px-6 py-2.5 rounded-full text-sm font-bold btn-primary flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function KPICard({ label, value, icon: Icon, trend, color }: { 
  label: string, 
  value: string, 
  icon: any, 
  trend: string,
  color: 'primary' | 'secondary' | 'accent' | 'destructive' | 'muted'
}) {
  const colors = {
    primary:     { bg: 'bg-primary/10',     icon: 'text-primary',     border: 'border-primary/20' },
    secondary:   { bg: 'bg-secondary/10',   icon: 'text-secondary',   border: 'border-secondary/20' },
    accent:      { bg: 'bg-accent',         icon: 'text-secondary',   border: 'border-border' },
    destructive: { bg: 'bg-destructive/10', icon: 'text-destructive', border: 'border-destructive/20' },
    muted:       { bg: 'bg-muted',          icon: 'text-muted-foreground', border: 'border-border' },
  }

  return (
    <div className="card-premium p-6 flex flex-col gap-4 border border-border shadow-sm hover:-translate-y-1 transition-transform duration-300">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color].bg} ${colors[color].border} border`}>
        <Icon className={`w-6 h-6 ${colors[color].icon}`} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <h4 className="text-3xl font-bold text-foreground mt-1" style={{ fontFamily: 'var(--font-heading)' }}>{value}</h4>
        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1 font-bold uppercase">
          {trend}
        </p>
      </div>
    </div>
  )
}

function getProgress(status: string) {
  const map: Record<string, number> = {
    'draft': 5,
    'in_production': 15,
    'material_released': 25,
    'cutting': 35,
    'fusing': 45,
    'stitching': 60,
    'kaj_buttoning': 70,
    'finishing_ironing': 80,
    'qc': 90,
    'rework': 60,
    'packing': 95,
    'dispatched': 100,
    'closed': 100
  }
  return map[status] || 0
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}
