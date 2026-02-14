import { useEffect, useRef, useState } from 'react'

// This hook encapsulates a very small pushup counting algorithm.
// It mirrors the logic in the component but can be reused separately.

export function usePushupCounter(options?: { sensitivity?: number }) {
  const sensitivity = options?.sensitivity ?? 1.0
  const [count, setCount] = useState(0)
  const [running, setRunning] = useState(false)
  const baselineRef = useRef<number | null>(null)
  const lastStateRef = useRef<'neutral' | 'down' | 'up'>('neutral')
  const lastPeakRef = useRef<number>(0)
  const lastCountTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!running) return

    const minInterval = 600

    const handleMotion = (accY: number) => {
      const now = Date.now()
      if (baselineRef.current === null) baselineRef.current = accY
      const filtered = accY - baselineRef.current
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
        if (now - lastCountTimeRef.current > minInterval) {
          setCount((c) => c + 1)
          lastCountTimeRef.current = now
        }
        lastStateRef.current = 'up'
      }

      baselineRef.current = baselineRef.current * 0.98 + accY * 0.02
    }

    const webHandler = (ev: DeviceMotionEvent) => {
      const acc = ev.acceleration || ev.accelerationIncludingGravity
      if (!acc) return
      const accY = (acc.y ?? acc.z ?? 0) as number
      handleMotion(accY)
    }

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      // @ts-ignore
      window.addEventListener('devicemotion', webHandler)
      return () => {
        // @ts-ignore
        window.removeEventListener('devicemotion', webHandler)
      }
    }

    // If no web motion, do nothing — consumer can push simulated counts
  }, [running, sensitivity])

  const reset = () => {
    setCount(0)
    baselineRef.current = null
    lastStateRef.current = 'neutral'
    lastCountTimeRef.current = 0
  }

  return { count, running, setRunning, reset, setCount }
}
