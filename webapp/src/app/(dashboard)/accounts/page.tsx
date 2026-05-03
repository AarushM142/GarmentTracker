import { createClient } from "@/lib/supabase/server"
import { AccountsDashboard } from "./AccountsDashboard"
import { CreditCard } from "lucide-react"
import { Suspense } from "react"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

async function AccountsContainer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders, error } = await supabase
    .from('purchase_orders')
    .select('id, po_number, customer_name, status, po_amount_inr, advance_amount_inr, sku_list, courier_name, tracking_number, packed_quantity, credit_approved, delivery_proofs(id, public_url)')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-4 rounded-2xl text-sm bg-destructive/10 text-destructive border border-destructive/20">
        Failed to load orders: {error.message}
      </div>
    )
  }

  return <AccountsDashboard orders={orders || []} />
}

export default function AccountsPage() {
  return (
    <div className="space-y-7 relative z-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-secondary/10 text-secondary shadow-sm">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Financials & Dispatch
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            Manage dispatch logistics, compliance docs, and payment receipts.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="h-64 rounded-2xl animate-shimmer" />}>
        <AccountsContainer />
      </Suspense>
    </div>
  )
}
