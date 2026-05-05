'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { createPurchaseOrder } from './actions'
import { 
  Plus, Trash2, Upload, ChevronRight, 
  Loader2, ShoppingCart, IndianRupee, 
  FileText, CheckCircle2, ChevronLeft,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type SKURow = { garment_type: string; style_code: string; s: number; m: number; l: number; xl: number; xxl: number }

const PAYMENT_TERMS = [
  'Advance (100%)',
  '50% Advance, 50% on Delivery',
  '30 Days Credit',
  '60 Days Credit',
  'On Delivery',
]

const GARMENT_TYPES = ['Shirt', 'T-Shirt', 'Trousers', 'Jacket', 'Kurti', 'Salwar', 'Uniform', 'Other']

const initialState = { error: '', success: false }

export default function POForm() {
  const [state, formAction, isPending] = useActionState(createPurchaseOrder, initialState)
  const [step, setStep] = useState(1)
  const [skus, setSkus] = useState<SKURow[]>([{ garment_type: '', style_code: '', s: 0, m: 0, l: 0, xl: 0, xxl: 0 }])
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')

  const nextStep = () => setStep(s => Math.min(s + 1, 3))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  function addSku() {
    setSkus(prev => [...prev, { garment_type: '', style_code: '', s: 0, m: 0, l: 0, xl: 0, xxl: 0 }])
  }
  function removeSku(i: number) {
    setSkus(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateSku(i: number, field: keyof SKURow, value: string | number) {
    setSkus(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  const totalQty = skus.reduce((sum, row) => sum + row.s + row.m + row.l + row.xl + row.xxl, 0)

  return (
    <div className="max-w-5xl space-y-10 animate-fade-up">
      {/* ── Stepper ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        {[
          { num: 1, label: 'Basics', icon: ShoppingCart },
          { num: 2, label: 'SKU Breakdown', icon: FileText },
          { num: 3, label: 'Finalize', icon: CheckCircle2 }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-4 group">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              step >= s.num ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-muted text-muted'
            }`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${step >= s.num ? 'text-primary' : 'text-muted opacity-50'}`}>Step {s.num}</p>
              <p className={`text-sm font-bold ${step >= s.num ? 'text-foreground' : 'text-muted'}`}>{s.label}</p>
            </div>
            {i < 2 && <div className={`w-12 h-[2px] mx-2 hidden md:block transition-colors duration-500 ${step > s.num ? 'bg-primary' : 'bg-surface-muted'}`} />}
          </div>
        ))}
      </div>

      <form action={formAction} className="space-y-8">
        <input type="hidden" name="sku_list" value={JSON.stringify(skus)} />

        {state?.error && (
          <div className="p-6 rounded-3xl bg-destructive-tint border border-destructive/20 flex gap-4 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm font-bold text-foreground">{state.error}</p>
          </div>
        )}

        {/* ── Step 1: Basics ────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="card-premium p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-4">PO Reference</label>
                <input name="po_number" required className="form-input-pill h-14" placeholder="e.g. PO-2024-001" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-4">Customer / Brand</label>
                <input name="customer_name" required className="form-input-pill h-14" placeholder="Partner Name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-4">Expected Delivery</label>
                <input name="delivery_date" type="date" required className="form-input-pill h-14" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-4">Payment Terms</label>
                <select name="payment_term" required className="form-input-pill h-14 bg-surface/50">
                  <option value="">Select Financial Terms</option>
                  {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="card-premium p-8 space-y-6">
               <h3 className="text-lg font-bold flex items-center gap-2 px-2">
                  <IndianRupee className="w-5 h-5 text-primary" /> Commercials
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-4">Total PO Value (₹)</label>
                    <input name="po_amount_inr" type="number" step="0.01" required className="form-input-pill h-14" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-4">Advance Collected (₹)</label>
                    <input name="advance_amount_inr" type="number" step="0.01" required className="form-input-pill h-14" placeholder="0.00" />
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ── Step 2: SKU Grid ──────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="card-premium p-8">
               <div className="flex items-center justify-between mb-8 px-2">
                  <div>
                     <h3 className="text-xl font-bold text-foreground">Production Breakdown</h3>
                     <p className="text-xs text-muted font-medium mt-1">Specify sizes and garment types for manufacturing.</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Total Forecast</p>
                     <p className="text-2xl font-bold text-foreground tabular-nums">{totalQty.toLocaleString()} Pcs</p>
                  </div>
               </div>

               <div className="space-y-4">
                  {skus.map((sku, i) => (
                    <div key={i} className="group relative bg-surface-muted border border-border/40 rounded-[2rem] p-6 pr-14 transition-all hover:bg-surface-muted/80 hover:border-primary/20">
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                          <div className="md:col-span-3 space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-widest text-muted ml-3">Type</label>
                             <select 
                                id={`type-${i}`}
                                value={sku.garment_type} 
                                onChange={e => updateSku(i, 'garment_type', e.target.value)}
                                className="form-input-pill h-12 bg-surface" required
                             >
                                <option value="">Select</option>
                                {GARMENT_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                             </select>
                          </div>
                          <div className="md:col-span-3 space-y-2">
                             <label className="text-[9px] font-bold uppercase tracking-widest text-muted ml-3">Style Code</label>
                             <input 
                                value={sku.style_code} 
                                onChange={e => updateSku(i, 'style_code', e.target.value)}
                                className="form-input-pill h-12 bg-surface" placeholder="ID" required
                             />
                          </div>
                          <div className="md:col-span-6 grid grid-cols-5 gap-2">
                             {(['s', 'm', 'l', 'xl', 'xxl'] as const).map(size => (
                               <div key={size} className="space-y-2">
                                  <label className="text-[8px] font-bold uppercase tracking-widest text-muted text-center block">{size}</label>
                                  <input 
                                    type="number" value={sku[size] || ''} 
                                    onChange={e => updateSku(i, size, parseInt(e.target.value) || 0)}
                                    className="form-input-pill h-12 bg-surface px-0 text-center tabular-nums"
                                  />
                               </div>
                             ))}
                          </div>
                       </div>
                       {skus.length > 1 && (
                          <Button 
                            variant="icon"
                            size="icon"
                            type="button" 
                            onClick={() => removeSku(i)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-muted hover:bg-destructive-tint hover:text-destructive transition-all"
                            icon={<Trash2 className="w-5 h-5" />}
                          />
                       )}
                    </div>
                  ))}
               </div>

               <Button 
                 variant="secondary"
                 type="button" 
                 onClick={addSku} 
                 className="mt-8 w-full border-dashed border-2 h-14"
                 icon={<Plus className="w-4 h-4" />}
               >
                  Add Style Variation
               </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Finalize ──────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="card-premium p-12 text-center space-y-8">
               <div className="w-24 h-24 rounded-[2.5rem] bg-primary-tint text-primary mx-auto flex items-center justify-center shadow-inner">
                  <Upload className="w-10 h-10" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-foreground">Attach Assets</h3>
                  <p className="text-sm text-muted font-medium mt-2 max-w-sm mx-auto">Upload the formal Purchase Order or Tech-Pack to bind this production cycle.</p>
               </div>
               
               <div 
                 onClick={() => fileRef.current?.click()}
                 className="max-w-md mx-auto border-2 border-dashed border-border/60 bg-surface-muted/40 hover:bg-surface-muted hover:border-primary/40 rounded-[2.5rem] p-10 cursor-pointer transition-all group"
               >
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                     {fileName || 'Drop files here or click to browse'}
                  </p>
                  <input ref={fileRef} name="po_file" type="file" className="hidden" onChange={e => setFileName(e.target.files?.[0]?.name || '')} />
               </div>
            </div>

            <div className="card-premium p-8 bg-primary text-primary-foreground">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Readiness Check</p>
                     <h4 className="text-xl font-bold">Flow Validation Complete</h4>
                  </div>
                  <CheckCircle2 className="w-10 h-10 opacity-40" />
               </div>
            </div>
          </div>
        )}

        {/* ── Action Buttons ────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-8 border-t border-border/50">
          <Button 
            variant="secondary"
            type="button" 
            onClick={prevStep} 
            disabled={step === 1 || isPending}
            className="px-8 h-12"
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          
          {step < 3 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              className="px-10 h-12"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              loading={isPending}
              className="px-12 h-14 text-base"
            >
              Launch Production Flow
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
