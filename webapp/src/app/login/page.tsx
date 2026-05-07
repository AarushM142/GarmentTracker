import { Scissors, Activity, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { LoginForm } from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">

      {/* ─── LEFT: LOGIN PANEL ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:px-16">
        <div className="w-full max-w-sm">

          {/* Brand */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <Scissors className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-base font-black text-foreground leading-none" style={{ fontFamily: 'var(--font-heading)' }}>
                GarmentTracker
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
                Factory ERP
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium">
              Sign in to your operations dashboard.
            </p>
          </div>

          {/* Form */}
          <LoginForm message={message} />

          {/* Footer */}
          <p className="mt-10 text-center text-[10px] text-muted-foreground/50 font-medium">
            By signing in, you agree to the{' '}
            <span className="underline underline-offset-2">Terms of Service</span>.
          </p>
        </div>
      </div>

      {/* ─── DIVIDER (desktop only) ─────────────────────────────────────────── */}
      <div className="hidden lg:block w-px bg-border/60 my-12" />

      {/* ─── RIGHT: PRODUCT PREVIEW ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center px-16 py-16 bg-[var(--color-surface-muted,hsl(0_0%_98%))]">
        <div className="w-full max-w-sm space-y-10">

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-foreground leading-snug tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Real-time factory{' '}
              <span className="text-primary">intelligence.</span>
            </h2>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Track orders, monitor production lines, and eliminate delays—all from one command center.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {[
              'Live floor-level production tracking',
              'Automated BOM & material shortfall alerts',
              'Role-based access for every team member',
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-foreground font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Stats card — single, grounded, no overlap */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">

            {/* Header stat */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Lines</p>
                <p className="text-base font-black text-foreground">14 Lines Operational</p>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Two sub-stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Delayed</span>
                </div>
                <p className="text-lg font-black text-foreground">2 Orders</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  <span className="text-[10px] font-bold text-destructive uppercase tracking-wide">Risks</span>
                </div>
                <p className="text-lg font-black text-foreground">Critical Found</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">QC Pass Rate</span>
                <span className="text-[10px] font-black text-primary">98%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[98%] rounded-full" />
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
