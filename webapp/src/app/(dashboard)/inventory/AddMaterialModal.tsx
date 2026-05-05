'use client'

import { useState, useTransition } from 'react'
import { addInventoryItem } from './actions'
import { X, Package, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="card-premium w-full max-w-md flex flex-col max-h-[90vh] border border-border shadow-2xl animate-fade-up bg-surface overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 md:pb-6 border-b border-border/40 md:border-none flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Add Material
            </h3>
          </div>
          <Button
            variant="icon"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
            icon={<X className="w-4 h-4" />}
          />
        </div>

        <form action={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 md:pt-0 space-y-4">
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
          </div>

          {/* Sticky Footer */}
          <div className="p-6 md:p-8 md:pt-4 border-t border-border/40 md:border-none flex gap-3 flex-shrink-0 bg-surface/95 backdrop-blur-sm z-10">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              className="flex-1 min-h-[48px]"
              icon={<Package className="w-4 h-4" />}
            >
              Add Material
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
