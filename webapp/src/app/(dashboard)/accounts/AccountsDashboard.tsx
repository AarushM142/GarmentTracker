'use client'

import { useState, useTransition } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { logPayment, updateLogistics, closePO, uploadPOD, approveCredit } from "./actions"
import { 
  CreditCard, Truck, FileText, CheckCircle2, 
  IndianRupee, PackageCheck, X, ExternalLink, Receipt, Shield,
  Lock, AlertCircle, Loader2, Upload, ImagePlus, Archive,
  Zap, ArrowUpRight, TrendingUp, BarChart3
} from "lucide-react"

type Order = {
  id: string
  po_number: string
  customer_name: string
  status: string
  po_amount_inr: number | null
  advance_amount_inr: number | null
  sku_list: any[] | null
  courier_name: string | null
  tracking_number: string | null
  packed_quantity: number | null
  credit_approved?: boolean | null
  delivery_proofs?: { id: string, public_url: string | null }[] | null
}

export function AccountsDashboard({ orders }: { orders: Order[] }) {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<Order | null>(null)
  const [isPending, startTransition] = useTransition()
  const [dispatchLoading, setDispatchLoading] = useState(false)
  const [podLoading, setPodLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const dispatchQueue = orders.filter(o => ['packing', 'qc'].includes(o.status))
  const activeOrders = orders.filter(o => o.status !== 'closed')
  const archivedOrders = orders.filter(o => o.status === 'closed')

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.po_amount_inr) || 0), 0)
  const totalCollected = orders.reduce((s, o) => s + (Number(o.advance_amount_inr) || 0), 0)
  const totalOutstanding = totalRevenue - totalCollected

  return (
    <div className="space-y-10 animate-fade-up">
      {/* ── Page Header & Stats ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="live-dot" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-success">Financial Ledger</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Capital & Logistics
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Manage receivables, compliance, and dispatch operations.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex flex-col text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Collection</p>
              <p className="text-2xl font-bold text-foreground">₹{(totalCollected / 100000).toFixed(1)}L</p>
           </div>
           <div className="w-px h-10 bg-border/50" />
           <div className="flex flex-col text-right">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Total Outstanding</p>
              <p className="text-2xl font-bold text-secondary">₹{(totalOutstanding / 100000).toFixed(1)}L</p>
           </div>
        </div>
      </div>

      {/* ── Toast Notifications ─────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-fade-up border ${toast.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold text-sm">{toast.msg}</span>
        </div>
      )}

      {/* ── Payment Entry Modal ─────────────────────────────────── */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md p-10 rounded-[2.5rem] border border-border shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-2xl font-bold text-foreground">Record Payment</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Update financial status for PO {paymentTarget.po_number}</p>
               </div>
               <button onClick={() => setPaymentTarget(null)} className="p-2 rounded-full hover:bg-muted transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>

            <div className="p-6 rounded-[2rem] bg-muted/30 border border-border/50 mb-8 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Remaining Balance</span>
                  <span className="text-lg font-bold text-secondary">₹{(Number(paymentTarget.po_amount_inr || 0) - Number(paymentTarget.advance_amount_inr || 0)).toLocaleString()}</span>
               </div>
               <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(Number(paymentTarget.advance_amount_inr || 0) / Number(paymentTarget.po_amount_inr || 1)) * 100}%` }} />
               </div>
            </div>

            <form action={async (fd) => {
              fd.append('orderId', paymentTarget.id)
              startTransition(async () => {
                const result = await logPayment(fd)
                if (result?.error) showToast('error', result.error)
                else { showToast('success', 'Payment authorized.'); setPaymentTarget(null); }
              })
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-4">Receipt Amount (₹)</label>
                <input name="amount" type="number" min="1" step="0.01" required className="form-input-pill h-14" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-4">Reference / Note</label>
                <input name="note" className="form-input-pill h-14" placeholder="Cheque #, NEFT Ref..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setPaymentTarget(null)} className="flex-1 py-4 rounded-full border border-border text-sm font-bold text-muted-foreground hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isPending} className="flex-1 btn-command btn-command-primary h-14">
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Primary Navigation ──────────────────────────────────── */}
      <Tabs defaultValue="logistics" className="w-full">
        <TabsList className="bg-muted/30 p-1.5 rounded-full mb-10 border border-border/50 max-w-2xl mx-auto flex justify-center">
          <TabsTrigger value="logistics" className="rounded-full px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all flex items-center gap-2">
            <Truck className="w-4 h-4" /> Operations
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-full px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Receivables
          </TabsTrigger>
          <TabsTrigger value="archive" className="rounded-full px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-bold transition-all flex items-center gap-2">
            <Archive className="w-4 h-4" /> Archive
          </TabsTrigger>
        </TabsList>
        
        {/* ── Operations & Dispatch Tab ─────────────────────────── */}
        <TabsContent value="logistics" className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Dispatch Queue */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-primary" /> Ready for Logistics
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{dispatchQueue.length} Active</span>
              </div>
              <div className="space-y-4">
                {dispatchQueue.map(order => (
                  <div 
                    key={order.id}
                    onClick={() => setActiveOrder(order)}
                    className={`card-premium p-6 cursor-pointer border-2 transition-all ${activeOrder?.id === order.id ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-muted/20'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">{order.po_number}</p>
                          <h4 className="font-bold text-foreground">{order.customer_name}</h4>
                       </div>
                       <span className="px-3 py-1 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border">
                          {order.status}
                       </span>
                    </div>
                    {order.courier_name && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50">
                         <Truck className="w-3.5 h-3.5 text-primary" />
                         <span className="text-xs font-bold text-foreground truncate">{order.courier_name} · {order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                ))}
                {dispatchQueue.length === 0 && (
                  <div className="card-premium p-16 text-center border-dashed border-border flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground opacity-40">
                      <PackageCheck className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Queue Cleared. No orders awaiting dispatch.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Panel */}
            <div className="lg:col-span-7">
               {activeOrder ? (
                  <div className="space-y-8 sticky top-8">
                     <div className="card-premium p-8">
                        <div className="flex items-center justify-between mb-8">
                           <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                              <Zap className="w-5 h-5 text-primary" /> Dispatch Finalization
                           </h3>
                           <button onClick={() => setActiveOrder(null)} className="text-muted-foreground hover:text-foreground">
                              <X className="w-5 h-5" />
                           </button>
                        </div>
                        
                        <form action={async (fd) => {
                          fd.append('orderId', activeOrder.id)
                          setDispatchLoading(true)
                          const result = await updateLogistics(fd)
                          setDispatchLoading(false)
                          if (result?.error) showToast('error', result.error)
                          else { showToast('success', 'Order Dispatched.'); setActiveOrder(null) }
                        }} className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">Courier Partner</label>
                                <input name="courierName" className="form-input-pill h-14" placeholder="BlueDart, FedEx..." defaultValue={activeOrder.courier_name || ''} required />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">Tracking Number / AWB</label>
                                <input name="trackingNumber" className="form-input-pill h-14" placeholder="AWB-XXXXXX" defaultValue={activeOrder.tracking_number || ''} required />
                              </div>
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-4">Verified Packed Quantity (Pcs)</label>
                             <input name="packedQuantity" type="number" className="form-input-pill h-14" defaultValue={activeOrder.packed_quantity || ''} required />
                           </div>
                           <button type="submit" disabled={dispatchLoading} className="btn-command btn-command-primary h-14 w-full">
                              {dispatchLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                              Confirm & Dispatch Order
                           </button>
                        </form>
                     </div>

                     {/* Documents Center */}
                     <div className="card-premium p-8">
                        <h3 className="text-lg font-bold text-foreground mb-6">Compliance & Manifests</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                           {[
                              { label: 'Challan', icon: FileText, color: 'text-primary', bg: 'bg-primary/5' },
                              { label: 'Gate Pass', icon: Shield, color: 'text-secondary', bg: 'bg-secondary/5' },
                              { label: 'Tax Invoice', icon: Receipt, color: 'text-warning', bg: 'bg-warning/5' },
                              { label: 'Manifest', icon: ExternalLink, color: 'text-muted-foreground', bg: 'bg-muted/10' }
                           ].map(doc => (
                              <div key={doc.label} className="p-4 rounded-3xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-all cursor-pointer group text-center space-y-3">
                                 <div className={`w-12 h-12 rounded-2xl ${doc.bg} mx-auto flex items-center justify-center transition-transform group-hover:-translate-y-1`}>
                                    <doc.icon className={`w-6 h-6 ${doc.color}`} />
                                 </div>
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">{doc.label}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="card-premium p-20 text-center border-dashed border-border/60 flex flex-col items-center justify-center gap-6 h-full min-h-[400px]">
                     <div className="w-20 h-20 rounded-[2.5rem] bg-muted/30 flex items-center justify-center text-muted-foreground opacity-30">
                        <Truck className="w-10 h-10" />
                     </div>
                     <p className="text-muted-foreground font-medium max-w-xs">Select an active production lot to finalize logistics and generate documentation.</p>
                  </div>
               )}
            </div>
          </div>
        </TabsContent>
        
        {/* ── Receivables Tab ───────────────────────────────────── */}
        <TabsContent value="payments" className="space-y-8 animate-fade-in">
           <div className="card-premium overflow-hidden border border-border/40 shadow-sm">
              <table className="table-dense">
                 <thead>
                    <tr className="bg-muted/30">
                       <th className="pl-8">Customer / PO</th>
                       <th>Commercial Value</th>
                       <th>Collection</th>
                       <th>Balance Gap</th>
                       <th className="pr-8 text-right">Strategic Action</th>
                    </tr>
                 </thead>
                 <tbody>
                    {activeOrders.map((order, i) => {
                       const total = Number(order.po_amount_inr) || 0
                       const adv = Number(order.advance_amount_inr) || 0
                       const balance = total - adv
                       return (
                          <tr key={order.id} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                             <td className="pl-8 py-6">
                                <div className="flex flex-col">
                                   <span className="text-sm font-bold text-foreground">{order.customer_name}</span>
                                   <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{order.po_number}</span>
                                </div>
                             </td>
                             <td className="font-bold text-foreground tabular-nums">₹{total.toLocaleString()}</td>
                             <td className="font-bold text-success tabular-nums">₹{adv.toLocaleString()}</td>
                             <td>
                                <div className="flex flex-col">
                                   <span className={`text-sm font-bold tabular-nums ${balance > 0 ? 'text-secondary' : 'text-muted-foreground opacity-40'}`}>
                                      ₹{Math.max(0, balance).toLocaleString()}
                                   </span>
                                   {order.credit_approved && <span className="text-[9px] font-bold uppercase text-primary tracking-widest mt-0.5">Credit OK</span>}
                                </div>
                             </td>
                             <td className="pr-8 text-right">
                                <div className="flex items-center justify-end gap-3">
                                   <button 
                                     onClick={() => setPaymentTarget(order)}
                                     className="btn-command btn-command-secondary py-2 px-4 shadow-none"
                                   >
                                      Log Payment
                                   </button>
                                   {order.status === 'dispatched' && (
                                      <button 
                                        onClick={async () => {
                                          startTransition(async () => {
                                             const res = await closePO(order.id)
                                             if (res?.error) showToast('error', res.error)
                                             else showToast('success', 'Order Closed')
                                          })
                                        }}
                                        className="btn-command btn-command-primary py-2 px-5"
                                      >
                                         Close PO
                                      </button>
                                   )}
                                </div>
                             </td>
                          </tr>
                       )
                    })}
                 </tbody>
              </table>
           </div>
        </TabsContent>

        {/* ── Archive Tab ───────────────────────────────────────── */}
        <TabsContent value="archive" className="space-y-6 animate-fade-in">
           <div className="card-premium overflow-hidden border border-border/40 shadow-sm opacity-80">
              <table className="table-dense">
                 <thead>
                    <tr className="bg-muted/10">
                       <th className="pl-8">PO Reference</th>
                       <th>Partner</th>
                       <th>Final Value</th>
                       <th className="pr-8 text-right">Archive Status</th>
                    </tr>
                 </thead>
                 <tbody>
                    {archivedOrders.map((order) => (
                       <tr key={order.id}>
                          <td className="pl-8 py-6 font-mono text-xs font-bold">{order.po_number}</td>
                          <td className="font-bold text-foreground">{order.customer_name}</td>
                          <td className="font-bold text-foreground tabular-nums">₹{Number(order.po_amount_inr || 0).toLocaleString()}</td>
                          <td className="pr-8 text-right">
                             <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                                <Lock className="w-3 h-3" /> Sealed Archive
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
