'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'

// Lazy import Capacitor Motion to avoid SSR errors
let Motion: any = null
try {
  // @ts-ignore
  const cap = require('@capacitor/motion')
  Motion = cap.Motion
} catch (e) {
  // Capacitor not available in web dev environment — that's fine
}

export function PushupCounter() {
  const [count, setCount] = useState(0)
  const [running, setRunning] = useState(false)
  const [sensitivity, setSensitivity] = useState(1.0) // multiplier (0.5 to 2.0)

  // Signal processing buffers
  const accelHistoryRef = useRef<number[]>([])
  const filteredHistoryRef = useRef<number[]>([])
  const peaksRef = useRef<Array<{ time: number; value: number }>>([])

  const lastCountTimeRef = useRef<number>(0)
  const baselineRef = useRef<number | null>(null)
  const lastPeakRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return

    let unsub: any = null

    // Step detection parameters (tuned for realistic motion)
    const MAX_HISTORY = 50          // Keep 50 samples (~500ms at 100Hz)
    const MIN_PEAK_INTERVAL = 300   // Min ms between consecutive peaks
    const MAGNITUDE_THRESHOLD = 0.5 // m/s² - need at least this much acceleration
    const PEAK_PROMINENCE = 1.2     // Peak must be 1.2x higher than surrounding average

    // Low-pass filter to smooth noise
    const lowPassFilter = (raw: number, lastFiltered: number, alpha: number = 0.3): number => {
      return lastFiltered * (1 - alpha) + raw * alpha
    }

    // Detect if a point is a local peak
    const isPeak = (index: number, history: number[], prominence: number): boolean => {
      if (index === 0 || index === history.length - 1) return false

      const value = history[index]
      const before = history[index - 1]
      const after = history[index + 1]

      // Peak should be higher than both neighbors
      if (value <= before || value <= after) return false

      // Calculate prominence (how much higher than surrounding points)
      const windowSize = 5
      const start = Math.max(0, index - windowSize)
      const end = Math.min(history.length, index + windowSize + 1)
      const window = history.slice(start, end).filter((_, i) => i !== index - start)
      const avgNeighbors = window.reduce((a, b) => a + b, 0) / window.length

      // Peak should stand out significantly
      return value > avgNeighbors * prominence
    }

    // Detect peaks in filtered signal
    const detectPeaks = (filtered: number[], threshold: number) => {
      const detectedPeaks: Array<{ index: number; value: number }> = []

      for (let i = 1; i < filtered.length - 1; i++) {
        if (isPeak(i, filtered, PEAK_PROMINENCE) && Math.abs(filtered[i]) > threshold) {
          detectedPeaks.push({ index: i, value: filtered[i] })
        }
      }

      return detectedPeaks
    }

    // Count cycles: detect alternating peaks (down and up motion)
    const countStep = (now: number) => {
      // Check if enough time has passed
      if (now - lastCountTimeRef.current < MIN_PEAK_INTERVAL) return

      // Check if we have recent peaks showing up-down or down-up pattern
      const recentPeaks = peaksRef.current.filter(p => now - p.time < 800) // Last 800ms

      if (recentPeaks.length >= 2) {
        // Check if peaks alternate in sign (one negative, one positive)
        const values = recentPeaks.map(p => p.value)
        const signs = values.map(v => v > 0 ? 1 : -1)

        if (signs.length >= 2 && signs[signs.length - 1] !== signs[signs.length - 2]) {
          setCount((c) => c + 1)
          lastCountTimeRef.current = now
          lastPeakRef.current = now

          console.log(`✓ Step detected at ${now}ms | Recent peaks:`, recentPeaks.length)
        }
      }
    }

    const handleMotion = (accY: number, now: number) => {
      // Initialize baseline on first measurement
      if (baselineRef.current === null) {
        baselineRef.current = accY
        return
      }

      // Remove DC bias (gravity)
      const raw = accY - baselineRef.current

      // Apply low-pass filter to smooth noise
      const lastFiltered = filteredHistoryRef.current.length > 0
        ? filteredHistoryRef.current[filteredHistoryRef.current.length - 1]
        : raw
      const filtered = lowPassFilter(raw, lastFiltered, 0.3)

      // Keep history buffers
      accelHistoryRef.current.push(raw)
      filteredHistoryRef.current.push(filtered)

      if (accelHistoryRef.current.length > MAX_HISTORY) {
        accelHistoryRef.current.shift()
        filteredHistoryRef.current.shift()
      }

      // Detect peaks in the filtered signal
      const newPeaks = detectPeaks(filteredHistoryRef.current, MAGNITUDE_THRESHOLD * sensitivity)

      // Track new peaks
      if (newPeaks.length > 0) {
        const lastNewPeak = newPeaks[newPeaks.length - 1]
        const peakValue = filteredHistoryRef.current[lastNewPeak.index]

        // Check if this is a new peak (not seen before)
        const isPeakNew = !peaksRef.current.some(p => now - p.time < 100)

        if (isPeakNew) {
          peaksRef.current.push({ time: now, value: peakValue })

          // Keep only recent peaks
          peaksRef.current = peaksRef.current.filter(p => now - p.time < 1000)

          // Try to count if we have cycled
          countStep(now)
        }
      }

      // Update baseline slowly (adaptive to drift)
      baselineRef.current = baselineRef.current * 0.99 + accY * 0.01
    }

    // Browser DeviceMotion handler
    const webHandler = (ev: DeviceMotionEvent) => {
      const acc = ev.acceleration || ev.accelerationIncludingGravity
      if (!acc) return
      const accY = (acc.y ?? acc.z ?? 0) as number
      handleMotion(accY, Date.now())
    }

    const startWeb = () => {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.addEventListener('devicemotion', webHandler)
        unsub = () => window.removeEventListener('devicemotion', webHandler)
      }
    }

    const startCapacitor = async () => {
      try {
        if (Motion && Motion.addListener) {
          const listener = await Motion.addListener('accel', (ev: any) => {
            const a = ev.acceleration || ev.accelerationIncludingGravity || ev
            const accY = (a.y ?? a.z ?? 0) as number
            handleMotion(accY, Date.now())
          })
          unsub = async () => {
            try {
              await listener.remove()
            } catch (e) {
              // ignore
            }
          }
        } else {
          startWeb()
        }
      } catch (e) {
        startWeb()
      }
    }

    startCapacitor()

    return () => {
      if (unsub) {
        try {
          unsub()
        } catch (e) {
          // ignore
        }
      } else {
        window.removeEventListener('devicemotion', webHandler)
      }
    }
  }, [running, sensitivity])

  const reset = () => {
    setCount(0)
    baselineRef.current = null
    lastCountTimeRef.current = 0
    lastPeakRef.current = null
    accelHistoryRef.current = []
    filteredHistoryRef.current = []
    peaksRef.current = []
  }

  return (
    <div className="p-4 rounded-xl border bg-card/60">
      <h3 className="text-lg font-bold mb-2">Pushup Counter</h3>
      <p className="text-sm text-muted-foreground mb-4">🎯 Perform smooth, deliberate pushups. The counter uses peak detection to ignore phone shakes.</p>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-6xl font-extrabold">{count}</div>
        <div className="flex flex-col">
          <button
            className={`px-4 py-2 rounded-md font-semibold ${running ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? 'Stop' : 'Start'}
          </button>
          <button className="mt-2 px-3 py-1 rounded-md border" onClick={reset}>Reset</button>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-sm">Sensitivity: {sensitivity.toFixed(2)}</label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.05"
          value={sensitivity}
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">Lower = stricter, Higher = more sensitive</p>
      </div>

      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
        <p>✨ <strong>Improved Detection:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Peak detection - ignores random shakes</li>
          <li>Signal filtering - smooths out noise</li>
          <li>Magnitude checking - requires real motion</li>
          <li>Cycle detection - counts full up-down patterns</li>
        </ul>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => setCount((c) => c + 1)} className="px-3 py-1 rounded-md border text-xs">+1 (test)</button>
        <button onClick={() => setCount((c) => Math.max(0, c - 1))} className="px-3 py-1 rounded-md border text-xs">-1</button>
      </div>
    </div>
  )
}
