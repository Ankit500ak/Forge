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
  const [sensitivity, setSensitivity] = useState(1.0) // multiplier
  const lastPeakRef = useRef<number>(0)
  const lastStateRef = useRef<'neutral' | 'down' | 'up'>('neutral')
  const lastCountTimeRef = useRef<number>(0)
  const baselineRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return

    let unsub: any = null

    const minInterval = 600 // ms between counts to avoid double counting

    const handleMotion = (accY: number) => {
      const now = Date.now()
      const sens = 9.8 * sensitivity // scale to g

      // Initialize baseline
      if (baselineRef.current === null) baselineRef.current = accY

      // High-pass filter: remove baseline drift
      const filtered = accY - baselineRef.current

      // Very simple state machine: detect a downward movement then upward
      // Down detected when filtered < -sensitivity*0.6
      // Up detected when filtered > sensitivity*0.6

      const downThreshold = -0.6 * sensitivity
      const upThreshold = 0.6 * sensitivity

      if (filtered < downThreshold && lastStateRef.current !== 'down') {
        lastStateRef.current = 'down'
        lastPeakRef.current = now
      }

      if (
        filtered > upThreshold &&
        lastStateRef.current === 'down' &&
        now - lastPeakRef.current > 200
      ) {
        // Completed a down->up cycle
        if (now - lastCountTimeRef.current > minInterval) {
          setCount((c) => c + 1)
          lastCountTimeRef.current = now
        }
        lastStateRef.current = 'up'
      }

      // Slowly update baseline (low-pass)
      baselineRef.current = baselineRef.current! * 0.98 + accY * 0.02
    }

    // Browser DeviceMotion
    const webHandler = (ev: DeviceMotionEvent) => {
      const acc = ev.acceleration || ev.accelerationIncludingGravity
      if (!acc) return
      // Prefer Y axis (vertical) but fall back to Z
      const accY = (acc.y ?? acc.z ?? 0) as number
      handleMotion(accY)
    }

    const startWeb = () => {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        // @ts-ignore
        window.addEventListener('devicemotion', webHandler)
        unsub = () => window.removeEventListener('devicemotion', webHandler)
      }
    }

    const startCapacitor = async () => {
      try {
        if (Motion && Motion.addListener) {
          const listener = await Motion.addListener('accel', (ev: any) => {
            // Motion plugin returns accelerationIncludingGravity-like object
            const a = ev.acceleration || ev.accelerationIncludingGravity || ev
            const accY = (a.y ?? a.z ?? 0) as number
            handleMotion(accY)
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
        // ensure removal
        // @ts-ignore
        window.removeEventListener('devicemotion', webHandler)
      }
    }
  }, [running, sensitivity])

  const reset = () => {
    setCount(0)
    baselineRef.current = null
    lastStateRef.current = 'neutral'
    lastCountTimeRef.current = 0
  }

  return (
    <div className="p-4 rounded-xl border bg-card/60">
      <h3 className="text-lg font-bold mb-2">Pushup Counter</h3>
      <p className="text-sm text-muted-foreground mb-4">Place your phone on your chest or nearby and perform pushups. Use sensitivity to tune detection.</p>

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
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        <p>If motion detection is unreliable, try placing your phone flat on your chest or use an external wearable. You can also tap the buttons below to simulate a rep for debugging.</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => setCount((c) => c + 1)} className="px-3 py-1 rounded-md border">+1 (simulate)</button>
        <button onClick={() => setCount((c) => Math.max(0, c - 1))} className="px-3 py-1 rounded-md border">-1</button>
      </div>
    </div>
  )
}
