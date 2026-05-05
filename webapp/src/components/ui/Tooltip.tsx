'use client'

import * as React from 'react'

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
    </div>
  )
}

export function TooltipTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  return <>{children}</>
}

export function TooltipContent({ children, side = 'top', className = '' }: { children: React.ReactNode, side?: string, className?: string }) {
  return (
    <div className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg shadow-sm dark:bg-slate-700 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap ${side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : 'left-full top-1/2 -translate-y-1/2 ml-2'} ${className}`}>
      {children}
    </div>
  )
}
