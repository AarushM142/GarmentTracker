'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, Plus, FileText, CheckCircle2 } from "lucide-react"
import { addStock, generatePurchaseRequest } from "./actions"
import { cn } from "@/lib/utils"
import { Dialog } from "@/components/ui/Dialog"
import { useToast } from "@/components/ui/Toast"

type InventoryItem = {
  id: string
  material_name: string
  unit: string
  quantity_on_hand: number
  low_stock_threshold: number | null
  updated_at: string
}

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Dialog State
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean
    type: 'stock' | 'pr'
    itemId: string
    itemName: string
    value: string
  }>({
    isOpen: false,
    type: 'stock',
    itemId: '',
    itemName: '',
    value: ''
  })
  const router = useRouter()

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 30000)
    return () => clearInterval(interval)
  }, [router])

  const openAddStock = (id: string, name: string) => {
    setDialogConfig({ isOpen: true, type: 'stock', itemId: id, itemName: name, value: '' })
  }

  const openPR = (id: string, name: string) => {
    setDialogConfig({ isOpen: true, type: 'pr', itemId: id, itemName: name, value: '' })
  }

  const handleConfirmAction = async () => {
    const { type, itemId, value } = dialogConfig
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setErrorMsg("Please enter a valid positive number.")
      return
    }
    
    setLoadingId(itemId)
    let res: any
    if (type === 'stock') {
      res = await addStock(itemId, Number(value))
    } else {
      res = await generatePurchaseRequest(itemId, Number(value))
    }
    
    setLoadingId(null)
    if (res.error) {
      setErrorMsg(res.error)
      toast(res.error, 'error')
    } else {
      setDialogConfig(prev => ({ ...prev, isOpen: false }))
      toast(type === 'stock' ? "Stock added" : `Purchase request created (${res.prNumber || ''})`, 'success')
      router.refresh()
    }
  }

  if (items.length === 0) {
    return (
      <div className="card-premium p-16 text-center border border-border shadow-sm max-w-4xl mx-auto">
        <div className="w-16 h-16 rounded-[2rem] mx-auto mb-6 flex items-center justify-center bg-secondary/10 text-secondary shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>No materials found</h3>
        <p className="mt-2 text-sm text-muted-foreground font-medium">Add your first material to start tracking inventory.</p>
      </div>
    )
  }

  const lowStockCount = items.filter(i => i.low_stock_threshold != null && i.quantity_on_hand <= i.low_stock_threshold).length

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full px-4">
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-[1.5rem] text-sm font-bold animate-fade-up animate-low-stock-pulse bg-destructive/10 border border-destructive/20 text-destructive shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{lowStockCount} material{lowStockCount > 1 ? "s" : ""} below stock threshold</span>
        </div>
      )}

      <div className="card-premium overflow-hidden border border-border shadow-sm bg-white rounded-[2rem]">
        {/* Mobile View: Card Layout */}
        <div className="md:hidden divide-y divide-border/50">
          {items.map((item, i) => {
            const isLow = item.low_stock_threshold != null && item.quantity_on_hand <= item.low_stock_threshold
            const isCritical = item.low_stock_threshold != null && item.quantity_on_hand <= (item.low_stock_threshold / 2)

            return (
              <div 
                key={item.id} 
                className={cn(
                  "p-4 animate-fade-up transition-all hover:bg-surface-hover border-l-4",
                  isCritical ? "border-l-destructive bg-destructive/5" :
                  isLow ? "border-l-warning bg-warning/5" :
                  "border-l-transparent hover:border-l-border"
                )}
                style={{ animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: "forwards" }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-foreground text-lg">{item.material_name}</span>
                  {isCritical ? (
                    <span className="inline-flex px-3 py-1 bg-destructive/10 text-destructive rounded-full text-[10px] font-bold uppercase tracking-wider border border-destructive/20">
                      Critical
                    </span>
                  ) : isLow ? (
                    <span className="inline-flex px-3 py-1 bg-warning/10 text-warning rounded-full text-[10px] font-bold uppercase tracking-wider border border-warning/20">
                      Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-bold uppercase tracking-wider border border-success/20">
                      Optimal
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Stock</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={cn(
                        "font-black tabular-nums text-2xl tracking-tight",
                        isCritical ? 'text-destructive' : isLow ? 'text-warning' : 'text-foreground'
                      )}>
                        {item.quantity_on_hand.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">{item.unit}</span>
                    </div>
                    {item.low_stock_threshold != null && (
                      <span className="text-[10px] text-muted-foreground font-medium mt-1">Min: {item.low_stock_threshold.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 border-t border-border/50 pt-3">
                  <button onClick={() => openAddStock(item.id, item.material_name)} disabled={loadingId === item.id} 
                    className="flex-1 py-2 flex items-center justify-center gap-2 rounded-xl bg-surface-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all border border-border/40 hover:border-primary/20 min-h-[44px]"
                    title="Add Stock">
                    <Plus className="w-4.5 h-4.5" />
                    <span className="text-xs font-bold">Add</span>
                  </button>
                  <button onClick={() => openPR(item.id, item.material_name)} disabled={loadingId === item.id}
                    className="flex-1 py-2 flex items-center justify-center gap-2 rounded-xl bg-surface-muted/50 text-muted-foreground hover:bg-secondary/10 hover:text-secondary transition-all border border-border/40 hover:border-secondary/20 min-h-[44px]"
                    title="Generate Purchase Request">
                    <FileText className="w-4.5 h-4.5" />
                    <span className="text-xs font-bold">Request</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop View: Table Layout */}
        <div className="hidden md:block">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-surface-muted/50 border-b-2 border-border hover:bg-surface-muted/50">
                <TableHead className="w-[40%] font-black text-xs uppercase tracking-wider text-foreground py-6 pl-8">Material</TableHead>
                <TableHead className="w-[15%] font-black text-xs uppercase tracking-wider text-foreground py-6 text-right">Quantity</TableHead>
                <TableHead className="w-[15%] font-black text-xs uppercase tracking-wider text-foreground py-6 pl-6">Unit</TableHead>
                <TableHead className="w-[15%] font-black text-xs uppercase tracking-wider text-foreground py-6 text-center">Status</TableHead>
                <TableHead className="w-[15%] font-black text-xs uppercase tracking-wider text-foreground py-6 pr-8 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => {
                const isLow = item.low_stock_threshold != null && item.quantity_on_hand <= item.low_stock_threshold
                const isCritical = item.low_stock_threshold != null && item.quantity_on_hand <= (item.low_stock_threshold / 2)

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "group animate-fade-up transition-all duration-300 hover:bg-surface-hover hover:scale-[1.002] hover:shadow-sm relative z-0 hover:z-10 bg-surface border-b border-border/40 last:border-none",
                      isCritical ? "border-l-4 border-l-destructive bg-destructive/5" :
                      isLow ? "border-l-4 border-l-warning bg-warning/5" :
                      "border-l-4 border-l-transparent hover:border-l-border"
                    )}
                    style={{ animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: "forwards" }}
                  >
                    <TableCell className="font-bold text-foreground py-6 pl-8">{item.material_name}</TableCell>
                    <TableCell className="text-right py-6">
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn(
                            "font-black tabular-nums text-xl tracking-tight",
                            isCritical ? 'text-destructive' : isLow ? 'text-warning' : 'text-foreground'
                          )}>
                            {item.quantity_on_hand.toLocaleString()}
                          </span>
                        </div>
                        {item.low_stock_threshold != null && (
                          <span className="text-[10px] text-muted-foreground font-medium mt-1">Min: {item.low_stock_threshold.toLocaleString()}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-semibold text-xs uppercase tracking-wider py-6 pl-6">{item.unit}</TableCell>
                    <TableCell className="py-6 text-center">
                      {isCritical ? (
                        <span className="inline-flex px-3 py-1 bg-destructive/10 text-destructive rounded-full text-[10px] font-bold uppercase tracking-wider border border-destructive/20 shadow-sm">
                          Critical
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex px-3 py-1 bg-warning/10 text-warning rounded-full text-[10px] font-bold uppercase tracking-wider border border-warning/20 shadow-sm">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex px-4 py-1 bg-success/10 text-success rounded-full text-[10px] font-bold uppercase tracking-wider border border-success/20 shadow-sm">
                          Optimal
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-6 pr-8">
                      <div className="flex justify-end">
                        <div className="inline-flex gap-1.5 p-1 bg-surface-muted/30 rounded-2xl border border-border/40 transition-all group-hover:border-border/80 group-hover:bg-surface-muted/50 group-hover:shadow-sm">
                          <button onClick={() => openAddStock(item.id, item.material_name)} disabled={loadingId === item.id} 
                            className="group/btn relative p-2.5 rounded-xl bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                            aria-label="Add Stock">
                            <Plus className="w-4 h-4" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">Add Stock</span>
                          </button>
                          <button onClick={() => openPR(item.id, item.material_name)} disabled={loadingId === item.id}
                            className="group/btn relative p-2.5 rounded-xl bg-transparent text-muted-foreground hover:bg-secondary/10 hover:text-secondary transition-all"
                            aria-label="Create Purchase Request">
                            <FileText className="w-4 h-4" />
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">Create Purchase Request</span>
                          </button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        isOpen={dialogConfig.isOpen}
        onClose={() => {
          setDialogConfig(prev => ({ ...prev, isOpen: false }))
          setErrorMsg(null)
        }}
        title={dialogConfig.type === 'stock' ? 'Add Inventory' : 'New Purchase Request'}
        description={dialogConfig.type === 'stock' 
          ? `Enter the quantity of ${dialogConfig.itemName} received.` 
          : `Generate a purchase request for ${dialogConfig.itemName}.`}
        type={dialogConfig.type === 'stock' ? 'info' : 'question'}
        confirmLabel={dialogConfig.type === 'stock' ? 'Add Stock' : 'Create Request'}
        onConfirm={handleConfirmAction}
        loading={loadingId === dialogConfig.itemId}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary">
              Quantity to {dialogConfig.type === 'stock' ? 'Add' : 'Request'}
            </label>
            <input
              type="number"
              autoFocus
              value={dialogConfig.value}
              onChange={(e) => setDialogConfig(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmAction()
              }}
              className="w-full bg-surface-muted border border-border rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all tabular-nums"
              placeholder="0.00"
            />
          </div>
          {errorMsg && (
            <p className="text-[11px] font-bold text-destructive flex items-center gap-1.5 animate-shake">
              <AlertTriangle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  )
}
