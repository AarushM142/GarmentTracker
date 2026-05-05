'use client'

import { useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { login, signup } from './actions'
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

function LoginButton({ formAction, children, variant = 'primary' }: { 
  formAction: (formData: FormData) => void, 
  children: React.ReactNode,
  variant?: 'primary' | 'secondary'
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      formAction={formAction}
      loading={pending}
      variant={variant === 'primary' ? 'primary' : 'secondary'}
      className="w-full h-14 text-base"
      icon={variant === 'primary' ? <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> : undefined}
      iconPosition="right"
    >
      {children}
    </Button>
  )
}

export function LoginForm({ message: initialMessage }: { message?: string }) {
  const [message, setMessage] = useState(initialMessage)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  const checkCapsLock = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLock(true)
    } else {
      setCapsLock(false)
    }
  }

  return (
    <div className="animate-fade-up">
      {message && (
        <div className="mb-6 p-4 rounded-2xl text-sm flex items-start gap-3 bg-destructive-tint border border-destructive/20 animate-fade-in">
          <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
          <span className="font-medium text-foreground">{message}</span>
        </div>
      )}

      <form className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2.5">
          <label htmlFor="email" className="block text-[11px] font-black text-secondary uppercase tracking-[0.15em] px-1">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors duration-300">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="block w-full rounded-2xl pl-11 pr-4 py-4 text-sm bg-surface-muted border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 focus:bg-surface transition-all duration-300 outline-none text-foreground placeholder:text-muted/50"
              placeholder="you@factory.com"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="password" className="block text-[11px] font-black text-secondary uppercase tracking-[0.15em]">
              Secure Password
            </label>
            <button 
              type="button" 
              onClick={() => setMessage("If this account exists, a password reset link has been sent to your factory email.")}
              className="text-[11px] font-bold text-primary hover:text-primary-dark transition-colors"
            >
              Forgot?
            </button>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors duration-300">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              onKeyUp={checkCapsLock}
              className="block w-full rounded-2xl pl-11 pr-12 py-4 text-sm bg-surface-muted border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 focus:bg-surface transition-all duration-300 outline-none text-foreground placeholder:text-muted/50"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-primary transition-colors duration-300"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {capsLock && (
            <p className="text-[10px] font-bold text-warning flex items-center gap-1.5 px-1 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              Caps Lock is ON
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-4">
          <LoginButton formAction={login}>
            Access Dashboard
          </LoginButton>
          
          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <LoginButton formAction={signup} variant="secondary">
            Request System Access
          </LoginButton>
        </div>
      </form>

      {/* Trust Signals */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          <span>Secure login • Encrypted connection</span>
        </div>
        <p className="text-[10px] text-muted/60 font-medium italic">
          &quot;Trusted by 500+ production teams daily&quot;
        </p>
      </div>
    </div>
  )
}
