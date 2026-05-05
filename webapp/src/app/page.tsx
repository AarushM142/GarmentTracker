import Link from 'next/link'
import { Scissors, ShoppingBag, Package, CreditCard, BarChart3, ArrowRight, CheckCircle2, Zap, Shield, TrendingUp } from 'lucide-react'
import { ScrollRevealScript } from "@/components/ScrollRevealScript";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground relative">
      <ScrollRevealScript />
      
      {/* ── AMBIENT BLOBS (Absolute) ────────────────────────── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] bg-primary/10" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] bg-secondary/10" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-[140px] bg-accent/30" />
      </div>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="fixed top-4 inset-x-4 md:inset-x-auto md:w-[600px] md:left-1/2 md:-translate-x-1/2 z-50 flex items-center justify-between px-6 py-3 rounded-full bg-white/70 backdrop-blur-md border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
            <Scissors className="w-5 h-5" />
          </div>
          <span className="font-bold text-foreground text-lg" style={{ fontFamily: 'var(--font-heading)' }}>GarmentTracker</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-sm font-bold px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/login" className="text-sm font-bold px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-[0_4px_16px_-4px_rgba(93,112,82,0.3)]">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 pt-32 pb-16 z-10">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 animate-fade-up bg-white border border-border shadow-sm text-primary">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-xs font-bold tracking-widest uppercase">Production Management Reimagined</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 animate-fade-up text-foreground max-w-4xl"
          style={{ fontFamily: 'var(--font-heading)', animationDelay: '80ms', opacity: 0, animationFillMode: 'forwards' }}>
          From Order to <br className="hidden sm:block" />
          <span className="text-primary italic font-serif font-light tracking-normal px-2">
            Dispatch.
          </span>
        </h1>

        <p className="max-w-xl text-lg leading-relaxed mb-10 animate-fade-up text-muted-foreground font-medium"
          style={{ animationDelay: '160ms', opacity: 0, animationFillMode: 'forwards' }}>
          A unified, handcrafted production tracker for garment manufacturers — connecting planners, floor workers, inventory teams, and accounts in real time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-up"
          style={{ animationDelay: '240ms', opacity: 0, animationFillMode: 'forwards' }}>
          <Link href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-primary text-primary-foreground hover:scale-105 transition-all shadow-lg shadow-primary/20 group">
            Start for free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a href="#features"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-white text-secondary border border-border hover:bg-secondary hover:text-white transition-colors shadow-sm">
            See how it works
          </a>
        </div>

        {/* Floating stat pills */}
        <div className="flex flex-wrap justify-center gap-4 mt-16 animate-fade-up"
          style={{ animationDelay: '350ms', opacity: 0, animationFillMode: 'forwards' }}>
          {[
            { label: 'Orders Tracked', value: '10k+' },
            { label: 'On-time Delivery', value: '98%' },
            { label: 'Time Saved', value: '40%' },
          ].map(s => (
            <div key={s.label} className="px-5 py-2.5 rounded-full text-sm bg-white/50 backdrop-blur-sm border border-border shadow-sm flex items-center gap-2">
              <span className="font-bold text-primary">{s.value}</span>
              <span className="text-muted-foreground font-semibold">{s.label}</span>
            </div>
          ))}
        </div>

      </section>

      {/* ── DASHBOARD PREVIEW ───────────────────────────────── */}
      <section className="px-6 md:px-12 pb-32 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* We apply the custom organic blob shape to the dashboard preview container */}
          <div className="overflow-hidden scroll-reveal bg-card border border-border/50 shadow-2xl shadow-primary/5 card-blob-2"
            style={{ padding: '4px' }}>
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-6 py-4 bg-muted/30 rounded-t-[calc(30%-4px)]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              <div className="flex-1 mx-4 px-4 py-1.5 rounded-full text-xs text-center font-bold text-muted-foreground bg-white/50 shadow-sm border border-border/50">
                garmenttracker.app/planner
              </div>
            </div>
            {/* Fake dashboard content */}
            <div className="p-8 bg-card rounded-b-[calc(30%-4px)] min-h-[400px]">
              <div className="flex gap-8">
                {/* Sidebar preview */}
                <div className="hidden md:block w-48 space-y-2 flex-shrink-0">
                  {['Orders', 'Inventory', 'Accounts', 'Analytics', 'Floor'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold transition-colors ${i === 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
                      <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-border'}`} />
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main area preview */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-6 w-40 rounded-full animate-shimmer" />
                    <div className="h-10 w-32 rounded-full bg-primary/20" />
                  </div>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4 items-center px-6 py-4 rounded-3xl bg-white border border-border/50 shadow-sm hover:-translate-y-1 transition-transform">
                      <div className="w-20 h-4 rounded-full bg-muted" />
                      <div className="w-32 h-4 rounded-full bg-muted/50 hidden sm:block" />
                      <div className="flex-1 h-4 rounded-full bg-muted/30" />
                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                        ['bg-indigo-50 text-indigo-700', 'bg-yellow-50 text-yellow-700', 'bg-orange-50 text-orange-700', 'bg-purple-50 text-purple-700'][i]
                      }`}>
                        {['Cutting', 'QC', 'Pending', 'Stitching'][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="px-6 md:px-12 py-32 bg-white relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-widest mb-4 text-secondary">Platform Features</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Everything your factory needs
            </h2>
            <p className="mt-6 text-lg max-w-xl mx-auto text-muted-foreground font-medium">
              Designed for garment manufacturers who need real-time visibility across every stage of production, in a beautiful, tactile interface.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: ShoppingBag, title: 'Order Planning', desc: 'Create purchase orders with auto BOM calculation. Track from cutting to dispatch with full stage visibility.', shape: 'card-blob-1' },
              { icon: Package, title: 'Inventory Management', desc: 'Real-time stock tracking with automatic low-stock alerts before production bottlenecks occur.', shape: 'rounded-[3rem]' },
              { icon: CreditCard, title: 'Accounts & Logistics', desc: 'Log payments, generate delivery challans, and close POs — all from one screen.', shape: 'card-asym' },
              { icon: BarChart3, title: 'Director Analytics', desc: 'Live production metrics, fulfillment rate, and inventory health for decision makers.', shape: 'card-blob-2' },
            ].map(({ icon: Icon, title, desc, shape }, i) => (
              <div key={title} className={`group p-10 bg-card border border-border/50 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-float scroll-reveal ${shape}`}
                style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-primary/10 text-primary transition-colors duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLE SECTION ────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-32 bg-accent/30 relative z-10 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs font-bold uppercase tracking-widest mb-4 text-primary">Role-Based Access</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Built for every role
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { role: 'Planner', desc: 'Create orders, monitor BOM, track production stages.', perms: ['Create Purchase Orders', 'View BOM breakdown', 'Track stage progress'], color: 'text-secondary' },
              { role: 'Floor Worker', desc: 'View job cards and update production status on mobile.', perms: ['View assigned jobs', 'Update stage status', 'Report issues'], color: 'text-primary' },
              { role: 'Accounts', desc: 'Manage payments, generate challans, close POs.', perms: ['Log payments', 'Generate challans', 'Close orders'], color: 'text-destructive' },
            ].map(({ role, desc, perms, color }, i) => (
              <div key={role} className="p-8 rounded-[2.5rem] bg-white border border-border/50 shadow-sm scroll-reveal hover:-translate-y-1 transition-transform duration-500"
                style={{ animationDelay: `${i * 120}ms` }}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${color}`}>{role}</div>
                <p className="text-base font-medium text-foreground mb-8">{desc}</p>
                <ul className="space-y-4">
                  {perms.map(p => (
                    <li key={p} className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${color}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY SECTION ─────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-32 bg-white relative z-10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="scroll-reveal pr-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-4 text-secondary">Why GarmentTracker</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-8" style={{ fontFamily: 'var(--font-heading)' }}>
              Stop running your factory on spreadsheets.
            </h2>
            <p className="text-lg leading-relaxed mb-10 text-muted-foreground font-medium">
              Most garment factories track orders in WhatsApp groups and Excel files. GarmentTracker replaces all of that with a single source of truth — from the first order to the last delivery note.
            </p>
            <div className="space-y-6">
              {[
                { icon: Zap, label: 'Instant stage updates from the factory floor' },
                { icon: Shield, label: 'Role-based access — everyone sees only what they need' },
                { icon: TrendingUp, label: 'Live analytics for smarter production planning' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-base font-bold text-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6 scroll-reveal relative">
            {/* Soft decorative background shape behind stats */}
            <div className="absolute inset-0 bg-muted/40 rounded-[3rem] -z-10 rotate-3 scale-105" />
            
            {[
              { label: 'Order fulfillment rate',  value: 98, color: 'bg-primary' },
              { label: 'Inventory accuracy',      value: 95, color: 'bg-secondary'  },
              { label: 'Time saved vs manual',    value: 60, color: 'bg-foreground' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-6 rounded-[2rem] bg-white border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
                  <span className="text-xl font-extrabold text-foreground">{value}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="px-6 md:px-12 py-32 relative overflow-hidden z-10 border-t border-border/50 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center scroll-reveal relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 bg-white shadow-sm border border-border text-primary">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs font-bold tracking-widest uppercase">Ready to go live</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Your factory, <br />
            <span className="text-secondary italic font-serif font-light px-2">fully connected.</span>
          </h2>
          <p className="text-lg md:text-xl mb-12 max-w-xl mx-auto text-muted-foreground font-medium">
            Set up in minutes. No spreadsheets, no WhatsApp chaos. Just clean production data, everywhere you need it.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-base transition-all group bg-primary text-primary-foreground hover:scale-105 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.4)]">
            Get started for free
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="px-6 md:px-12 py-10 flex flex-col sm:flex-row items-center justify-between text-sm font-medium border-t border-border text-muted-foreground bg-white">
        <div className="flex items-center gap-2 mb-4 sm:mb-0">
          <Scissors className="w-4 h-4 text-primary" />
          <span className="font-bold text-foreground font-heading">GarmentTracker MVP</span>
        </div>
        <span>Crafted with Next.js & Supabase</span>
      </footer>
    </div>
  )
}
