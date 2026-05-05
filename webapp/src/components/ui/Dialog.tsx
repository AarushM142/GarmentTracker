'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Info, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  type?: 'info' | 'warning' | 'danger' | 'question'
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  loading?: boolean
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  type = 'info',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
}: DialogProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const iconMap = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    danger: <AlertCircle className="w-5 h-5 text-destructive" />,
    question: <HelpCircle className="w-5 h-5 text-primary" />,
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-surface-muted flex items-center justify-center border border-border/40">
                  {iconMap[type]}
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
                  {description && <p className="text-sm text-muted font-medium mt-1">{description}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-muted transition-colors text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-8">{children}</div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-2xl h-12"
              >
                {cancelLabel}
              </Button>
              {onConfirm && (
                <Button
                  onClick={onConfirm}
                  loading={loading}
                  variant={type === 'danger' ? 'destructive' : 'primary'}
                  className="flex-1 rounded-2xl h-12"
                >
                  {confirmLabel}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
