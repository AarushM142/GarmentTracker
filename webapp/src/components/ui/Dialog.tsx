'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Info, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { useMediaQuery } from '@/hooks/use-media-query'

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
  className?: string
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
  className
}: DialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

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
        <div className={cn(
          "fixed inset-0 z-[250] flex items-center justify-center",
          isDesktop ? "p-4" : "p-0"
        )}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Dialog / Sheet Content */}
          <motion.div
            initial={isDesktop 
              ? { opacity: 0, scale: 0.95, y: 10 } 
              : { y: '100%' }
            }
            animate={isDesktop 
              ? { opacity: 1, scale: 1, y: 0 } 
              : { y: 0 }
            }
            exit={isDesktop 
              ? { opacity: 0, scale: 0.95, y: 10 } 
              : { y: '100%' }
            }
            transition={isDesktop 
              ? { type: 'spring', damping: 25, stiffness: 300 } 
              : { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }
            }
            className={cn(
              "relative flex flex-col bg-white shadow-2xl border border-gray-100 overflow-hidden",
              isDesktop 
                ? "w-full max-w-md rounded-[2.5rem] p-8" 
                : "w-full mt-auto rounded-t-[2.5rem] p-6 pb-10 max-h-[90vh]",
              className
            )}
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            {!isDesktop && (
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 flex-shrink-0" />
            )}

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                  {iconMap[type]}
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#1a1a1a]">{title}</h3>
                  {description && <p className="text-sm text-gray-400 font-medium mt-1">{description}</p>}
                </div>
              </div>
              {isDesktop && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto mb-8 sidebar-scroll pr-1">
              {children}
            </div>

            <div className="flex gap-3 mt-auto">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-2xl h-12 text-sm font-bold"
              >
                {cancelLabel}
              </Button>
              {onConfirm && (
                <Button
                  onClick={onConfirm}
                  loading={loading}
                  variant={type === 'danger' ? 'destructive' : 'primary'}
                  className={cn(
                    "flex-1 rounded-2xl h-12 text-sm font-bold",
                    type === 'danger' ? "bg-destructive text-white" : "bg-[#2F3E34] text-white"
                  )}
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
