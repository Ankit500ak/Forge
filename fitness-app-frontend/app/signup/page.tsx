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

  // Handle form submission - ALIGNED WITH BACKEND
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError('')
      
      if (!password) {
        setError('Password is required')
        return
      }
      
      // Prepare additional data - EXACT FIELD NAMES FROM BACKEND
      const additionalData = {
        // Step 2: Personal Metrics
        age: age ? parseInt(age) : undefined,
        gender,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
        // Step 3: Fitness Profile
        fitness_level: fitnessLevel, // Backend uses fitness_level
        fitnessLevel, // Also send as fitnessLevel for compatibility
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
      
      // Pass name, email, password as primary params, rest as additionalData
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

              {/* STEP 2: PERSONAL METRICS */}
              {step === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center mb-6">
                    <Ruler className="w-12 h-12 mx-auto mb-3 text-purple-400" strokeWidth={2} />
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Physical Stats</h2>
                    <p className="text-purple-300/60 text-sm mt-1">Your current attributes</p>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Age *
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Enter your age"
                      min="13"
                      max="120"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <User className="w-4 h-4 inline mr-2" />
                      Gender *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['male', 'female', 'other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-3 rounded-xl font-bold uppercase text-sm transition-all duration-300 border ${
                            gender === g
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <Ruler className="w-4 h-4 inline mr-2" />
                      Height (cm) *
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Enter your height"
                      min="100"
                      max="250"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <Weight className="w-4 h-4 inline mr-2" />
                      Current Weight (kg) *
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Enter your weight"
                      min="30"
                      max="300"
                      step="0.1"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>

                  {/* Target Weight */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <Target className="w-4 h-4 inline mr-2" />
                      Target Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Your goal weight (optional)"
                      min="30"
                      max="300"
                      step="0.1"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: FITNESS PROFILE */}
              {step === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center mb-6">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-purple-400" strokeWidth={2} />
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Combat Skills</h2>
                    <p className="text-purple-300/60 text-sm mt-1">Your fitness abilities</p>
                  </div>

                  {/* Fitness Level */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Rank Level *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['beginner', 'intermediate', 'advanced'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFitnessLevel(level)}
                          className={`py-3 rounded-xl font-bold uppercase text-xs transition-all duration-300 border ${
                            fitnessLevel === level
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Activity Level *
                    </label>
                    <select
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="" disabled className="bg-black">Select activity level</option>
                      <option value="sedentary" className="bg-black">Sedentary (Little to no exercise)</option>
                      <option value="light" className="bg-black">Light (1-3 days/week)</option>
                      <option value="moderate" className="bg-black">Moderate (3-5 days/week)</option>
                      <option value="active" className="bg-black">Active (6-7 days/week)</option>
                      <option value="very-active" className="bg-black">Very Active (Intense daily)</option>
                    </select>
                  </div>

                  {/* Goals */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Quest Objectives * (Select at least 1)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {goalOptions.map((goal) => (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => toggleGoal(goal)}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-300 border ${
                            goals.includes(goal)
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Workouts */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Preferred Combat Styles
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {workoutOptions.map((workout) => (
                        <button
                          key={workout}
                          type="button"
                          onClick={() => toggleWorkout(workout)}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-300 border ${
                            preferredWorkouts.includes(workout)
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {workout}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Workout Frequency */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Training Frequency
                    </label>
                    <select
                      value={workoutFrequency}
                      onChange={(e) => setWorkoutFrequency(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="" disabled className="bg-black">How often do you train?</option>
                      <option value="1-2" className="bg-black">1-2 times/week</option>
                      <option value="3-4" className="bg-black">3-4 times/week</option>
                      <option value="5-6" className="bg-black">5-6 times/week</option>
                      <option value="daily" className="bg-black">Daily</option>
                    </select>
                  </div>

                  {/* Workout Duration */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Training Duration
                    </label>
                    <select
                      value={workoutDuration}
                      onChange={(e) => setWorkoutDuration(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="" disabled className="bg-black">Average session length</option>
                      <option value="15-30" className="bg-black">15-30 minutes</option>
                      <option value="30-45" className="bg-black">30-45 minutes</option>
                      <option value="45-60" className="bg-black">45-60 minutes</option>
                      <option value="60+" className="bg-black">60+ minutes</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 4: HEALTH & LIFESTYLE */}
              {step === 4 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center mb-6">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-purple-400" strokeWidth={2} />
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Status Effects</h2>
                    <p className="text-purple-300/60 text-sm mt-1">Health and lifestyle information</p>
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Medical Conditions
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {medicalOptions.map((condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => toggleMedical(condition)}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-300 border ${
                            medicalConditions.includes(condition)
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Injuries */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Current Injuries or Limitations
                    </label>
                    <textarea
                      value={injuries}
                      onChange={(e) => setInjuries(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                      placeholder="Describe any injuries or physical limitations..."
                      rows={3}
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>

                  {/* Dietary Preferences */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Dietary Preferences
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {dietOptions.map((diet) => (
                        <button
                          key={diet}
                          type="button"
                          onClick={() => toggleDiet(diet)}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-300 border ${
                            dietaryPreferences.includes(diet)
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep Hours */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Average Sleep Hours
                    </label>
                    <select
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="" disabled className="bg-black">How much do you sleep?</option>
                      <option value="<5" className="bg-black">Less than 5 hours</option>
                      <option value="5-6" className="bg-black">5-6 hours</option>
                      <option value="7-8" className="bg-black">7-8 hours</option>
                      <option value="9+" className="bg-black">9+ hours</option>
                    </select>
                  </div>

                  {/* Stress Level */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Stress Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['low', 'moderate', 'high'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setStressLevel(level)}
                          className={`py-3 rounded-xl font-bold uppercase text-xs transition-all duration-300 border ${
                            stressLevel === level
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Smoking Status */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Smoking Status
                    </label>
                    <select
                      value={smokingStatus}
                      onChange={(e) => setSmokingStatus(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="" disabled className="bg-black">Select status</option>
                      <option value="non-smoker" className="bg-black">Non-smoker</option>
                      <option value="former-smoker" className="bg-black">Former smoker</option>
                      <option value="occasional-smoker" className="bg-black">Occasional smoker</option>
                      <option value="regular-smoker" className="bg-black">Regular smoker</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 5: PREFERENCES & WALLET */}
              {step === 5 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center mb-6">
                    <Crown className="w-12 h-12 mx-auto mb-3 text-purple-400" strokeWidth={2} />
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Hunter's Arsenal</h2>
                    <p className="text-purple-300/60 text-sm mt-1">Your preferences and rewards wallet</p>
                  </div>

                  {/* Preferred Workout Time */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Preferred Training Time
                    </label>
                    <select
                      value={preferredWorkoutTime}
                      onChange={(e) => setPreferredWorkoutTime(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="" disabled className="bg-black">When do you prefer to train?</option>
                      <option value="early-morning" className="bg-black">Early Morning (5-8 AM)</option>
                      <option value="morning" className="bg-black">Morning (8-12 PM)</option>
                      <option value="afternoon" className="bg-black">Afternoon (12-5 PM)</option>
                      <option value="evening" className="bg-black">Evening (5-9 PM)</option>
                      <option value="night" className="bg-black">Night (9 PM+)</option>
                    </select>
                  </div>

                  {/* Gym Access */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Gym Access
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['yes', 'no'].map((access) => (
                        <button
                          key={access}
                          type="button"
                          onClick={() => setGymAccess(access)}
                          className={`py-3 rounded-xl font-bold uppercase text-sm transition-all duration-300 border ${
                            gymAccess === access
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {access === 'yes' ? 'Have Gym Access' : 'No Gym Access'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Available Equipment
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {equipmentOptions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleEquipment(item)}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-300 border ${
                            equipment.includes(item)
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motivation Level */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Motivation Level
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['low', 'moderate', 'high'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setMotivationLevel(level)}
                          className={`py-3 rounded-xl font-bold uppercase text-xs transition-all duration-300 border ${
                            motivationLevel === level
                              ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white border-purple-400/50'
                              : 'bg-black/40 text-purple-300/60 border-purple-500/30 hover:border-purple-500/50'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wallet Connection */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <Wallet className="w-4 h-4 inline mr-2" />
                      Connect Wallet (Optional)
                    </label>
                    
                    {!walletAddress ? (
                      <button
                        type="button"
                        onClick={connectMetaMask}
                        disabled={isConnectingWallet}
                        className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white font-black py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider text-sm border border-orange-400/30"
                        style={{
                          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 10px 30px rgba(0, 0, 0, 0.5)',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        {isConnectingWallet ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <Wallet className="w-5 h-5" />
                            <span>Connect MetaMask</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="bg-black/40 border border-green-500/50 rounded-xl p-4"
                           style={{ backdropFilter: 'blur(10px)' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-green-400 text-xs font-bold uppercase tracking-wide mb-1">
                              ✓ Wallet Connected
                            </p>
                            <p className="text-purple-200 text-sm font-mono break-all">
                              {walletAddress}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={disconnectWallet}
                            className="shrink-0 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wide transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-purple-300/50 text-xs mt-2">
                      Earn rewards and track achievements on the blockchain
                    </p>
                  </div>
                </div>
              )}

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