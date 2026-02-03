'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/lib/protected-route'
import Navigation from '@/components/navigation'
import { Camera, Play, Square, RotateCcw, Check, X, ArrowLeft } from 'lucide-react'
import apiClient from '@/lib/api-client'

function WorkoutContent() {
  const router = useRouter()
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const [exerciseType, setExerciseType] = useState('pushup') // pushup, squat, pullup
  const [targetReps, setTargetReps] = useState(10)
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [error, setError] = useState('')
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [poseData, setPoseData] = useState<any>(null)

  const exercises: Record<string, { name: string; description: string; icon: string }> = {
    pushup: { name: 'Push-Up', description: 'Lower and raise your body', icon: '💪' },
    squat: { name: 'Squat', description: 'Bend knees and lower hips', icon: '🦵' },
    pullup: { name: 'Pull-Up', description: 'Pull yourself up on the bar', icon: '🔝' },
    burpee: { name: 'Burpee', description: 'Full body exercise', icon: '⚡' },
  }

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        setError('Camera access denied. Please enable camera permissions.')
        console.error('Camera error:', err)
      }
    }

    initCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [])

  // Detect poses and count reps
  useEffect(() => {
    if (!isRunning || !videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const video = videoRef.current

    const detectPose = async () => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return

      // Draw video frame to canvas
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Simulate pose detection (in production, use TensorFlow.js + PoseNet or MediaPipe)
      // This is a placeholder for actual ML detection
      const detectedPose = simulatePoseDetection(canvas)
      
      if (detectedPose) {
        setPoseData(detectedPose)
        
        // Count reps based on exercise type
        const newReps = countReps(detectedPose, exerciseType, repCount)
        if (newReps > repCount) {
          setRepCount(newReps)
          
          // Check if target reached
          if (newReps >= targetReps) {
            setIsCompleted(true)
            setIsRunning(false)
          }
        }
      }
    }

    detectionIntervalRef.current = setInterval(detectPose, 100)

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [isRunning, exerciseType, targetReps, repCount])

  // Simulate pose detection (replace with actual ML model)
  const simulatePoseDetection = (canvas: HTMLCanvasElement): any => {
    // In production, integrate TensorFlow.js or MediaPipe for real pose detection
    // This is a mock implementation
    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height)
    
    if (!imageData) return null

    // Mock pose data with keypoints
    return {
      keypoints: [
        { name: 'nose', y: Math.random() * canvas.height },
        { name: 'leftShoulder', y: Math.random() * canvas.height },
        { name: 'rightShoulder', y: Math.random() * canvas.height },
        { name: 'leftElbow', y: Math.random() * canvas.height },
        { name: 'rightElbow', y: Math.random() * canvas.height },
        { name: 'leftHip', y: Math.random() * canvas.height },
        { name: 'rightHip', y: Math.random() * canvas.height },
        { name: 'leftKnee', y: Math.random() * canvas.height },
        { name: 'rightKnee', y: Math.random() * canvas.height },
      ],
      timestamp: Date.now(),
    }
  }

  // Count reps based on pose data
  const countReps = (pose: any, exercise: string, currentReps: number): number => {
    if (!pose?.keypoints) return currentReps

    const getKeypoint = (name: string) => pose.keypoints.find((k: any) => k.name === name)
    const leftShoulder = getKeypoint('leftShoulder')
    const leftElbow = getKeypoint('leftElbow')
    const leftHip = getKeypoint('leftHip')
    const leftKnee = getKeypoint('leftKnee')

    if (!leftShoulder || !leftElbow || !leftHip || !leftKnee) return currentReps

    // Simple heuristic-based rep counting
    const armAngle = Math.abs(leftShoulder.y - leftElbow.y)
    const legAngle = Math.abs(leftHip.y - leftKnee.y)

    switch (exercise) {
      case 'pushup':
        // Detect arm extension/compression
        if (armAngle > 100) return currentReps + 1
        break
      case 'squat':
        // Detect knee bend
        if (legAngle > 80) return currentReps + 1
        break
      case 'pullup':
        // Detect arm pull
        if (armAngle < 50) return currentReps + 1
        break
      case 'burpee':
        // Complex movement detection
        if (armAngle > 100 && legAngle > 80) return currentReps + 1
        break
    }

    return currentReps
  }

  // Submit completed workout
  const handleSubmitWorkout = async () => {
    try {
      if (repCount < targetReps) {
        setError(`Complete ${targetReps} reps to finish the workout`)
        return
      }

      // Mark task as completed in backend
      await apiClient.post('/workouts/complete', {
        exerciseType,
        repsCompleted: repCount,
        targetReps,
        xpGained: repCount * 10,
      })

      setIsCompleted(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError('Failed to submit workout')
      console.error(err)
    }
  }

  const handleReset = () => {
    setRepCount(0)
    setIsCompleted(false)
    setError('')
    setIsRunning(false)
    setWorkoutStarted(false)
  }

  const handleStartWorkout = () => {
    if (!targetReps || targetReps <= 0) {
      setError('Please set a valid rep target')
      return
    }
    setWorkoutStarted(true)
    setIsRunning(true)
    setError('')
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />

      <main className="overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Live Workout Detector</h1>
          </div>
          <p className="text-purple-300/70 text-sm">AI-powered rep counting with camera detection</p>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Camera Feed */}
            <div className="lg:col-span-2">
              <div className="relative bg-black rounded-2xl border border-purple-500/20 overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="hidden"
                />

                {/* Status Overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-xl border border-green-500/30">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-green-400" />
                      <span className="text-green-300 font-semibold">
                        {isRunning ? 'Recording' : 'Ready'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-xl border border-purple-500/30">
                    <span className="text-purple-300 font-bold text-lg">
                      Reps: {repCount}/{targetReps}
                    </span>
                  </div>
                </div>

                {/* Exercise Type Badge */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-4 py-2 rounded-xl border border-purple-500/30">
                  <p className="text-white font-bold text-sm">{exercises[exerciseType].icon} {exercises[exerciseType].name}</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Control Panel */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Exercise Selection */}
                <div className="bg-black/40 backdrop-blur border border-purple-500/20 rounded-2xl p-4">
                  <label className="block text-purple-200 text-sm font-bold mb-3 uppercase tracking-wider">
                    Exercise Type
                  </label>
                  <div className="space-y-2">
                    {Object.entries(exercises).map(([key, { name, icon }]) => (
                      <button
                        key={key}
                        onClick={() => setExerciseType(key)}
                        disabled={workoutStarted}
                        className={`w-full p-3 rounded-xl text-sm font-bold transition-all text-left ${
                          exerciseType === key
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border border-purple-400'
                            : 'bg-black/40 text-purple-200 border border-purple-500/20 hover:border-purple-500/40'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {icon} {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Reps */}
                <div className="bg-black/40 backdrop-blur border border-purple-500/20 rounded-2xl p-4">
                  <label className="block text-purple-200 text-sm font-bold mb-3 uppercase tracking-wider">
                    Target Reps
                  </label>
                  <input
                    type="number"
                    value={targetReps}
                    onChange={(e) => setTargetReps(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={workoutStarted}
                    className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    min="1"
                    max="100"
                  />
                </div>

                {/* Controls */}
                <div className="space-y-3">
                  {!workoutStarted ? (
                    <button
                      onClick={handleStartWorkout}
                      className="w-full relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition-opacity" />
                      <div className="relative bg-gradient-to-r from-purple-600 to-violet-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-sm border border-purple-400/30">
                        <Play className="w-5 h-5" />
                        Start Workout
                      </div>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsRunning(!isRunning)}
                        className="w-full relative group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-sm border border-blue-400/30">
                          {isRunning ? (
                            <>
                              <Square className="w-5 h-5" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              Resume
                            </>
                          )}
                        </div>
                      </button>

                      {isCompleted ? (
                        <button
                          onClick={handleSubmitWorkout}
                          className="w-full relative group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition-opacity" />
                          <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-sm border border-green-400/30">
                            <Check className="w-5 h-5" />
                            Complete Workout
                          </div>
                        </button>
                      ) : null}

                      <button
                        onClick={handleReset}
                        className="w-full bg-black/40 border border-red-500/30 text-red-300 hover:text-red-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-sm transition-colors"
                      >
                        <RotateCcw className="w-5 h-5" />
                        Reset
                      </button>
                    </>
                  )}
                </div>

                {/* Stats */}
                <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 backdrop-blur border border-purple-500/30 rounded-2xl p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300/70 text-sm">Current Reps</span>
                      <span className="text-white font-bold text-xl">{repCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300/70 text-sm">Target</span>
                      <span className="text-purple-300 font-bold">{targetReps}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300/70 text-sm">Progress</span>
                      <span className="text-emerald-300 font-bold">{Math.round((repCount / targetReps) * 100)}%</span>
                    </div>
                    {isCompleted && (
                      <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
                        <p className="text-green-300 font-bold text-sm">✓ Workout Completed!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 p-6 rounded-2xl bg-black/40 backdrop-blur border border-purple-500/20">
            <h3 className="text-white font-bold mb-3 text-lg">How It Works</h3>
            <ul className="space-y-2 text-purple-300/70 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">1.</span>
                <span>Select your exercise type (Push-Up, Squat, Pull-Up, or Burpee)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">2.</span>
                <span>Set your target number of reps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">3.</span>
                <span>Click "Start Workout" and allow camera access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">4.</span>
                <span>Perform your exercise in front of the camera</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">5.</span>
                <span>AI will automatically count your reps and complete the task when target is reached</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function WorkoutPage() {
  return (
    <ProtectedRoute>
      <WorkoutContent />
    </ProtectedRoute>
  )
}
