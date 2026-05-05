import POForm from "./POForm"
import Link from "next/link"

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted mb-2">
          <Link href="/planner" className="hover:text-foreground">Planner</Link>
          <span>/</span>
          <span className="text-foreground font-medium">New Order</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Purchase Order</h2>
        <p className="text-muted">Enter order details to automatically generate the Bill of Materials.</p>
      </div>
      
      <POForm />
    </div>
  )
}
