"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Mail, Lock, Eye, EyeOff, Swords, TrendingUp } from 'lucide-react'

// Type for a single particle's style
type ParticleStyle = {
  left: string;
  top: string;
  boxShadow: string;
  animation: string;
  animationDelay: string;
};

// Helper component to render particles only on client
const Particles = () => {
  const [particles, setParticles] = useState<ParticleStyle[]>([]);
  useEffect(() => {
    const arr = Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      boxShadow: '0 0 4px rgba(168, 85, 247, 0.6)',
      animation: `float ${8 + Math.random() * 8}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 5}s`,
    }));
    setParticles(arr);
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((style, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-purple-400 rounded-full"
          style={style}
        />
      ))}
    </div>
  );
};


export default function SignInPage() {
  const router = useRouter()
  const { login, isLoading, error: authError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    try {
      setError('')
      
      // Call login from auth context
      const response = await login(email, password)
      
      console.log('[SignIn] Login response:', response)

      // Check if profile is incomplete or requires registration
      if (response?.requiresRegistration || response?.error === 'UserNotFound' || response?.error === 'ProfileNotFound' || response?.error === 'IncompleteProfile') {
        console.log('[SignIn] Profile incomplete, redirecting to signup')
        setError('Your profile is incomplete. Redirecting to complete registration...')
        
        // Clear any stored token
        localStorage.removeItem('token')
        
        // Redirect to signup after a short delay
        setTimeout(() => {
          router.push('/signup')
        }, 1500)
        return
      }

      // Check if profile is complete but missing some data
      if (response?.profileComplete === false && !response?.requiresRegistration) {
        console.log('[SignIn] Profile incomplete but not critical, redirecting to complete profile')
        setError('Setting up your profile...')
        
        setTimeout(() => {
          router.push('/complete-profile')
        }, 1000)
        return
      }

      // Successful login
      console.log('[SignIn] Login successful, redirecting to dashboard')
      router.push('/dashboard')
      
    } catch (err: any) {
      console.error('[SignIn] Login error:', err)
      
      // Handle specific error cases
      if (err?.response?.data?.requiresRegistration || 
          err?.response?.data?.error === 'UserNotFound' || 
          err?.response?.data?.error === 'ProfileNotFound' ||
          err?.response?.data?.error === 'IncompleteProfile') {
        
        setError('Your profile is incomplete. Redirecting to registration...')
        
        // Clear any stored token
        localStorage.removeItem('token')
        
        setTimeout(() => {
          router.push('/signup')
        }, 1500)
        return
      }

      // Handle account inactive
      if (err?.response?.data?.error === 'AccountInactive') {
        setError('Your account has been deactivated. Please contact support.')
        return
      }

      // Handle invalid credentials
      if (err?.response?.data?.error === 'InvalidCredentials') {
        setError('Invalid email or password. Please try again.')
        return
      }

      // Handle email not confirmed
      if (err?.response?.data?.error === 'EmailNotConfirmed') {
        setError('Please verify your email before logging in. Check your inbox.')
        return
      }

      // Generic error
      setError(
        err?.response?.data?.message || 
        authError || 
        err?.message || 
        'Invalid email or password. Please try again.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Solo Leveling inspired gradient orbs - purple/violet theme */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 sm:w-96 sm:h-96 bg-purple-600 rounded-full blur-[120px] opacity-30 animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 -right-20 w-72 h-72 sm:w-[28rem] sm:h-[28rem] bg-violet-500 rounded-full blur-[140px] opacity-25 animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 sm:w-[32rem] sm:h-[32rem] bg-blue-600 rounded-full blur-[150px] opacity-20 animate-pulse" 
             style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>


      {/* Ethereal particles - avoid hydration error by generating on client only */}
      {hasMounted && <Particles />}


      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          50% { transform: translateY(-30px) translateX(20px); opacity: 0.4; }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>

      <div className="w-full max-w-md relative z-10">
        {/* Logo section - Solo Leveling style */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-violet-600 to-blue-600 rounded-2xl blur-2xl opacity-70 animate-pulse" 
                   style={{ animationDuration: '3s' }} />
              {/* Inner container */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-600 via-violet-700 to-blue-700 flex items-center justify-center shadow-2xl border border-purple-400/30">
                <Swords className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" strokeWidth={2.5} />
              </div>
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-purple-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-purple-400" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-purple-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-purple-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight leading-none"
              style={{
                textShadow: '0 0 30px rgba(168, 85, 247, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)'
              }}>
            WELCOME BACK
          </h1>
          <p className="text-base sm:text-lg text-purple-300/80 font-medium tracking-wide uppercase text-sm">
            Continue your journey
          </p>
        </div>

        {/* Glassmorphism card - Solo Leveling style */}
        <div className="relative">
          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-violet-600/30 to-blue-600/30 rounded-3xl blur-2xl" />
          
          {/* Main glass card */}
          <div
            className="relative rounded-3xl p-6 sm:p-8 border border-purple-500/20"
            style={{
              background: 'rgba(30, 15, 50, 0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: `
                inset 0 1px 1px rgba(168, 85, 247, 0.15),
                0 20px 60px rgba(0, 0, 0, 0.7),
                0 0 1px 1px rgba(139, 92, 246, 0.1)
              `
            }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

            {error && (
              <div className="mb-5 p-4 rounded-2xl border border-red-400/30 text-red-300 text-sm"
                   style={{
                     background: 'rgba(220, 38, 38, 0.1)',
                     backdropFilter: 'blur(10px)'
                   }}>
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">⚠️</span>
                  <span className="leading-relaxed">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-purple-200 text-sm font-semibold pl-1 uppercase tracking-wider text-xs">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/60 group-focus-within:text-purple-400 transition-colors duration-300" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-2xl py-4 px-12 text-white placeholder-purple-300/30 outline-none focus:border-purple-500/60 focus:bg-black/60 transition-all duration-300"
                      style={{ backdropFilter: 'blur(10px)' }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-purple-200 text-sm font-semibold pl-1 uppercase tracking-wider text-xs">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-blue-600/20 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/60 group-focus-within:text-purple-400 transition-colors duration-300" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/20 rounded-2xl py-4 px-12 pr-12 text-white placeholder-purple-300/30 outline-none focus:border-purple-500/60 focus:bg-black/60 transition-all duration-300"
                      style={{ backdropFilter: 'blur(10px)' }}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400/60 hover:text-purple-300 transition-colors duration-300 p-1"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer sr-only"
                      disabled={isLoading}
                    />
                    <div className="w-5 h-5 rounded-md border border-purple-500/30 bg-black/40 peer-checked:bg-gradient-to-br peer-checked:from-purple-600 peer-checked:via-violet-600 peer-checked:to-blue-600 peer-checked:border-purple-400/50 transition-all duration-300" 
                         style={{ backdropFilter: 'blur(10px)' }} />
                    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-purple-200/70 group-hover:text-purple-200 transition-colors duration-300">
                    Remember me
                  </span>
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-300 font-semibold"
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign in button - Solo Leveling style */}
              <button
                type="submit"
                disabled={hasMounted ? isLoading : false}
                className="relative w-full group mt-6"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white font-black py-4 rounded-2xl transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider text-sm border border-purple-400/30"
                     style={{
                       boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 10px 30px rgba(0, 0, 0, 0.5)',
                       textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                     }}>
                  {hasMounted && isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Entering...</span>
                    </>
                  ) : (
                    <>
                      <span>Level Up</span>
                      <TrendingUp className="w-5 h-5" />
                    </>
                  )}
                </div>
                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-500/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-4 text-purple-300/60 font-bold tracking-widest"
                        style={{
                          background: 'rgba(30, 15, 50, 0.6)',
                          backdropFilter: 'blur(10px)'
                        }}>
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social login */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="relative group p-4 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2.5 text-purple-200 group-hover:text-white transition-colors duration-300">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-sm font-semibold hidden sm:inline">Google</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="relative group p-4 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2.5 text-purple-200 group-hover:text-white transition-colors duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    <span className="text-sm font-semibold hidden sm:inline">GitHub</span>
                  </div>
                </button>
              </div>
            </form>

            {/* Sign up link */}
            <p className="text-center text-purple-200/60 text-sm mt-8">
              New Hunter?{' '}
              <a href="/signup" className="text-purple-400 hover:text-purple-300 font-bold transition-colors duration-300">
                Start Your Journey
              </a>
            </p>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-purple-300/40 text-xs font-bold tracking-[0.3em] uppercase">
            Arise
          </p>
        </div>
      </div>
    </div>
  )
}