'use client'

import { useState } from "react"
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

type InventoryItem = {
  id: string
  material_name: string
  unit: string
  quantity_on_hand: number
  low_stock_threshold: number | null
  updated_at: string
}

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleAddStock = async (id: string) => {
    const qty = prompt("Enter quantity to add:")
    if (!qty || isNaN(Number(qty))) return
    
    setLoadingId(id)
    const res = await addStock(id, Number(qty))
    setLoadingId(null)
    
    if (res.error) alert(res.error)
    else showSuccess("Stock updated successfully!")
  }

  const handlePR = async (id: string, name: string) => {
    const qty = prompt(`Enter PR quantity for ${name}:`)
    if (!qty || isNaN(Number(qty))) return
    
    setLoadingId(id)
    const res = await generatePurchaseRequest(id, Number(qty))
    setLoadingId(null)
    
    if (res.error) alert(res.error)
    else showSuccess(`PR ${res.prNumber} generated!`)
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  if (items.length === 0) {
    return (
      <div className="card-premium p-16 text-center border border-border shadow-sm">
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
    <div className="space-y-4">
      {successMsg && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-[1.5rem] text-sm font-bold bg-primary/10 text-primary border border-primary/20 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5" /> {successMsg}
        </div>
      )}

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-[1.5rem] text-sm font-bold animate-fade-up animate-low-stock-pulse bg-destructive/10 border border-destructive/20 text-destructive shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{lowStockCount} material{lowStockCount > 1 ? "s" : ""} below stock threshold</span>
        </div>
      )}

      <div className="card-premium overflow-hidden border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border hover:bg-muted/30">
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-4">Material</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-4 text-right">Quantity</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-4">Unit</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-4">Status</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => {
              const isLow = item.low_stock_threshold != null && item.quantity_on_hand <= item.low_stock_threshold

              return (
                <TableRow
                  key={item.id}
                  className="animate-fade-up transition-colors hover:bg-muted/30 border-border"
                  style={{ animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: "forwards" }}
                >
                  <TableCell className="font-bold text-foreground py-4">{item.material_name}</TableCell>
                  <TableCell className="text-right py-4">
                    <span className={`font-extrabold tabular-nums ${isLow ? 'text-destructive' : 'text-foreground'}`}>
                      {item.quantity_on_hand.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-semibold py-4">{item.unit}</TableCell>
                  <TableCell className="py-4">
                    {isLow ? (
                      <span className="inline-flex px-3 py-1.5 bg-destructive/10 text-destructive rounded-full text-[10px] font-bold uppercase tracking-wider border border-destructive/20">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                        Optimal
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleAddStock(item.id)} disabled={loadingId === item.id} 
                        className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors tooltip-trigger"
                        title="Add Stock">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => handlePR(item.id, item.material_name)} disabled={loadingId === item.id}
                        className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-secondary/20 hover:text-secondary transition-colors tooltip-trigger"
                        title="Generate Purchase Request">
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
