'use client'

import * as React from 'react'
import { Sidebar } from './Sidebar'
import { MobileNavigation } from './MobileNavigation'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  children: React.ReactNode
  items: any[]
  user: any
  roleLabel: string
  mobileTopBar: React.ReactNode
}

export function DashboardShell({ 
  children, 
  items, 
  user, 
  roleLabel, 
  mobileTopBar
}: DashboardShellProps) {
  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#f7f7f5]">
      {/* Permanent App Sidebar */}
      <Sidebar 
        items={items} 
        user={user} 
        roleLabel={roleLabel} 
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden pb-[70px] md:pb-0">
        {/* Mobile top bar - Hidden on MD+ */}
        {mobileTopBar}

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll scroll-smooth relative z-0">
          <div className="p-4 md:p-12 lg:p-16 w-full">
            <div className="max-w-[1400px] mx-auto relative">
              {children}
            </div>
          </div>
        </main>
        
        {/* Mobile Navigation */}
        <MobileNavigation items={items} user={user} roleLabel={roleLabel} />
      </div>
    </div>
  )
}
