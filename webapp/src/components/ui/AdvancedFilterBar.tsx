"use client"

import { useState, useEffect, useRef } from "react"
import { Filter, Search, X, ChevronDown, Check } from "lucide-react"

export type FilterState = {
  stages: string[]
  dueDate: string
  volumes: string[]
  customerSearch: string
  sortOrder: 'asc' | 'desc'
}

export const DUE_DATE_OPTIONS = [
  { id: 'all', label: 'All Dates' },
  { id: 'overdue', label: '🔴 Overdue' },
  { id: 'today', label: '🟡 Due today' },
  { id: '3days', label: '🟡 Due in 3 days' },
  { id: 'this_week', label: '🔵 Due this week' },
  { id: 'this_month', label: '🔵 Due this month' }
]

export const VOLUME_OPTIONS = [
  { id: 'under_500', label: 'Under 500' },
  { id: '500_2000', label: '500–2000' },
  { id: '2000_5000', label: '2000–5000' },
  { id: 'over_5000', label: '5000+' }
]

export function matchDueDate(deliveryDate: string | null, bucket: string): boolean {
  if (bucket === 'all') return true
  if (!deliveryDate) return false

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const due = new Date(deliveryDate); due.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / 86_400_000)

  if (bucket === 'overdue') return diffDays < 0
  if (bucket === 'today') return diffDays === 0
  if (bucket === '3days') return diffDays >= 0 && diffDays <= 3
  if (bucket === 'this_week') return diffDays >= 0 && diffDays <= 7
  if (bucket === 'this_month') return diffDays >= 0 && diffDays <= 30

  return true
}

export function matchVolume(qty: number, buckets: string[]): boolean {
  if (buckets.length === 0) return true
  if (buckets.includes('under_500') && qty < 500) return true
  if (buckets.includes('500_2000') && qty >= 500 && qty <= 2000) return true
  if (buckets.includes('2000_5000') && qty > 2000 && qty <= 5000) return true
  if (buckets.includes('over_5000') && qty > 5000) return true
  return false
}

interface AdvancedFilterBarProps {
  availableCustomers: string[]
  availableStages: { id: string; label: string }[]
  filters: FilterState
  onChange: (filters: FilterState) => void
  onClear: () => void
}

export function AdvancedFilterBar({
  availableCustomers,
  availableStages,
  filters,
  onChange,
  onClear
}: AdvancedFilterBarProps) {

  // Load stages from localStorage on mount
  useEffect(() => {
    const savedStages = localStorage.getItem('garment-tracker-stages')
    if (savedStages) {
      try {
        const parsed = JSON.parse(savedStages)
        if (Array.isArray(parsed) && parsed.length > 0) {
          onChange({ ...filters, stages: parsed })
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  // Save stages to localStorage when they change
  useEffect(() => {
    localStorage.setItem('garment-tracker-stages', JSON.stringify(filters.stages))
  }, [filters.stages])

  // Click outside listener removed as it's no longer a dropdown

  const handleStageToggle = (id: string) => {
    const newStages = filters.stages.includes(id)
      ? filters.stages.filter(s => s !== id)
      : [...filters.stages, id]
    onChange({ ...filters, stages: newStages })
  }

  const handleVolumeToggle = (id: string) => {
    const newVolumes = filters.volumes.includes(id)
      ? filters.volumes.filter(v => v !== id)
      : [...filters.volumes, id]
    onChange({ ...filters, volumes: newVolumes })
  }

  // Customer toggle removed as we use search input directly

  const activeCount =
    (filters.stages.length > 0 ? 1 : 0) +
    (filters.dueDate !== 'all' ? 1 : 0) +
    (filters.volumes.length > 0 ? 1 : 0) +
    (filters.customerSearch !== '' ? 1 : 0)

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm animate-fade-in flex flex-col gap-4">
      {/* ── Top Row: Count & Clear ── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Filters</span>
          {activeCount > 0 && (
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filters.sortOrder}
            onChange={e => onChange({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
            className="text-xs font-semibold border-none bg-transparent text-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors"
          >
            <option value="asc">Earliest Due first</option>
            <option value="desc">Latest Due first</option>
          </select>

          {activeCount > 0 && (
            <button
              onClick={onClear}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* ── STAGES (Chips) ── */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stage</label>
          <div className="flex flex-wrap gap-2">
            {availableStages.map(stage => (
              <button
                key={stage.id}
                onClick={() => handleStageToggle(stage.id)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${filters.stages.includes(stage.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── DUE DATE (Radio-style Chips) ── */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Due Date</label>
          <div className="flex flex-wrap gap-2">
            {DUE_DATE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => onChange({ ...filters, dueDate: opt.id })}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${filters.dueDate === opt.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── VOLUME (Multi-select) ── */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volume</label>
          <div className="grid grid-cols-2 gap-2">
            {VOLUME_OPTIONS.map(vol => (
              <label
                key={vol.id}
                className={`flex items-center gap-2 text-xs font-semibold p-2 rounded-lg border cursor-pointer transition-colors ${filters.volumes.includes(vol.id) ? 'bg-primary/5 border-primary/30 text-foreground' : 'bg-background border-border text-muted-foreground hover:border-border/80'
                  }`}
              >
                <input
                  type="checkbox"
                  className="rounded border-muted-foreground/30 text-primary focus:ring-primary/30 w-3.5 h-3.5"
                  checked={filters.volumes.includes(vol.id)}
                  onChange={() => handleVolumeToggle(vol.id)}
                />
                {vol.label}
              </label>
            ))}
          </div>
        </div>

        {/* ── CUSTOMER (Search Input) ── */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              value={filters.customerSearch}
              onChange={(e) => onChange({ ...filters, customerSearch: e.target.value })}
              className="w-full text-xs font-semibold border border-border rounded-lg pl-8 pr-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {filters.customerSearch && (
              <button
                onClick={() => onChange({ ...filters, customerSearch: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
