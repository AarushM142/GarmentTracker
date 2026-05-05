'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  ShoppingBag, Package, CreditCard, BarChart3, 
  ClipboardList, Settings, LucideIcon 
} from "lucide-react"
import { cn } from "@/lib/utils"

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingBag,
  Package,
  CreditCard,
  BarChart3,
  ClipboardList,
  Settings,
}

interface NavItem {
  label: string
  href: string
  icon: string
  roles: string[]
}

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto bg-background">
      <p className="px-4 mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-muted">
        System Core
      </p>
      {items.map((item, i) => {
        const Icon = ICON_MAP[item.icon] || Settings
        const isActive = pathname.startsWith(item.href)
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative nav-pill group py-3.5 px-4",
              isActive ? "bg-primary-tint text-primary shadow-sm" : "hover:bg-surface-muted text-secondary hover:text-foreground"
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
              isActive 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "bg-surface border border-border text-muted group-hover:bg-primary-tint group-hover:text-primary group-hover:border-primary/20 shadow-sm"
            )}>
              <Icon className={cn("w-4.5 h-4.5", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
            </div>
            
            <span className={cn(
              "font-bold transition-colors ml-1",
              isActive ? "text-primary" : "text-secondary group-hover:text-foreground"
            )}>
               {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
