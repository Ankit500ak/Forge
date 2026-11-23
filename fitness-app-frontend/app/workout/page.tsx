'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { SystemWindow } from '@/components/system/SystemWindow'
import '@/components/system/system.css'

/**
 * The old "Live Workout Detector" on this route was a prototype that
 * simulated pose data — it never counted a real rep. It has been
 * retired: real, on-device AI rep counting lives in AI Training
 * (/training). This page says so plainly and sends the player there.
 */
export default function WorkoutRetiredPage() {
  const router = useRouter()

  useEffect(() => {
    const t = window.setTimeout(() => router.replace('/training'), 4000)
    return () => window.clearTimeout(t)
  }, [router])

  return (
    <div className="sl-system relative min-h-screen">
      <div className="sl-page-bg" aria-hidden>
        <div className="sl-aura sl-aura-blue" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[880px] space-y-6 px-4 pt-6 sm:pt-10">
        <header>
          <p className="sl-label whitespace-nowrap">Forge // System</p>
          <h1 className="sl-display hero mt-2 text-3xl tracking-[0.12em] sm:text-5xl sm:tracking-[0.14em]">
            AI Training
          </h1>
        </header>

        <SystemWindow title="Notice" bare>
          <p className="sl-strip" role="note">
            <span className="sl-strip-bracket" aria-hidden>
              [
            </span>
            <span className="sl-strip-text">This detector has been retired.</span>
            <span className="sl-strip-bracket" aria-hidden>
              ]
            </span>
          </p>
          <p className="mx-auto mt-5 max-w-md text-center text-[0.85rem] leading-relaxed text-[#9fc6e8]">
            The old workout detector only simulated pose detection — it never counted a real
            rep. The System now counts your push-ups, squats and sit-ups with a real on-device
            pose model, and feeds them straight into today&rsquo;s quest.
          </p>
          <div className="mt-6 text-center">
            <Link href="/training" className="sl-btn primary">
              Enter AI Training
            </Link>
            <p className="mt-3 text-[0.72rem] text-[#8fb8d8]">
              [Redirecting you to AI Training…]
            </p>
          </div>
        </SystemWindow>
      </main>

      <Navigation />
    </div>
  )
}
