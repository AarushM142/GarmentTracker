import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FileText, Receipt, Truck, Shield, ArrowLeft, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

const DOC_TYPES = [
  {
    type: 'challan',
    label: 'Delivery Challan',
    description: 'Itemized list of goods dispatched.',
    icon: Truck,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    type: 'gate-pass',
    label: 'Gate Pass',
    description: 'Security clearance slip for vehicle exit.',
    icon: Shield,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
  {
    type: 'tax-invoice',
    label: 'Tax Invoice (Proforma)',
    description: 'Proforma invoice with GST breakdown.',
    icon: Receipt,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'Proforma',
  },
  {
    type: 'eway-bill',
    label: 'E-Way Bill (Mock)',
    description: 'Mock transport document — pending GSTN.',
    icon: FileText,
    color: 'text-muted-foreground',
    bg: 'bg-muted/30',
    border: 'border-border',
    badge: 'Mock',
  },
]

export default async function DocumentsIndexPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from('purchase_orders')
    .select('id, po_number, customer_name, status, created_at, updated_at')
    .eq('id', params.id)
    .single()

  if (error || !order) notFound()

  return (
    <div className="space-y-7 animate-fade-in relative z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <Link href="/accounts" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Accounts
        </Link>
        <span>/</span>
        <span className="text-foreground font-bold">Documents</span>
        <span>/</span>
        <span className="text-foreground font-bold">{order.po_number}</span>
      </div>

      {/* Header */}
      <div className="card-premium p-6 border border-border shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Documents
            </h2>
            <p className="text-muted-foreground text-sm mt-1 font-medium">
              All documents for PO: <strong className="text-foreground">{order.po_number}</strong>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border ${
              order.status === 'dispatched' ? 'bg-muted text-muted-foreground border-border' :
              order.status === 'closed' ? 'bg-muted text-muted-foreground border-border' :
              'bg-primary/10 text-primary border-primary/20'
            }`}>
              {order.status}
            </span>
            <p className="text-[10px] text-muted-foreground font-medium">
              {order.customer_name}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground font-medium">Order ID</span>
            <p className="font-mono text-foreground mt-0.5 text-[10px]">{order.id}</p>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Last Updated</span>
            <p className="font-bold text-foreground mt-0.5">
              {new Date(order.updated_at || order.created_at).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Document Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DOC_TYPES.map((doc) => {
          const Icon = doc.icon
          return (
            <Link
              key={doc.type}
              href={`/documents/${order.id}/${doc.type}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card-premium p-5 border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className={`w-12 h-12 rounded-2xl ${doc.bg} border ${doc.border} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5 h-5 ${doc.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground text-sm">{doc.label}</p>
                  {doc.badge && (
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      {doc.badge}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-0.5 font-medium">{doc.description}</p>
                <p className="text-[10px] text-primary font-bold mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open & Print <ExternalLink className="w-3 h-3" />
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Info note */}
      {['draft', 'in_production', 'material_released', 'cutting', 'stitching', 'fusing', 'kaj_buttoning', 'finishing_ironing', 'rework'].includes(order.status) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800 font-medium flex items-start gap-3">
          <span className="text-lg leading-none">⚠️</span>
          <span>
            This order has not been dispatched yet (status: <strong>{order.status}</strong>).
            Documents can be previewed now, but courier and packing details will be empty until dispatch.
          </span>
        </div>
      )}
    </div>
  )
}
