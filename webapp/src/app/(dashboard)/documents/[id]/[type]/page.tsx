import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DeliveryChallan } from './DeliveryChallan'
import { GatePass } from './GatePass'
import { TaxInvoice } from './TaxInvoice'
import { EWayBill } from './EWayBill'

export const dynamic = 'force-dynamic'

export default async function DocumentPage({
  params,
}: {
  params: { id: string; type: string }
}) {
  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !order) notFound()

  const supportedTypes = ['challan', 'gate-pass', 'tax-invoice', 'eway-bill']
  if (!supportedTypes.includes(params.type)) notFound()

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{`${params.type.replace('-', ' ').toUpperCase()} — ${order.po_number}`}</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
          
          @media screen {
            body { background: #f0ede8; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 40px 20px; }
            .doc-shell { background: white; width: 210mm; min-height: 297mm; padding: 20mm; box-shadow: 0 4px 40px rgba(0,0,0,0.15); position: relative; }
            .print-btn { position: fixed; top: 20px; right: 20px; background: #3a5c3a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; z-index: 100; display: flex; align-items: center; gap: 6px; }
            .print-btn:hover { background: #2d472d; }
          }
          
          @media print {
            body { background: white; padding: 0; }
            .doc-shell { width: 100%; padding: 15mm; box-shadow: none; }
            .print-btn { display: none !important; }
            @page { size: A4; margin: 0; }
          }
          
          /* Shared document styles */
          .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #3a5c3a; }
          .company-name { font-size: 20px; font-weight: 700; color: #3a5c3a; }
          .company-meta { font-size: 10px; color: #666; margin-top: 4px; line-height: 1.6; }
          .doc-title { font-size: 16px; font-weight: 700; color: #3a5c3a; text-align: right; }
          .doc-number { font-size: 11px; color: #666; text-align: right; margin-top: 4px; }
          
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-box { background: #f7f5f0; border: 1px solid #e0dbd0; border-radius: 6px; padding: 12px; }
          .info-box label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; display: block; margin-bottom: 4px; }
          .info-box p { font-size: 11px; font-weight: 600; color: #1a1a1a; line-height: 1.5; }
          
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          thead tr { background: #3a5c3a; color: white; }
          thead th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          tbody tr { border-bottom: 1px solid #e0dbd0; }
          tbody tr:nth-child(even) { background: #f7f5f0; }
          tbody td { padding: 8px 10px; font-size: 11px; }
          
          .totals-section { display: flex; justify-content: flex-end; margin-top: 16px; }
          .totals-box { min-width: 260px; }
          .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e0dbd0; font-size: 11px; }
          .totals-row.grand-total { font-weight: 700; font-size: 13px; color: #3a5c3a; border-bottom: 2px solid #3a5c3a; padding-top: 8px; }
          
          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
          .sig-box { border-top: 1px solid #ccc; padding-top: 8px; text-align: center; font-size: 10px; color: #666; }
          
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; font-weight: 900; color: rgba(0,0,0,0.04); white-space: nowrap; pointer-events: none; z-index: 0; }
          .doc-content { position: relative; z-index: 1; }

          .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
          .badge-green { background: #e8f0e8; color: #3a5c3a; border: 1px solid #b8d4b8; }
          .badge-amber { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; }
        `}</style>
      </head>
      <body>
        <button className="print-btn" onClick={() => window.print()} type="button">
          🖨️ Print / Save PDF
        </button>
        <div className="doc-shell">
          {params.type === 'challan' && <DeliveryChallan order={order} />}
          {params.type === 'gate-pass' && <GatePass order={order} />}
          {params.type === 'tax-invoice' && <TaxInvoice order={order} />}
          {params.type === 'eway-bill' && <EWayBill order={order} />}
        </div>
      </body>
    </html>
  )
}
