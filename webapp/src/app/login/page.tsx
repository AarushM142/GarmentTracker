import { Shield, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { LoginForm } from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[40%_60%] bg-background overflow-hidden">
      
      {/* ─── LEFT SIDE: LOGIN PANEL ────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center relative px-6 py-12 lg:px-12 z-10 bg-background">
        {/* Subtle background decoration for left side */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: `radial-gradient(var(--primary) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} 
        />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary text-white shadow-2xl shadow-primary/30 mb-6 rotate-3">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              GarmentTracker
            </h1>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-[0.25em]">
              Factory Operations Platform
            </p>
            
            <div className="mt-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-tint border border-success/10 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[9px] font-black text-success uppercase tracking-widest">All systems operational</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="animate-scale-in" style={{ animationDelay: '300ms' }}>
            <div className="relative overflow-hidden bg-card border border-border shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] rounded-[2rem]">
              <div className="px-8 py-10">
                <LoginForm message={message} />
              </div>
            </div>
          </div>
          
          {/* Footer info */}
          <p className="mt-8 text-center text-[10px] font-bold text-muted uppercase tracking-widest animate-fade-in" style={{ animationDelay: '800ms' }}>
            Secure login • Encrypted connection
          </p>
        </div>
      </div>

      {/* ─── RIGHT SIDE: PRODUCT PREVIEW ──────────────────────────────────── */}
      <div className="hidden lg:flex relative bg-primary-dark overflow-hidden items-center justify-center p-12">
        {/* Blurred Dashboard Background Preview */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary-dark/95 to-primary/20 z-10" />
          
          {/* Mock Dashboard UI Elements (Blurred) */}
          <div className="absolute top-20 left-20 right-20 bottom-20 opacity-20 blur-[12px] scale-110">
             <div className="grid grid-cols-4 gap-6 mb-8">
                {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/20 rounded-2xl" />)}
             </div>
             <div className="grid grid-cols-3 gap-6 h-full">
                <div className="col-span-2 bg-white/10 rounded-3xl" />
                <div className="bg-white/10 rounded-3xl" />
             </div>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-20 max-w-xl text-center lg:text-left">
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Real-time Factory <br />
              <span className="text-primary-light">Intelligence</span>
            </h2>
            <p className="text-xl text-white/60 font-medium leading-relaxed max-w-md">
              Track orders, monitor production, and eliminate delays—live from your operational command center.
            </p>
          </div>

          {/* Floating Stats Card (Live Data) */}
          <div className="mt-12 inline-flex flex-col gap-5 p-8 glass border border-white/10 rounded-[2.5rem] shadow-2xl animate-fade-up" style={{ animationDelay: '700ms' }}>
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-success">
                   <Activity className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Lines</p>
                   <p className="text-xl font-black text-white">14 Lines Operational</p>
                </div>
             </div>
             <div className="h-px bg-white/5" />
             <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 text-warning">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase">Delayed</span>
                   </div>
                   <p className="text-lg font-black text-white">2 Orders</p>
                </div>
                <div className="space-y-1">
                   <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase">Risks</span>
                   </div>
                   <p className="text-lg font-black text-white">Critical Found</p>
                </div>
             </div>
             <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-bold text-white/40 uppercase">QC Pass Rate</span>
                   <span className="text-[10px] font-black text-success">98%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-success w-[98%] rounded-full shadow-[0_0_12px_rgba(21,128,61,0.5)]" />
                </div>
             </div>
          </div>
        </div>

        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-info/10 blur-[80px] rounded-full -ml-32 -mb-32" />
      </div>
    </div>
  )
}
