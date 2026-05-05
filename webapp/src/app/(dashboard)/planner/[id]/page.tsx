import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  ArrowLeft, Package, Calendar, User, MapPin,
  IndianRupee, FileText, AlertTriangle, CheckCircle2,
  Layers, ClipboardList, Play
} from 'lucide-react'
import { releasePO } from '../new-order/actions'
import { BOMRetryButton } from './BOMRetryButton'

export const dynamic = 'force-dynamic'

const STATUS_STEPS = [
  'draft', 'in_production', 'material_released', 'cutting', 'fusing',
  'stitching', 'kaj_buttoning', 'finishing_ironing', 'qc', 'packing', 'dispatched', 'closed'
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', in_production: 'In Production', material_released: 'Material Released',
  cutting: 'Cutting', fusing: 'Fusing', stitching: 'Stitching',
  kaj_buttoning: 'Kaj & Button', finishing_ironing: 'Finishing', qc: 'QC',
  rework: 'Rework', packing: 'Packing', dispatched: 'Dispatched', closed: 'Closed'
}

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !po) notFound()

  const [{ data: bomItems }, { data: purchaseRequests }] = await Promise.all([
    supabase.from('bom_items').select('*').eq('po_id', id).order('material_name'),
    supabase.from('purchase_requests').select('*').eq('po_id', id).order('created_at'),
  ])

  const currentStepIndex = STATUS_STEPS.indexOf(po.status)
  const progressPct = currentStepIndex >= 0
    ? Math.round((currentStepIndex / (STATUS_STEPS.length - 1)) * 100)
    : 0

  const totalQty = (po.sku_list as any[] | null)?.reduce(
    (sum: number, s: any) => sum + (Number(s.quantity) || 0), 0
  ) ?? 0

  const balance = (Number(po.po_amount_inr) || 0) - (Number(po.advance_amount_inr) || 0)

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 font-medium">
          <Link href="/planner" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Planner
          </Link>
          <span>/</span>
          <span className="text-foreground font-bold">{po.po_number}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              {po.po_number}
            </h2>
            <p className="text-muted-foreground font-medium mt-1">{po.customer_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border ${
              po.status === 'closed' ? 'bg-muted text-muted-foreground border-border' :
              po.status === 'draft' ? 'bg-secondary/10 text-secondary border-secondary/20' :
              'bg-primary/10 text-primary border-primary/20'
            }`}>
              {STATUS_LABELS[po.status] || po.status}
            </span>
            {po.status === 'draft' && (
              <form action={async () => {
                'use server'
                await releasePO(id)
              }}>
                <button type="submit" className="btn-primary gap-2 text-sm">
                  <Play className="w-4 h-4" /> Release to Production
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card-premium p-6 border border-border shadow-sm">
        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
          <span>Draft</span>
          <span>Production</span>
          <span>QC</span>
          <span>Dispatch</span>
          <span>Closed</span>
        </div>
        <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-right text-xs font-bold text-primary mt-2">{progressPct}% complete</p>
      </div>

      {/* PO Details + Financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-premium p-6 border border-border shadow-sm space-y-5">
          <h3 className="font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <ClipboardList className="w-5 h-5 text-primary" /> Order Details
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {po.po_date && (
              <Detail icon={Calendar} label="PO Date" value={format(new Date(po.po_date), 'dd MMM yyyy')} />
            )}
            {po.delivery_date && (
              <Detail icon={Calendar} label="Delivery Date" value={format(new Date(po.delivery_date), 'dd MMM yyyy')} />
            )}
            {po.payment_term && <Detail icon={FileText} label="Payment Term" value={po.payment_term} />}
            {po.supplier_contact && <Detail icon={User} label="Supplier Contact" value={po.supplier_contact} />}
            {po.office_address && <Detail icon={MapPin} label="Office Address" value={po.office_address} />}
            {po.delivery_address && <Detail icon={MapPin} label="Delivery Address" value={po.delivery_address} />}
          </div>

          {/* SKU List */}
          {po.sku_list && (po.sku_list as any[]).length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">SKUs ({totalQty} pcs total)</p>
              <div className="space-y-2">
                {(po.sku_list as any[]).map((sku: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border text-sm">
                    <span className="font-bold text-foreground">{sku.style_code}</span>
                    <span className="text-muted-foreground font-medium text-xs">{sku.garment_type}</span>
                    <span className="font-bold text-primary">{sku.quantity} pcs</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Financial Card */}
        <div className="card-premium p-6 border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <IndianRupee className="w-5 h-5 text-primary" /> Financials
          </h3>
          <div className="space-y-3">
            <FinancialRow label="PO Value" value={`₹${Number(po.po_amount_inr || 0).toLocaleString()}`} />
            <FinancialRow label="Advance Received" value={`₹${Number(po.advance_amount_inr || 0).toLocaleString()}`} highlight="primary" />
            <div className="border-t border-border pt-3">
              <FinancialRow label="Balance Due" value={`₹${Math.max(0, balance).toLocaleString()}`} highlight={balance > 0 ? 'secondary' : 'muted'} />
            </div>
          </div>
          {po.po_file_url && (
            <a href={po.po_file_url} target="_blank" rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 p-3 rounded-2xl border border-border hover:bg-muted/20 transition-colors text-sm font-bold text-primary">
              <FileText className="w-4 h-4" /> View PO File
            </a>
          )}
        </div>
      </div>

      {/* BOM + Purchase Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BOM Items */}
        <div className="card-premium p-6 border border-border shadow-sm">
          <h3 className="font-bold text-foreground flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            <Layers className="w-5 h-5 text-primary" /> Bill of Materials
          </h3>
          {bomItems && bomItems.length > 0 ? (
            <div className="space-y-2">
              {bomItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border text-sm">
                  <span className="font-bold text-foreground">{item.material_name}</span>
                  <span className="font-mono font-bold text-primary">{item.required_qty} {item.unit}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
              <p className="text-muted-foreground text-sm font-medium mb-4">
                BOM not yet calculated or calculation failed.
              </p>
              <BOMRetryButton poId={id} />
            </div>
          )}
        </div>

        {/* Purchase Requests / Shortfalls */}
        <div className="card-premium p-6 border border-border shadow-sm">
          <h3 className="font-bold text-foreground flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            <AlertTriangle className="w-5 h-5 text-secondary" /> Material Shortfalls
          </h3>
          {purchaseRequests && purchaseRequests.length > 0 ? (
            <div className="space-y-2">
              {purchaseRequests.map((pr: any) => (
                <div key={pr.id} className={`flex items-start justify-between p-3 rounded-2xl border text-sm ${
                  pr.shortfall > 0
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-primary/5 border-primary/20'
                }`}>
                  <div>
                    <p className="font-bold text-foreground">{pr.material_name}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      Required: {pr.quantity_required} · In Stock: {pr.quantity_in_stock}
                    </p>
                  </div>
                  <div className="text-right">
                    {pr.shortfall > 0 ? (
                      <span className="font-bold text-destructive text-xs">−{pr.shortfall} short</span>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                    <p className={`text-[10px] font-bold uppercase mt-1 ${
                      pr.status === 'approved' ? 'text-primary' :
                      pr.status === 'rejected' ? 'text-destructive' : 'text-secondary'
                    }`}>{pr.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm font-medium">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No material shortfalls detected.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Detail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function FinancialRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  const colors: Record<string, string> = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    muted: 'text-muted-foreground',
  }
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className={`font-bold text-sm ${highlight ? colors[highlight] : 'text-foreground'}`}>{value}</span>
    </div>
  )
}
