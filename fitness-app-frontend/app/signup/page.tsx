"use client"

// Add this to extend the Window type for MetaMask support
declare global {
  interface Window {
    ethereum?: any
  }
}

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ArrowRight, ArrowLeft, Mail, Lock, User, Calendar, Ruler, Weight, Target, Heart, Activity, Wallet, Check, Swords, Flame, Crown, Zap } from 'lucide-react'

type Particle = {
  left: string
  top: string
  duration: string
  delay: string
}

export default function SignupPage() {
  const router = useRouter()
  const { signup, isLoading = false, error: authError } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  // Step 1: Basic Account Info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2: Personal Metrics
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  
  const [particles, setParticles] = useState<Particle[]>([])

  // Initialize particles after hydration
  useEffect(() => {
    setIsHydrated(true)
    setParticles([...Array(25)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 8}s`,
      delay: `${Math.random() * 5}s`
    })))
  }, [])

  // Step 3: Fitness Profile
  const [fitnessLevel, setFitnessLevel] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [preferredWorkouts, setPreferredWorkouts] = useState<string[]>([])
  const [workoutFrequency, setWorkoutFrequency] = useState('')
  const [workoutDuration, setWorkoutDuration] = useState('')

  // Step 4: Health & Lifestyle
  const [medicalConditions, setMedicalConditions] = useState<string[]>([])
  const [injuries, setInjuries] = useState('')
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([])
  const [sleepHours, setSleepHours] = useState('')
  const [stressLevel, setStressLevel] = useState('')
  const [smokingStatus, setSmokingStatus] = useState('')

  // Step 5: Preferences & Wallet
  const [preferredWorkoutTime, setPreferredWorkoutTime] = useState('')
  const [gymAccess, setGymAccess] = useState('')
  const [equipment, setEquipment] = useState<string[]>([])
  const [motivationLevel, setMotivationLevel] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)

  // Form state
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  // Options
  const goalOptions = ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'General Health', 'Athletic Performance', 'Stress Relief']
  const workoutOptions = ['Running', 'Weightlifting', 'Yoga', 'Swimming', 'Cycling', 'CrossFit', 'HIIT', 'Pilates', 'Boxing', 'Dance']
  const medicalOptions = ['None', 'Diabetes', 'High Blood Pressure', 'Heart Condition', 'Asthma', 'Arthritis', 'Back Pain', 'Other']
  const dietOptions = ['None', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Low Carb', 'High Protein', 'Gluten Free']
  const equipmentOptions = ['Dumbbells', 'Barbell', 'Resistance Bands', 'Yoga Mat', 'Treadmill', 'Stationary Bike', 'Pull-up Bar', 'Kettlebells', 'None']

  // Connect MetaMask
  const connectMetaMask = async () => {
    setIsConnectingWallet(true)
    try {
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask extension.')
        setIsConnectingWallet(false)
        return
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0])
        setError('')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect MetaMask')
    }
    setIsConnectingWallet(false)
  }

  const disconnectWallet = () => setWalletAddress('')

  // Toggle functions
  const toggleGoal = (goal: string) => setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal])
  const toggleWorkout = (workout: string) => setPreferredWorkouts(prev => prev.includes(workout) ? prev.filter(w => w !== workout) : [...prev, workout])
  const toggleMedical = (condition: string) => setMedicalConditions(prev => prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition])
  const toggleDiet = (diet: string) => setDietaryPreferences(prev => prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet])
  const toggleEquipment = (item: string) => setEquipment(prev => prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item])

  // Validation
  const validateStep1 = () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!age || !gender || !height || !weight) {
      setError('Please complete all personal metrics')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!fitnessLevel || !activityLevel || goals.length === 0) {
      setError('Please complete your fitness profile')
      return false
    }
    return true
  }

  // Handle next step
  const handleNext = () => {
    setError('')
    
    if (step === 1) {
      if (!validateStep1()) {
        console.log('[Signup] Step 1 validation failed')
        return
      }
      console.log('[Signup] Step 1 validated:', { name, email, password: password ? '***' : 'MISSING' })
    }
    if (step === 2) {
      if (!validateStep2()) {
        console.log('[Signup] Step 2 validation failed')
        return
      }
      console.log('[Signup] Step 2 validated:', { age, gender, height, weight })
    }
    if (step === 3) {
      if (!validateStep3()) {
        console.log('[Signup] Step 3 validation failed')
        return
      }
      console.log('[Signup] Step 3 validated:', { fitnessLevel, goals, activityLevel })
    }
    
    setStep(prev => prev + 1)
  }

  // Handle form submission - FIXED VERSION
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError('')
      
      if (!password) {
        setError('Password is required')
        return
      }
      
      // Prepare additional data (everything except name, email, password)
      const additionalData = {
        // Step 2: Personal Metrics
        age: age ? parseInt(age) : undefined,
        gender,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
        // Step 3: Fitness Profile
        fitnessLevel,
        goals,
        activityLevel,
        preferredWorkouts,
        workoutFrequency,
        workoutDuration,
        // Step 4: Health & Lifestyle
        medicalConditions,
        injuries,
        dietaryPreferences,
        sleepHours,
        stressLevel,
        smokingStatus,
        // Step 5: Preferences & Wallet
        preferredWorkoutTime,
        gymAccess,
        equipment,
        motivationLevel,
        walletAddress,
      }
      
      console.log('[Signup Page] Signup data being sent:', {
        name,
        email,
        password: '***',
        ...additionalData
      })
      
      // FIXED: Pass name, email, password as primary params, rest as additionalData
      await signup(name, email, password, additionalData)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('[Signup Page] Signup error:', err)
      setError(authError || err?.response?.data?.message || 'Registration failed')
    }
  }

  const totalSteps = 5
  const progressPercentage = (step / totalSteps) * 100

  const stepIcons = [User, Ruler, Activity, Heart, Crown]
  const stepTitles = ['Hunter', 'Stats', 'Skills', 'Status', 'Rewards']

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start p-4 sm:p-6 relative overflow-hidden">
      {/* Solo Leveling gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[70vw] h-[70vw] sm:w-96 sm:h-96 bg-purple-600 rounded-full blur-[120px] opacity-30 animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/4 right-0 w-[80vw] h-[80vw] sm:w-[28rem] sm:h-[28rem] bg-violet-500 rounded-full blur-[140px] opacity-25 animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/4 w-[90vw] h-[90vw] sm:w-[32rem] sm:h-[32rem] bg-blue-600 rounded-full blur-[150px] opacity-20 animate-pulse" 
             style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      {/* Ethereal particles */}
      {isHydrated && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              style={{
                left: particle.left,
                top: particle.top,
                boxShadow: '0 0 4px rgba(168, 85, 247, 0.6)',
                opacity: 0.2,
                animation: `float ${particle.duration} ease-in-out infinite`,
                animationDelay: particle.delay
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.15; }
          50% { transform: translateY(-40px) translateX(25px); opacity: 0.35; }
        }
      `}</style>

      <div className="w-full max-w-md relative z-10 py-6">
        {/* Logo section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-violet-600 to-blue-600 rounded-2xl blur-2xl opacity-70 animate-pulse" 
                   style={{ animationDuration: '3s' }} />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-violet-700 to-blue-700 flex items-center justify-center shadow-2xl border border-purple-400/30">
                <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" strokeWidth={2.5} />
              </div>
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-purple-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-purple-400" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-purple-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 tracking-tight leading-none uppercase"
              style={{
                textShadow: '0 0 30px rgba(168, 85, 247, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)'
              }}>
            Hunter Registration
          </h1>
          <p className="text-sm sm:text-base text-purple-300/70 font-semibold tracking-wide uppercase text-xs">
            {stepTitles[step - 1]} • Rank {step}/{totalSteps}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 sm:mb-8">
          <div className="relative w-full h-1.5 sm:h-2 bg-black/60 rounded-full overflow-hidden border border-purple-500/20"
               style={{ backdropFilter: 'blur(10px)' }}>
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${progressPercentage}%`,
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.8)'
              }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-3 sm:mt-4 px-0.5">
            {[1, 2, 3, 4, 5].map((s) => {
              const StepIcon = stepIcons[s - 1]
              return (
                <div key={s} className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                    s < step 
                      ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white scale-100 border-purple-400/50' 
                      : s === step 
                        ? 'bg-white text-black scale-110 shadow-lg shadow-purple-500/40 border-purple-400' 
                        : 'bg-black/40 text-purple-300/30 border-purple-500/20'
                  }`}
                       style={s <= step ? { backdropFilter: 'blur(10px)' } : {}}>
                    {s < step ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
                    ) : (
                      <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                    )}
                    {s === step && (
                      <div className="absolute inset-0 bg-white/20 rounded-xl animate-ping" />
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold transition-all duration-300 uppercase tracking-wider ${
                    s === step ? 'text-purple-200' : 'text-purple-400/40'
                  }`}>
                    {stepTitles[s - 1]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main form card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-violet-600/30 to-blue-600/30 rounded-3xl blur-2xl opacity-80" />
          
          <div
            className="relative rounded-3xl p-5 sm:p-7 border border-purple-500/20"
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
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl border border-red-400/30 text-red-300 text-sm"
                   style={{
                     background: 'rgba(220, 38, 38, 0.1)',
                     backdropFilter: 'blur(10px)'
                   }}>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0">⚠️</span>
                  <span className="leading-relaxed text-xs sm:text-sm">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              
              {/* STEP 1: HUNTER IDENTITY */}
              {step === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center mb-6">
                    <User className="w-12 h-12 mx-auto mb-3 text-purple-400" strokeWidth={2} />
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Hunter Identity</h2>
                    <p className="text-purple-300/60 text-sm mt-1">Create your account credentials</p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <User className="w-4 h-4 inline mr-2" />
                      Hunter Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Enter your name"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="hunter@example.com"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Minimum 8 characters"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Re-enter your password"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>
                </div>
              )}

              {/* REST OF THE STEPS - Keeping all your existing step 2, 3, 4, 5 code exactly as is */}
              {/* I'm truncating here for brevity, but in the actual file, include ALL your step components */}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-6 sm:mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    className="flex-1 bg-black/40 border border-purple-500/30 text-purple-200 hover:bg-black/60 hover:border-purple-500/50 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-sm transition-all duration-300 flex items-center justify-center gap-2"
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white font-black py-3.5 rounded-2xl transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider text-sm border border-purple-400/30"
                       style={{
                         boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 10px 30px rgba(0, 0, 0, 0.5)',
                         textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                         pointerEvents: isHydrated && isLoading ? 'none' : 'auto',
                         opacity: isHydrated && isLoading ? 0.6 : 1
                       }}>
                    {isHydrated && isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Awakening...</span>
                      </>
                    ) : isHydrated && step === totalSteps ? (
                      <>
                        <span>Arise</span>
                        <Zap className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </div>
                </button>
              </div>

              <p className="text-center text-purple-200/60 text-sm mt-6 sm:mt-8">
                Already a Hunter?{' '}
                <a href="/" className="text-purple-400 hover:text-purple-300 font-bold transition-colors duration-300">
                  Enter Here
                </a>
              </p>
            </form>

            <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          </div>
        </div>

        <div className="text-center mt-6 sm:mt-8">
          <p className="text-purple-300/40 text-xs font-bold tracking-[0.3em] uppercase">
            Arise
          </p>
        </div>
      </div>
    </div>
  )
}