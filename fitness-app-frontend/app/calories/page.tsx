'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Navigation from '@/components/navigation'
import apiClient from '@/lib/api-client'

interface DetectionResult {
    status: string
    food_name?: string
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    confidence?: number
    error?: string
}

interface CalorieLog {
    food: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  time: string
}

export default function CalorieDetectorPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [dailyLogs, setDailyLogs] = useState<CalorieLog[]>([])
  const [totalCalories, setTotalCalories] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    if (!user) router.push('/')
  }, [user, router])

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1440 } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      alert('Could not access camera. Please check permissions.')
      console.error(err)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setCameraActive(false)
    }
  }

  // Capture and detect
  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Draw video frame to canvas
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)

    // Convert to blob
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return

      const formData = new FormData()
      formData.append('image', blob, 'food.jpg')

      setLoading(true)
      try {
        const response = await apiClient.post('/food/detect', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        setDetectionResult(response.data)
      } catch (err) {
        setDetectionResult({
          status: 'error',
          error: err instanceof Error ? err.message : 'Detection failed',
        })
      } finally {
        setLoading(false)
      }
    }, 'image/jpeg', 0.95)
  }

  // Upload image file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    setLoading(true)
    try {
      const response = await apiClient.post('/food/detect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setDetectionResult(response.data)
    } catch (err) {
      setDetectionResult({
        status: 'error',
        error: err instanceof Error ? err.message : 'Detection failed',
      })
    } finally {
      setLoading(false)
    }
  }

  // Add to daily log
  const addToLog = () => {
    if (!detectionResult || detectionResult.status !== 'success') return

    const log: CalorieLog = {
      food: detectionResult.food_name || 'Unknown Food',
      calories: detectionResult.calories || 0,
      protein: detectionResult.protein,
      carbs: detectionResult.carbs,
      fat: detectionResult.fat,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setDailyLogs([log, ...dailyLogs])
    setTotalCalories(prev => prev + log.calories)
    setDetectionResult(null)
  }

  if (!mounted || !user) return null

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a10' }}>
      <Navigation />

      <header
        className="sticky top-0 z-20 flex items-center justify-between px-5 py-4"
        style={{
          background: 'linear-gradient(180deg, #0a0a10f5 0%, #0a0a1080 100%)',
          borderBottom: '1px solid #ffffff0a',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div>
          <h1 className="text-xl font-black text-white leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>
            Calorie Detector
          </h1>
          <p className="text-[10px] text-zinc-600 mt-0.5 tracking-widest uppercase">AI-Powered Food Recognition</p>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-4">
        {/* Daily Summary */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, #ff6b6b18 0%, #ffd93d08 100%)',
            border: '1px solid #ff6b6b30',
            boxShadow: '0 0 40px #ff6b6b0a',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: '#ff6b6b99' }}>
                Today's Intake
              </p>
              <p className="text-4xl font-black mt-2" style={{ color: '#ff6b6b', fontFamily: "'Syne', sans-serif" }}>
                {totalCalories.toLocaleString()}
              </p>
              <p className="text-[11px] mt-1" style={{ color: '#ff6b6b70' }}>
                kcal · {dailyLogs.length} meal{dailyLogs.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ff6b6b30 0%, #ffd93d20 100%)',
                border: '2px solid #ff6b6b40',
              }}
            >
              <span className="text-4xl">🍽️</span>
            </div>
          </div>
        </div>

        {/* Camera Section */}
        <div
          className="rounded-2xl p-4 overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #16161e 0%, #0f0f15 100%)',
            border: '1px solid #60a5fa25',
          }}
        >
          {!cameraActive ? (
            <div className="space-y-3">
              <button
                onClick={startCamera}
                className="w-full py-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                  boxShadow: '0 0 32px #60a5fa40',
                }}
              >
                📷 Start Camera
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-lg font-semibold transition-all border"
                style={{
                  background: '#ffffff05',
                  border: '1px solid #60a5fa30',
                  color: '#60a5fa',
                }}
              >
                📁 Upload Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
                style={{ aspectRatio: '16/9', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-3">
                <button
                  onClick={captureAndDetect}
                  disabled={loading}
                  className="flex-1 py-4 rounded-lg font-bold text-white transition-all"
                  style={{
                    background: loading ? '#6b7280' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? '🔍 Detecting...' : '📸 Capture & Detect'}
                </button>

                <button
                  onClick={stopCamera}
                  className="px-6 py-4 rounded-lg font-bold transition-all border"
                  style={{
                    background: '#ffffff05',
                    border: '1px solid #ef444430',
                    color: '#ef4444',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detection Result */}
        {detectionResult && (
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: 'linear-gradient(160deg, #16161e 0%, #0f0f15 100%)',
              border: detectionResult.status === 'success' ? '1px solid #22c55e40' : '1px solid #ef444440',
            }}
          >
            {detectionResult.status === 'success' ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-black text-white">{detectionResult.food_name}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Confidence: {Math.round((detectionResult.confidence || 0) * 100)}%
                    </p>
                  </div>
                  <div
                    className="text-4xl px-4 py-2 rounded-lg"
                    style={{ background: '#22c55e20' }}
                  >
                    ✓
                  </div>
                </div>

                {/* Nutrition Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ background: '#ffffff05', border: '1px solid #ffffff10' }}>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest">Calories</p>
                    <p className="text-2xl font-black mt-1" style={{ color: '#ff6b6b' }}>
                      {detectionResult.calories}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: '#ffffff05', border: '1px solid #ffffff10' }}>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest">Protein</p>
                    <p className="text-2xl font-black mt-1" style={{ color: '#60a5fa' }}>
                      {detectionResult.protein}g
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: '#ffffff05', border: '1px solid #ffffff10' }}>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest">Carbs</p>
                    <p className="text-2xl font-black mt-1" style={{ color: '#fbbf24' }}>
                      {detectionResult.carbs}g
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: '#ffffff05', border: '1px solid #ffffff10' }}>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest">Fat</p>
                    <p className="text-2xl font-black mt-1" style={{ color: '#ec4899' }}>
                      {detectionResult.fat}g
                    </p>
                  </div>
                </div>

                <button
                  onClick={addToLog}
                  className="w-full py-4 rounded-lg font-bold text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    boxShadow: '0 0 32px #22c55e40',
                  }}
                >
                  ✓ Add to Daily Log
                </button>
              </>
            ) : (
              <div>
                <p className="text-red-400 font-semibold">❌ Detection Failed</p>
                <p className="text-sm text-red-300/70 mt-1">{detectionResult.error}</p>
                <button
                  onClick={() => setDetectionResult(null)}
                  className="mt-3 px-4 py-2 rounded text-sm font-semibold"
                  style={{ background: '#ef444430', color: '#ef4444' }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Daily Log */}
        {dailyLogs.length > 0 && (
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(160deg, #16161e 0%, #0f0f15 100%)',
              border: '1px solid #a78bfa25',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: '#a78bfa' }} />
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#a78bfa' }}>
                Today's Meals
              </h2>
            </div>

            <div className="space-y-3">
              {dailyLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: '#ffffff05', border: '1px solid #ffffff10' }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{log.food}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{log.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: '#ff6b6b' }}>
                      {log.calories}
                    </p>
                    <p className="text-xs text-zinc-500">kcal</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:wght@400;500&display=swap');
      `}</style>
    </div>
  )
}
