import { createClient } from "@/lib/supabase/server"
import { InventoryTable } from "./InventoryTable"
import { Package } from "lucide-react"
import { Suspense } from "react"
import { AddMaterialButton } from "./AddMaterialButton"

export const dynamic = 'force-dynamic'

async function InventoryListContainer() {
  const supabase = await createClient()
  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('*')
    .order('material_name', { ascending: true })

  if (error) {
    return (
      <div className="p-4 rounded-2xl text-sm bg-destructive/10 text-destructive border border-destructive/20">
        Failed to load inventory: {error.message}
      </div>
    )
  }

  return <InventoryTable items={inventory || []} />
}

function InventorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 rounded-2xl animate-shimmer" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )
}

export default function InventoryDashboard() {
  return (
    <div className="space-y-7 relative z-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-secondary/10 text-secondary shadow-sm">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Inventory
            </h2>
            <p className="text-sm mt-1 text-muted-foreground font-medium">
              Track fabric and trim stock levels
            </p>
          </div>
        </div>
        <AddMaterialButton />
      </div>

      <Suspense fallback={<InventorySkeleton />}>
        <InventoryListContainer />
      </Suspense>
    </div>
  )
}
