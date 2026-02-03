'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authApi } from './api-client'

export interface User {
  id: string
  name: string
  email: string
  // Step 2: Personal Metrics
  age?: number
  gender?: string
  height?: number
  weight?: number
  targetWeight?: number
  // Step 3: Fitness Profile
  fitnessLevel?: string
  goals?: string[]
  activityLevel?: string
  preferredWorkouts?: string[]
  workoutFrequency?: string
  workoutDuration?: string
  // Step 4: Health & Lifestyle
  medicalConditions?: string[]
  injuries?: string
  dietaryPreferences?: string[]
  sleepHours?: string
  stressLevel?: string
  smokingStatus?: string
  // Step 5: Preferences & Wallet
  preferredWorkoutTime?: string
  gymAccess?: string
  equipment?: string[]
  motivationLevel?: string
  walletAddress?: string
  // Game progression
  rank?: string
  statPoints?: number
  totalXP?: number
  joinedDate?: string
  level?: number
}

interface AuthContextType {
  refreshUser(): unknown
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage if available
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem('forgeUser')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    // Only loading if we don't have a token on init
    return !localStorage.getItem('authToken')
  })
  const [error, setError] = useState<string | null>(null)

  // Verify token is still valid on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token && user) {
      setUser(null)
    }
    setIsLoading(false)
  }, [])

  const signup = useCallback(async (
    name: string,
    email: string,
    password: string,
    fitnessData?: {
      // Step 2
      age?: number
      gender?: string
      height?: number
      weight?: number
      targetWeight?: number
      // Step 3
      fitnessLevel?: string
      goals?: string[]
      activityLevel?: string
      preferredWorkouts?: string[]
      workoutFrequency?: string
      workoutDuration?: string
      // Step 4
      medicalConditions?: string[]
      injuries?: string
      dietaryPreferences?: string[]
      sleepHours?: string
      stressLevel?: string
      smokingStatus?: string
      // Step 5
      preferredWorkoutTime?: string
      gymAccess?: string
      equipment?: string[]
      motivationLevel?: string
      walletAddress?: string
    }
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.register({ 
        name, 
        email, 
        password,
        ...fitnessData
      })
      const { user: userData, token } = response.data

      // Store token and user data
      localStorage.setItem('authToken', token)
      const userWithDefaults: User = {
        ...userData,
        rank: userData.rank || 'F',
        statPoints: userData.statPoints || 0,
        totalXP: userData.totalXP || 0,
        joinedDate: userData.joinedDate || new Date().toISOString(),
        level: userData.level || 1,
      }
      setUser(userWithDefaults)
      localStorage.setItem('forgeUser', JSON.stringify(userWithDefaults))
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Signup failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await authApi.login({ email, password })
      const { user: userData, token } = response.data

      // Store token and user data
      localStorage.setItem('authToken', token)
      const userWithDefaults: User = {
        ...userData,
        rank: userData.rank || 'A',
        statPoints: userData.statPoints || 0,
        totalXP: userData.totalXP || 0,
        joinedDate: userData.joinedDate || new Date().toISOString(),
        level: userData.level || 1,
      }
      setUser(userWithDefaults)
      localStorage.setItem('forgeUser', JSON.stringify(userWithDefaults))
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      localStorage.removeItem('authToken')
      localStorage.removeItem('forgeUser')
      setError(null)
      setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
