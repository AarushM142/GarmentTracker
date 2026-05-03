import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "./OrdersTable"
import Link from "next/link"
import { ShoppingBag, Plus } from "lucide-react"
import { Suspense } from "react"

export const dynamic = 'force-dynamic'

async function OrdersContainer() {
  const supabase = await createClient()
  const { data: orders, error } = await supabase
    .from("purchase_orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <div className="p-4 rounded-2xl text-sm bg-destructive/10 text-destructive border border-destructive/20">
        Failed to load orders: {error.message}
      </div>
    )
  }

  return <OrdersTable orders={orders || []} />
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-2xl animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  )
}

export default function PlannerPage() {
  return (
    <div className="space-y-7 relative z-10">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10 text-primary shadow-sm">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Purchase Orders
            </h2>
            <p className="text-sm mt-1 text-muted-foreground font-medium">
              Manage and track all active production orders
            </p>
          </div>
        </div>
        <Link href="/planner/new-order" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Order
        </Link>
      </div>

      {/* Orders Table */}
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContainer />
      </Suspense>
    </div>
  )
}
