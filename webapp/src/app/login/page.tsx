import { login, signup } from './actions'
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-secondary/5">
      {/* Background decorations - Organic blobs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 pointer-events-none bg-primary/30"
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[80px] opacity-20 pointer-events-none bg-accent/30"
      />

      <div className="relative z-10 w-full max-w-[440px] mx-auto px-4 animate-scale-in">
        <div className="card-premium overflow-hidden border border-border shadow-2xl bg-white/80 backdrop-blur-md rounded-3xl">
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center border-b border-border/50">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/20 rotate-3">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              GarmentTracker
            </h1>
          </div>

          {/* Form */}
          <div className="px-10 py-10">
            {message && (
              <div className="mb-6 p-4 rounded-2xl text-sm flex items-start gap-3 bg-destructive/10 text-destructive border border-destructive/20 animate-fade-up">
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-medium">{message}</span>
              </div>
            )}

            <form className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm bg-muted/30 border border-border focus:border-primary/40 focus:bg-white transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
                    placeholder="you@factory.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
                  Secure Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="block w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm bg-muted/30 border border-border focus:border-primary/40 focus:bg-white transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button
                  formAction={login}
                  className="w-full btn-primary justify-center py-4 rounded-full text-base font-bold shadow-xl shadow-primary/10 group"
                >
                  Log In
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button
                  formAction={signup}
                  className="w-full py-3.5 rounded-full text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all border border-border shadow-sm hover:shadow-md"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
