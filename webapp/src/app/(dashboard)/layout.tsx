import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  ShoppingBag, Package, CreditCard, BarChart3,
  Scissors, LogOut, Users, ClipboardList,
  Truck, CheckSquare, Settings,
} from "lucide-react"

// Nav items: label, href, icon, allowed roles
const NAV_ITEMS = [
  {
    label: "Analytics",
    href: "/director",
    icon: BarChart3,
    roles: ["super_admin", "director"],
  },
  {
    label: "Orders (Planning)",
    href: "/planner",
    icon: ShoppingBag,
    roles: ["super_admin", "director", "production_head", "production_coordinator"],
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["super_admin", "director", "production_head", "store_manager"],
  },
  {
    label: "Floor Tracker",
    href: "/floor",
    icon: ClipboardList,
    roles: ["super_admin", "director", "production_head", "production_supervisor", "cutting_master", "store_manager"],
  },
  {
    label: "Accounts & Logistics",
    href: "/accounts",
    icon: CreditCard,
    roles: ["super_admin", "director", "accounts_manager"],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: Settings,
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

  return (
    <div className="min-h-screen flex bg-background">

      {/* ─── Sidebar ───────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 flex-shrink-0 fixed inset-y-0 left-0 z-40 bg-background border-r border-border"
      >
        {/* Logo */}
        <div className="px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary text-primary-foreground shadow-[0_4px_12px_-2px_rgba(93,112,82,0.3)]">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold tracking-tight text-foreground font-heading">
                GarmentTracker
              </h1>
              <p className="text-[10px] uppercase tracking-widest mt-0.5 text-muted-foreground font-bold">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border mx-6" />

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Navigation
          </p>
          {visibleNav.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item animate-slide-in-left group"
                style={{ animationDelay: `${i * 60}ms`, opacity: 0, animationFillMode: "forwards" }}
              >
                <div className="w-8 h-8 rounded-xl bg-muted/50 text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-2xl bg-muted/30">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-secondary text-secondary-foreground flex-shrink-0">
              {user.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-foreground truncate">{user.email}</p>
              <p className="text-[10px] font-medium text-muted-foreground truncate">{roleLabel}</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="nav-item w-full text-left group">
              <div className="w-8 h-8 rounded-xl bg-muted/50 text-muted-foreground flex items-center justify-center group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ─── Mobile top bar ────────────────────────────────────── */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border"
      >
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-foreground font-heading">GarmentTracker</span>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
          {roleLabel}
        </span>
      </div>

      {/* ─── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative z-10">
        <div className="flex-1 p-4 sm:p-6 md:p-10">
          <div className="max-w-7xl mx-auto animate-fade-up relative z-10" style={{ opacity: 0, animationFillMode: "forwards" }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
