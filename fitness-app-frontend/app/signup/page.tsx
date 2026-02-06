"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface User {
  id: string
  email: string
  name?: string
  age?: number
  gender?: string
  fitness_level?: string
  role?: string
  level?: number
  total_xp?: number
}

interface SignupData {
  // Step 1: Basic Account Info
  name: string
  email: string
  password: string
  
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
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<any>
  signup: (name: string, email: string, password: string, additionalData?: Partial<SignupData>) => Promise<any>
  register: (email: string, password: string, name?: string, age?: number, gender?: string, fitness_level?: string) => Promise<any>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // API base URL - FIXED: Remove /api from base URL since we add it in the endpoints
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
  }, [])

  // Configure axios interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        // Check for incomplete profile in successful responses
        if (response.data?.requiresRegistration) {
          console.log('[Auth Context] Incomplete profile detected, clearing auth')
          handleLogout()
          router.push('/signup')
        }
        
        if (response.data?.profileComplete === false && !response.data?.requiresRegistration) {
          console.log('[Auth Context] Profile incomplete but not critical')
          // Don't logout, just redirect to complete profile
          router.push('/complete-profile')
        }
        
        return response
      },
      (error) => {
        const status = error.response?.status
        const errorData = error.response?.data
        
        console.log('[Auth Context] Error interceptor:', { status, errorData })
        
        // Handle 401 Unauthorized
        if (status === 401) {
          const errorType = errorData?.error
          
          // User not found or incomplete profile - redirect to signup
          if (
            errorData?.requiresRegistration ||
            errorType === 'UserNotFound' ||
            errorType === 'ProfileNotFound' ||
            errorType === 'IncompleteProfile'
          ) {
            console.log('[Auth Context] User profile incomplete, redirecting to signup')
            handleLogout()
            router.push('/signup')
            return Promise.reject(error)
          }
          
          // Token expired or invalid - redirect to login
          if (
            errorType === 'TokenExpiredError' ||
            errorType === 'JsonWebTokenError' ||
            errorType === 'MissingToken'
          ) {
            console.log('[Auth Context] Token invalid/expired, redirecting to login')
            handleLogout()
            router.push('/signin')
            return Promise.reject(error)
          }
        }
        
        // Handle 403 Forbidden (inactive account, permission denied)
        if (status === 403) {
          const errorType = errorData?.error
          
          if (errorType === 'AccountInactive') {
            console.log('[Auth Context] Account inactive')
            handleLogout()
            // Don't redirect, show error message
          }
          
          if (errorData?.requiresSupport) {
            console.log('[Auth Context] Requires support')
            // Show support message
          }
        }
        
        // Handle 404 Not Found
        if (status === 404 && errorData?.requiresRegistration) {
          console.log('[Auth Context] Resource not found, profile incomplete')
          handleLogout()
          router.push('/signup')
        }
        
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [router])

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('[Auth Context] Logging in:', email)
      console.log('[Auth Context] API endpoint:', `${API_BASE}/api/auth/login`)
      
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password
      })

      const { user: userData, token: authToken, profileComplete, requiresRegistration } = response.data

      console.log('[Auth Context] Login response:', {
        user: userData,
        hasToken: !!authToken,
        profileComplete,
        requiresRegistration
      })

      // Check if profile is incomplete
      if (requiresRegistration) {
        console.log('[Auth Context] Profile requires registration')
        setError('Profile incomplete. Please complete registration.')
        handleLogout()
        return { requiresRegistration: true, error: 'IncompleteProfile' }
      }

      if (!authToken) {
        throw new Error('No token received')
      }

      // Store token and user
      setToken(authToken)
      setUser(userData)
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

      console.log('[Auth Context] Login successful')
      
      return response.data
    } catch (err: any) {
      console.error('[Auth Context] Login error:', err)
      
      const errorMessage = err.response?.data?.message || err.message || 'Login failed'
      setError(errorMessage)
      
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // ADDED: signup method that your signup page expects
  const signup = async (
    name: string,
    email: string,
    password: string,
    additionalData?: Partial<SignupData>
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('[Auth Context] Signing up:', email)
      console.log('[Auth Context] API endpoint:', `${API_BASE}/api/auth/register`)
      console.log('[Auth Context] Signup data:', { 
        name, 
        email, 
        password: '***',
        ...additionalData 
      })
      
      // Combine basic data with additional data
      const signupData = {
        name,
        email,
        password,
        ...additionalData
      }
      
      const response = await axios.post(`${API_BASE}/api/auth/register`, signupData)

      const { user: userData, token: authToken } = response.data

      console.log('[Auth Context] Signup response:', {
        user: userData,
        hasToken: !!authToken
      })

      if (!authToken) {
        throw new Error('No token received')
      }

      // Store token and user
      setToken(authToken)
      setUser(userData)
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

      console.log('[Auth Context] Signup successful')
      
      return response.data
    } catch (err: any) {
      console.error('[Auth Context] Signup error:', err)
      console.error('[Auth Context] Error response:', err.response?.data)
      
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed'
      setError(errorMessage)
      
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Keep register method for backward compatibility
  const register = async (
    email: string, 
    password: string, 
    name?: string,
    age?: number,
    gender?: string,
    fitness_level?: string
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('[Auth Context] Registering:', email)
      console.log('[Auth Context] API endpoint:', `${API_BASE}/api/auth/register`)
      
      const response = await axios.post(`${API_BASE}/api/auth/register`, {
        email,
        password,
        name,
        age,
        gender,
        fitness_level
      })

      const { user: userData, token: authToken } = response.data

      console.log('[Auth Context] Registration response:', {
        user: userData,
        hasToken: !!authToken
      })

      if (!authToken) {
        throw new Error('No token received')
      }

      // Store token and user
      setToken(authToken)
      setUser(userData)
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

      console.log('[Auth Context] Registration successful')
      
      return response.data
    } catch (err: any) {
      console.error('[Auth Context] Registration error:', err)
      
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed'
      setError(errorMessage)
      
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      
      console.log('[Auth Context] Logging out')
      
      // Call backend logout endpoint if token exists
      if (token) {
        try {
          await axios.post(`${API_BASE}/api/auth/logout`)
        } catch (err) {
          console.error('[Auth Context] Logout API error:', err)
          // Continue with local logout even if API fails
        }
      }

      handleLogout()
      router.push('/signin')
      
      console.log('[Auth Context] Logout successful')
    } catch (err) {
      console.error('[Auth Context] Logout error:', err)
      handleLogout()
      router.push('/signin')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      if (!token) {
        console.log('[Auth Context] No token, cannot refresh user')
        return
      }

      console.log('[Auth Context] Refreshing user data')
      
      const response = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const userData = response.data.user

      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))

      console.log('[Auth Context] User data refreshed')
    } catch (err: any) {
      console.error('[Auth Context] Refresh user error:', err)
      
      // If refresh fails with 401, logout
      if (err.response?.status === 401) {
        handleLogout()
        router.push('/signin')
      }
    }
  }

  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    signup,
    register,
    logout,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}