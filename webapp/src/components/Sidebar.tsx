'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LogOut, Scissors, 
  ShoppingBag, Package, CreditCard, BarChart3, 
  ClipboardList, Settings, LucideIcon 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SyncStatus } from './sync/SyncStatus'

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

interface SidebarProps {
  items: NavItem[]
  user: {
    email?: string
  }
  roleLabel: string
}

export function Sidebar({ items, user, roleLabel }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col flex-shrink-0 h-full w-64 bg-[#f7f7f5] border-r border-gray-200 z-[100]">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 px-6 py-10">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#2F3E34] text-white shadow-lg flex-shrink-0">
          <Scissors className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-[18px] font-bold tracking-tight text-[#1a1a1a] font-heading whitespace-nowrap leading-none" style={{ fontFamily: 'var(--font-heading), serif' }}>
            GarmentTracker
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] mt-1.5 text-gray-400 font-bold whitespace-nowrap">
            {roleLabel}
          </p>
        </div>
      </div>

      <div className="h-px bg-gray-200 mx-6" />

      {/* ── NAVIGATION (Inner Scrolling) ── */}
      <nav className="flex-1 px-0 py-6 space-y-1.5 overflow-y-auto sidebar-scroll scrollbar-hide">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] || Settings
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-4 py-3 transition-all duration-300 group overflow-hidden",
                isActive 
                  ? "bg-[#DDE2DB] text-[#2F3E34] border-l-[6px] border-[#2F3E34] pl-5 rounded-r-[3rem] mx-0" 
                  : "text-gray-500 hover:bg-gray-200/50 hover:text-black pl-[26px] mx-2 rounded-2xl"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 shadow-sm",
                isActive 
                  ? "bg-[#2F3E34] text-white" 
                  : "bg-white border border-gray-100 text-gray-400 group-hover:bg-[#DDE2DB] group-hover:text-[#2F3E34]"
              )}>
                <Icon className={cn("w-4.5 h-4.5", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
              </div>

              <span className="font-bold text-[13px] truncate transition-all tracking-tight">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── FOOTER / PROFILE ── */}
      <div className="px-4 py-6 pb-8 border-t border-gray-200 bg-[#f0f0ed]/30 flex-shrink-0">
        <div className="mb-5 flex justify-start px-2">
          <SyncStatus />
        </div>

        <div className="flex items-center gap-4 mb-5 px-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-white text-[#2F3E34] flex-shrink-0 border border-gray-200 shadow-md">
            {user.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-gray-800 truncate">{user.email}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight mt-0.5">{roleLabel}</p>
          </div>
        </div>
        
        <form action="/auth/signout" method="post">
          <Button 
            variant="secondary" 
            className="w-full justify-start bg-transparent border-none shadow-none h-11 px-2 text-xs font-bold text-gray-500 hover:bg-gray-200 hover:text-black transition-all group"
            icon={<div className="w-8 h-8 rounded-full bg-[#2F3E34] flex items-center justify-center text-white mr-3 flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"><LogOut className="w-3.5 h-3.5" /></div>}
          >
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  )
}
