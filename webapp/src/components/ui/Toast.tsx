'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-8 right-8 z-[150] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-[2rem] shadow-2xl border min-w-[300px] max-w-md bg-white",
                t.type === 'success' && "bg-primary/10 text-primary border-primary/20",
                t.type === 'error' && "bg-destructive/10 text-destructive border-destructive/20",
                t.type === 'warning' && "bg-amber-500/10 text-amber-500 border-amber-500/20"
              )}
            >
              {t.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm flex-1">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
