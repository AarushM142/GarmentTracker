'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { login, signup, resetPassword } from './actions'
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Submit button — tracks pending state via useFormStatus ── */
function SubmitButton({
  formAction,
  children,
  variant = 'primary',
}: {
  formAction: (formData: FormData) => void
  children: React.ReactNode
  variant?: 'primary' | 'ghost'
}) {
  const { pending } = useFormStatus()

  return (
    <button
      formAction={formAction}
      disabled={pending}
      className={cn(
        'relative w-full flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-200 px-4 py-3.5 disabled:opacity-60 disabled:pointer-events-none',
        variant === 'primary'
          ? 'bg-primary text-white shadow-sm shadow-primary/20 hover:brightness-110 active:brightness-95'
          : 'bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
      )}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {children}
          {variant === 'primary' && <ArrowRight className="w-4 h-4 ml-auto" />}
        </>
      )}
    </button>
  )
}

/* ── Main form component ── */
export function LoginForm({ message: initialMessage }: { message?: string }) {
  const [message, setMessage] = useState(initialMessage)
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [isPendingReset, setIsPendingReset] = useState(false)

  const setFeedback = (msg: string, type: 'error' | 'success') => {
    setMessage(msg)
    setMessageType(type)
  }

  return (
    <div className="space-y-6">

      {/* Feedback banner */}
      {message && (
        <div
          className={cn(
            'flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border',
            messageType === 'error'
              ? 'bg-destructive/5 border-destructive/20 text-destructive'
              : 'bg-primary/5 border-primary/20 text-primary'
          )}
        >
          {messageType === 'error'
            ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          }
          <span>{message}</span>
        </div>
      )}

      <form className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-bold text-muted-foreground">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@factory.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-xs font-bold text-muted-foreground">
              Password
            </label>
            <button
              type="button"
              disabled={isPendingReset}
              onClick={async () => {
                const emailInput = document.getElementById('email') as HTMLInputElement
                const email = emailInput?.value?.trim()
                if (!email || !email.includes('@')) {
                  setFeedback('Enter your email address first.', 'error')
                  emailInput?.focus()
                  return
                }
                setIsPendingReset(true)
                const res = await resetPassword(email)
                setIsPendingReset(false)
                if (res?.error) setFeedback('Error: ' + res.error, 'error')
                else setFeedback('Reset link sent — check your inbox.', 'success')
              }}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
            >
              {isPendingReset && <Loader2 className="w-3 h-3 animate-spin" />}
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
              className="w-full pl-10 pr-11 py-3 rounded-xl text-sm border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {capsLock && (
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              Caps Lock is on
            </p>
          )}
        </div>

        {/* Primary CTA */}
        <div className="pt-2 space-y-3">
          <SubmitButton formAction={login} variant="primary">
            Sign in to dashboard
          </SubmitButton>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <SubmitButton formAction={signup} variant="ghost">
            Request system access
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}
