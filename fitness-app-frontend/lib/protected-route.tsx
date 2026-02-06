'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [hasToken, setHasToken] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if there's a token in localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setHasToken(!!token)
  }, [])

  // If mounted and has token but still loading auth context, render children
  // If mounted and has no token and no auth, redirect to home
  useEffect(() => {
    if (!mounted) return
    
    if (!isLoading && !isAuthenticated && !hasToken) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, hasToken, mounted, router])

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin mb-4">⚡</div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && !hasToken) {
    return null
  }

  return <>{children}</>
}
