'use client'

import { useActionState, useRef, useState } from 'react'
import { createPurchaseOrder } from './actions'
import { Plus, Trash2, Upload, ChevronRight, Loader2 } from 'lucide-react'

type SKURow = { garment_type: string; style_code: string; s: number; m: number; l: number; xl: number; xxl: number }

const PAYMENT_TERMS = [
  'Advance (100%)',
  '50% Advance, 50% on Delivery',
  '30 Days Credit',
  '60 Days Credit',
  '90 Days Credit',
  'On Delivery',
]

const initialState = { error: '', success: false }

export default function POForm() {
  const [state, formAction, isPending] = useActionState(createPurchaseOrder, initialState)
  const [skus, setSkus] = useState<SKURow[]>([{ garment_type: '', style_code: '', s: 0, m: 0, l: 0, xl: 0, xxl: 0 }])
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')

  function addSku() {
    setSkus(prev => [...prev, { garment_type: '', style_code: '', s: 0, m: 0, l: 0, xl: 0, xxl: 0 }])
  }
  function removeSku(i: number) {
    setSkus(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateSku(i: number, field: keyof SKURow, value: string | number) {
    setSkus(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  return (
    <form action={formAction} className="space-y-8 max-w-4xl">
      {/* Hidden SKU data */}
      <input type="hidden" name="sku_list" value={JSON.stringify(skus)} />

      {/* Error */}
      {state?.error && (
        <div className="p-4 rounded-xl text-sm font-bold bg-red-50 text-red-700 border border-red-100 flex items-start gap-2">
          {state.error}
        </div>
      )}

      {/* ── Section 1: Order Details ─────────────────────────── */}
      <fieldset className="card-premium p-6 space-y-5">
        <legend className="text-sm font-bold text-slate-900 px-1 mb-2 uppercase tracking-widest">
          Order Details
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="po-label">Purchase Order Number <span className="text-red-500">*</span></label>
            <input name="po_number" required className="po-input" placeholder="e.g. PO-2024-001" />
          </div>
          <div>
            <label className="po-label">PO Date</label>
            <input name="po_date" type="date" className="po-input" />
          </div>
          <div>
            <label className="po-label">Customer Name <span className="text-red-500">*</span></label>
            <input name="customer_name" required className="po-input" placeholder="Customer / Brand name" />
          </div>
          <div>
            <label className="po-label">Delivery Date</label>
            <input name="delivery_date" type="date" className="po-input" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="po-label">Office Address</label>
            <textarea name="office_address" className="po-input min-h-[72px] resize-none" placeholder="Customer office address" />
          </div>
          <div>
            <label className="po-label">Delivery Address</label>
            <textarea name="delivery_address" className="po-input min-h-[72px] resize-none" placeholder="Delivery / Ship-to address" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="po-label">Supplier Contact</label>
            <input name="supplier_contact" className="po-input" placeholder="Phone / Email" />
          </div>
          <div>
            <label className="po-label">Payment Term</label>
            <select name="payment_term" className="po-input">
              <option value="">Select term...</option>
              {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      {/* ── Section 2: Financial ─────────────────────────────── */}
      <fieldset className="card-premium p-6 space-y-4">
        <legend className="text-sm font-bold text-slate-900 px-1 mb-2 uppercase tracking-widest">
          Financial Details
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="po-label">PO Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">₹</span>
              <input name="po_amount_inr" type="number" min="0" step="0.01" className="po-input pl-7" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="po-label">Advance Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">₹</span>
              <input name="advance_amount_inr" type="number" min="0" step="0.01" className="po-input pl-7" placeholder="0.00" />
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Section 3: SKU Breakdown ─────────────────────────── */}
      <fieldset className="card-premium p-6 space-y-4">
        <legend className="text-sm font-bold text-slate-900 px-1 mb-2 uppercase tracking-widest">
          SKU & Size Breakdown
        </legend>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Garment Type', 'Style Code', 'S', 'M', 'L', 'XL', 'XXL', 'Total', ''].map(h => (
                  <th key={h} className="pb-3 px-2 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skus.map((sku, i) => {
                const total = sku.s + sku.m + sku.l + sku.xl + sku.xxl
                return (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-1">
                      <select 
                        value={sku.garment_type || ''} 
                        onChange={e => updateSku(i, 'garment_type' as any, e.target.value)}
                        className="po-input py-1.5 w-32"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="Shirt">Shirt</option>
                        <option value="T-Shirt">T-Shirt</option>
                        <option value="Trousers">Trousers</option>
                        <option value="Jacket">Jacket</option>
                        <option value="Kurti">Kurti</option>
                        <option value="Salwar">Salwar</option>
                      </select>
                    </td>
                    <td className="py-3 px-1">
                      <input value={sku.style_code} onChange={e => updateSku(i, 'style_code', e.target.value)}
                        className="po-input py-1.5 w-32" placeholder="e.g. SH-001" required />
                    </td>
                    {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                      <td key={size} className="py-3 px-1">
                        <input type="number" min="0" value={sku[size]}
                          onChange={e => updateSku(i, size, parseInt(e.target.value) || 0)}
                          className="po-input py-1.5 w-16 text-center" />
                      </td>
                    ))}
                    <td className="px-2 font-bold tabular-nums text-foreground">{total}</td>
                    <td className="px-1 text-right">
                      {skus.length > 1 && (
                        <button type="button" onClick={() => removeSku(i)} className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors tooltip-trigger" title="Remove row">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addSku}
          className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors px-3 py-2 hover:bg-primary/5 rounded-xl w-fit border border-transparent hover:border-primary/10">
          <Plus className="w-4 h-4" />
          ADD SKU ROW
        </button>
      </fieldset>

      {/* ── Section 4: PO File Upload ─────────────────────────── */}
      <fieldset className="card-premium p-6">
        <legend className="text-sm font-bold text-slate-900 px-1 mb-4 uppercase tracking-widest">
          PO File / Tech-Pack
        </legend>
        <div
          className="border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 group"
          onClick={() => fileRef.current?.click()}
        >
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-primary border border-border">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700">
              {fileName || 'Click to upload PO file'}
            </p>
            <p className="text-xs mt-1 text-slate-500 font-medium">PDF, DOCX, PNG, JPG up to 10MB</p>
          </div>
          <input ref={fileRef} name="po_file" type="file"
            accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
        </div>
      </fieldset>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <a href="/planner" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
          Cancel
        </a>
        <button type="submit" disabled={isPending} className="btn-primary px-8 py-3 rounded-full gap-2 shadow-xl shadow-primary/10">
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>Create Purchase Order <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </form>
  )
}
