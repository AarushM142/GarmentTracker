'use client'

import { useState, useTransition } from 'react'
import { addInventoryItem } from './actions'
import { X, Package, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

type Props = {
  onClose: () => void
}

const UNIT_OPTIONS = ['meters', 'yards', 'kg', 'grams', 'pieces', 'spools', 'rolls', 'boxes', 'litres']

export function AddMaterialModal({ onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addInventoryItem(formData)
      if (result?.error) {
        setToast({ type: 'error', msg: result.error })
      } else {
        setToast({ type: 'success', msg: 'Material added successfully!' })
        setTimeout(() => onClose(), 1200)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-premium w-full max-w-md p-8 border border-border shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Add Material
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-muted hover:bg-border transition-colors flex items-center justify-center text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-4 flex items-center gap-2 p-3 rounded-2xl text-sm font-bold border ${
            toast.type === 'success'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.msg}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Material Name <span className="text-destructive">*</span>
            </Label>
            <Input
              name="material_name"
              placeholder="e.g. Cotton Fabric, Thread, Buttons"
              className="po-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Unit <span className="text-destructive">*</span>
              </Label>
              <select
                name="unit"
                required
                className="po-input appearance-none cursor-pointer"
              >
                <option value="">Select unit…</option>
                {UNIT_OPTIONS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Opening Stock
              </Label>
              <Input
                name="quantity"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className="po-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Low Stock Alert Threshold
            </Label>
            <Input
              name="low_stock_threshold"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 20 — leaves a warning below this"
              className="po-input"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full border border-border text-muted-foreground font-bold text-sm hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 btn-primary gap-2 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Add Material
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
