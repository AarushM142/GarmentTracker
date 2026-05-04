import { createClient } from "@/lib/supabase/server"
import { OrdersTable } from "./OrdersTable"
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
    <div className="relative z-10">
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContainer />
      </Suspense>
    </div>
  )
}
