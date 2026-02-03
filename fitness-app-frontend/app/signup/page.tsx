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
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, Mail, Lock, User, Calendar, Ruler, Weight, Target, Heart, Activity, Wallet, Check, Swords, Flame, Crown, Zap } from 'lucide-react'


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
  
  type Particle = {
    left: string
    top: string
    duration: string
    delay: string
  }

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
        console.log('Step 1 validation failed')
        return
      }
      console.log('Step 1 validated:', { name, email, password: password ? '***' : 'MISSING' })
    }
    if (step === 2) {
      if (!validateStep2()) {
        console.log('Step 2 validation failed')
        return
      }
      console.log('Step 2 validated:', { age, gender, height, weight })
    }
    if (step === 3) {
      if (!validateStep3()) {
        console.log('Step 3 validation failed')
        return
      }
      console.log('Step 3 validated:', { fitnessLevel, goals, activityLevel })
    }
    
    setStep(prev => prev + 1)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError('')
      
      const signupData = {
        // Step 1
        name, email, password,
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
      
      console.log('Signup data being sent:', signupData)
      
      if (!password) {
        setError('Password is required')
        return
      }
      
      await signup(name, email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(authError || 'Registration failed')
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

              {/* STEP 2: HUNTER STATS */}
              {step === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center mb-6">
                    <Ruler className="w-12 h-12 mx-auto mb-3 text-purple-400" strokeWidth={2} />
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Hunter Stats</h2>
                    <p className="text-purple-300/60 text-sm mt-1">Your physical measurements</p>
                  </div>

                  {/* Age & Gender Row */}
                  <div className="grid grid-cols-2 gap-4">
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
                        placeholder="25"
                        style={{ backdropFilter: 'blur(10px)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                        Gender *
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        style={{ backdropFilter: 'blur(10px)' }}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Height & Weight Row */}
                  <div className="grid grid-cols-2 gap-4">
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
                        placeholder="175"
                        step="0.1"
                        style={{ backdropFilter: 'blur(10px)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                        <Weight className="w-4 h-4 inline mr-2" />
                        Weight (kg) *
                      </label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        placeholder="70"
                        step="0.1"
                        style={{ backdropFilter: 'blur(10px)' }}
                      />
                    </div>
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
                      placeholder="65 (Optional)"
                      step="0.1"
                      style={{ backdropFilter: 'blur(10px)' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: HUNTER SKILLS */}
              {step === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center mb-6">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-purple-400" strokeWidth={2} />
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Hunter Skills</h2>
                    <p className="text-purple-300/60 text-sm mt-1">Define your fitness profile</p>
                  </div>

                  {/* Fitness Level */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Current Rank *
                    </label>
                    <select
                      value={fitnessLevel}
                      onChange={(e) => setFitnessLevel(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="">Select your level</option>
                      <option value="beginner">E-Rank (Beginner)</option>
                      <option value="intermediate">D-Rank (Intermediate)</option>
                      <option value="advanced">C-Rank (Advanced)</option>
                      <option value="expert">B-Rank (Expert)</option>
                      <option value="elite">A-Rank (Elite)</option>
                      <option value="master">S-Rank (Master)</option>
                    </select>
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
                      <option value="">Select activity level</option>
                      <option value="sedentary">Sedentary (Little to no exercise)</option>
                      <option value="light">Light (1-3 days/week)</option>
                      <option value="moderate">Moderate (3-5 days/week)</option>
                      <option value="active">Active (6-7 days/week)</option>
                      <option value="veryActive">Very Active (Daily intense training)</option>
                    </select>
                  </div>

                  {/* Goals */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-3 uppercase tracking-wide">
                      <Target className="w-4 h-4 inline mr-2" />
                      Fitness Goals * (Select at least one)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {goalOptions.map((goal) => (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => toggleGoal(goal)}
                          className={`p-3 rounded-xl text-sm font-bold transition-all border ${
                            goals.includes(goal)
                              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-400/50 shadow-lg shadow-purple-500/30'
                              : 'bg-black/40 text-purple-200 border-purple-500/20 hover:border-purple-500/40'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {goals.includes(goal) && <Check className="w-4 h-4 inline mr-1" />}
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Workouts */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-3 uppercase tracking-wide">
                      <Swords className="w-4 h-4 inline mr-2" />
                      Preferred Workouts
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {workoutOptions.map((workout) => (
                        <button
                          key={workout}
                          type="button"
                          onClick={() => toggleWorkout(workout)}
                          className={`p-3 rounded-xl text-sm font-bold transition-all border ${
                            preferredWorkouts.includes(workout)
                              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-400/50 shadow-lg shadow-purple-500/30'
                              : 'bg-black/40 text-purple-200 border-purple-500/20 hover:border-purple-500/40'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {preferredWorkouts.includes(workout) && <Check className="w-4 h-4 inline mr-1" />}
                          {workout}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Workout Frequency & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide text-xs">
                        Frequency
                      </label>
                      <select
                        value={workoutFrequency}
                        onChange={(e) => setWorkoutFrequency(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        style={{ backdropFilter: 'blur(10px)' }}
                      >
                        <option value="">Select</option>
                        <option value="1-2">1-2/week</option>
                        <option value="3-4">3-4/week</option>
                        <option value="5-6">5-6/week</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide text-xs">
                        Duration
                      </label>
                      <select
                        value={workoutDuration}
                        onChange={(e) => setWorkoutDuration(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        style={{ backdropFilter: 'blur(10px)' }}
                      >
                        <option value="">Select</option>
                        <option value="15-30">15-30 min</option>
                        <option value="30-45">30-45 min</option>
                        <option value="45-60">45-60 min</option>
                        <option value="60+">60+ min</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: HEALTH STATUS */}
              {step === 4 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center mb-6">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-purple-400" strokeWidth={2} />
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Health Status</h2>
                    <p className="text-purple-300/60 text-sm mt-1">Your health and lifestyle information</p>
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-3 uppercase tracking-wide">
                      <Heart className="w-4 h-4 inline mr-2" />
                      Medical Conditions
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {medicalOptions.map((condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => toggleMedical(condition)}
                          className={`p-3 rounded-xl text-sm font-bold transition-all border ${
                            medicalConditions.includes(condition)
                              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-400/50 shadow-lg shadow-purple-500/30'
                              : 'bg-black/40 text-purple-200 border-purple-500/20 hover:border-purple-500/40'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {medicalConditions.includes(condition) && <Check className="w-4 h-4 inline mr-1" />}
                          {condition}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Injuries */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Current Injuries/Limitations
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
                    <label className="block text-purple-200 text-sm font-bold mb-3 uppercase tracking-wide">
                      Dietary Preferences
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {dietOptions.map((diet) => (
                        <button
                          key={diet}
                          type="button"
                          onClick={() => toggleDiet(diet)}
                          className={`p-3 rounded-xl text-sm font-bold transition-all border ${
                            dietaryPreferences.includes(diet)
                              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-400/50 shadow-lg shadow-purple-500/30'
                              : 'bg-black/40 text-purple-200 border-purple-500/20 hover:border-purple-500/40'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {dietaryPreferences.includes(diet) && <Check className="w-4 h-4 inline mr-1" />}
                          {diet}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep & Stress */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide text-xs">
                        Sleep (hrs/night)
                      </label>
                      <select
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        style={{ backdropFilter: 'blur(10px)' }}
                      >
                        <option value="">Select</option>
                        <option value="<5">Less than 5</option>
                        <option value="5-6">5-6 hours</option>
                        <option value="7-8">7-8 hours</option>
                        <option value=">8">More than 8</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide text-xs">
                        Stress Level
                      </label>
                      <select
                        value={stressLevel}
                        onChange={(e) => setStressLevel(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        style={{ backdropFilter: 'blur(10px)' }}
                      >
                        <option value="">Select</option>
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                      </select>
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
                      <option value="">Select status</option>
                      <option value="non-smoker">Non-smoker</option>
                      <option value="former">Former smoker</option>
                      <option value="occasional">Occasional smoker</option>
                      <option value="regular">Regular smoker</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 5: REWARDS & PREFERENCES */}
              {step === 5 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="text-center mb-6">
                    <Crown className="w-12 h-12 mx-auto mb-3 text-purple-400" strokeWidth={2} />
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">Rewards & Preferences</h2>
                    <p className="text-purple-300/60 text-sm mt-1">Personalize your experience</p>
                  </div>

                  {/* Preferred Workout Time */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Preferred Workout Time
                    </label>
                    <select
                      value={preferredWorkoutTime}
                      onChange={(e) => setPreferredWorkoutTime(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="">Select time</option>
                      <option value="early-morning">Early Morning (5-7 AM)</option>
                      <option value="morning">Morning (7-10 AM)</option>
                      <option value="midday">Midday (10 AM-2 PM)</option>
                      <option value="afternoon">Afternoon (2-6 PM)</option>
                      <option value="evening">Evening (6-9 PM)</option>
                      <option value="night">Night (9 PM-12 AM)</option>
                    </select>
                  </div>

                  {/* Gym Access */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      Gym Access
                    </label>
                    <select
                      value={gymAccess}
                      onChange={(e) => setGymAccess(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="">Select option</option>
                      <option value="full-gym">Full Gym Access</option>
                      <option value="home-gym">Home Gym</option>
                      <option value="limited">Limited Equipment</option>
                      <option value="none">No Equipment</option>
                    </select>
                  </div>

                  {/* Available Equipment */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-3 uppercase tracking-wide">
                      Available Equipment
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {equipmentOptions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleEquipment(item)}
                          className={`p-3 rounded-xl text-sm font-bold transition-all border ${
                            equipment.includes(item)
                              ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-400/50 shadow-lg shadow-purple-500/30'
                              : 'bg-black/40 text-purple-200 border-purple-500/20 hover:border-purple-500/40'
                          }`}
                          style={{ backdropFilter: 'blur(10px)' }}
                        >
                          {equipment.includes(item) && <Check className="w-4 h-4 inline mr-1" />}
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motivation Level */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-2 uppercase tracking-wide">
                      <Flame className="w-4 h-4 inline mr-2" />
                      Motivation Level
                    </label>
                    <select
                      value={motivationLevel}
                      onChange={(e) => setMotivationLevel(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <option value="">Select level</option>
                      <option value="low">Low (Need extra push)</option>
                      <option value="moderate">Moderate (Consistent)</option>
                      <option value="high">High (Self-driven)</option>
                      <option value="extreme">Extreme (Highly disciplined)</option>
                    </select>
                  </div>

                  {/* Wallet Connection */}
                  <div>
                    <label className="block text-purple-200 text-sm font-bold mb-3 uppercase tracking-wide">
                      <Wallet className="w-4 h-4 inline mr-2" />
                      Connect Wallet (Optional)
                    </label>
                    {!walletAddress ? (
                      <button
                        type="button"
                        onClick={connectMetaMask}
                        disabled={isConnectingWallet}
                        className="w-full relative group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity" />
                        <div className="relative bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold py-3.5 rounded-xl transition-all group-hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border border-orange-400/30"
                             style={{
                               boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                               backdropFilter: 'blur(10px)'
                             }}>
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
                        </div>
                      </button>
                    ) : (
                      <div className="bg-black/40 border border-green-500/30 rounded-xl p-4"
                           style={{ backdropFilter: 'blur(10px)' }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-400 text-xs font-bold uppercase mb-1">Connected</p>
                            <p className="text-white font-mono text-sm">
                              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={disconnectWallet}
                            className="text-red-400 hover:text-red-300 text-sm font-bold uppercase tracking-wide transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-purple-300/50 text-xs mt-2">
                      Connect your wallet to earn NFT rewards and track achievements on-chain
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