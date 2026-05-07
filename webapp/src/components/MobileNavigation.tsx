'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LogOut, Scissors, 
  ShoppingBag, Package, CreditCard, BarChart3, 
  ClipboardList, Settings, Menu, X, LucideIcon 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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

interface MobileNavigationProps {
  items: NavItem[]
  user: any
  roleLabel: string
}

export function MobileNavigation({ items, user, roleLabel }: MobileNavigationProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  // Max 4 items on bottom nav + 1 Menu item
  const bottomNavItems = items.slice(0, 4)
  const drawerItems = items

  return (
    <>
      {/* ── BOTTOM NAVIGATION (Max 5 items) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-safe flex items-center justify-around px-2 py-2">
        {bottomNavItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || Settings
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[44px] min-h-[44px]",
                isActive ? "text-[#2F3E34]" : "text-gray-500"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all mb-1",
                isActive ? "bg-[#DDE2DB] text-[#2F3E34]" : "bg-transparent text-gray-400"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
              </div>
              <span className="text-[9px] font-bold tracking-tight truncate max-w-[60px] text-center">
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Menu Item */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center p-2 rounded-xl text-gray-500 min-w-[44px] min-h-[44px]"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent text-gray-400 mb-1">
            <Menu className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[9px] font-bold tracking-tight text-center">
            Menu
          </span>
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="absolute top-0 right-0 bottom-0 w-[80%] max-w-[300px] bg-[#f7f7f5] shadow-2xl animate-slide-in-right flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2F3E34] text-white flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1a1a1a] font-heading">GarmentTracker</h2>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{roleLabel}</p>
                </div>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200 min-w-[44px] min-h-[44px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {drawerItems.map((item) => {
                const Icon = ICON_MAP[item.icon] || Settings
                const isActive = pathname.startsWith(item.href)
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-4 py-3 px-4 rounded-xl transition-all min-h-[44px]",
                      isActive 
                        ? "bg-[#DDE2DB] text-[#2F3E34]" 
                        : "text-gray-600 hover:bg-gray-200/50"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-gray-200 bg-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2F3E34] text-white flex items-center justify-center font-bold text-sm">
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-800 truncate">{user.email}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{roleLabel}</p>
                </div>
              </div>
              
              <form action="/auth/signout" method="post">
                <Button 
                  variant="secondary" 
                  className="w-full justify-start h-12 rounded-xl text-destructive font-bold hover:bg-destructive/10 hover:text-destructive border border-destructive/20 bg-destructive/5"
                  icon={<LogOut className="w-4 h-4 mr-2" />}
                >
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
