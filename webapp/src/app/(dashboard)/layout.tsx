import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Scissors } from "lucide-react"
import { DashboardShell } from "@/components/DashboardShell"
import { SyncStatus } from "@/components/sync/SyncStatus"

// Nav items: label, href, icon, allowed roles
const NAV_ITEMS = [
  {
    label: "Analytics",
    href: "/director",
    icon: "BarChart3",
    roles: ["super_admin", "director"],
  },
  {
    label: "Orders (Planning)",
    href: "/planner",
    icon: "ShoppingBag",
    roles: ["super_admin", "director", "production_head", "production_coordinator"],
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: "Package",
    roles: ["super_admin", "director", "production_head", "store_manager"],
  },
  {
    label: "Floor Tracker",
    href: "/floor",
    icon: "ClipboardList",
    roles: ["super_admin", "director", "production_head", "production_supervisor", "cutting_master", "store_manager"],
  },
  {
    label: "Accounts & Logistics",
    href: "/accounts",
    icon: "CreditCard",
    roles: ["super_admin", "director", "accounts_manager"],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: "Settings",
    roles: ["super_admin"],
  },
]

// Human-readable role labels
const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  director: "Director",
  production_head: "Production Head",
  production_coordinator: "Production Co-ordinator",
  production_supervisor: "Supervisor",
  store_manager: "Store Manager",
  cutting_master: "Cutting Master",
  accounts_manager: "Accounts Manager",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const role = user.user_metadata?.role || "floor"
  const roleLabel = ROLE_LABELS[role] || role
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role))

  const mobileTopBar = (
    <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-2">
        <Scissors className="w-5 h-5 text-primary" />
        <span className="text-sm font-bold text-foreground font-heading">GarmentTracker</span>
      </div>
      <div className="flex items-center gap-3">
        <SyncStatus />
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary-tint text-primary uppercase tracking-wider">
          {roleLabel}
        </span>
      </div>
    </div>
  )

  return (
    <DashboardShell 
      items={visibleNav} 
      user={user} 
      roleLabel={roleLabel}
      mobileTopBar={mobileTopBar}
    >
      {children}
    </DashboardShell>
  )
}
