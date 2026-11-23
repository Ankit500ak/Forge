'use client'

import { useEffect } from 'react'
import '@/components/system/system.css'

/**
 * Root error boundary in the System's voice: when something breaks, the
 * player gets a calm System notice and a way back in — never a raw
 * framework error screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="sl-system relative flex min-h-screen items-center justify-center px-4">
      <div className="sl-page-bg" aria-hidden>
        <div className="sl-aura sl-aura-blue" />
      </div>
      <main className="relative z-10 w-full max-w-md text-center">
        <p className="sl-label">Forge // System</p>
        <h1 className="sl-display hero mt-3 text-3xl tracking-[0.12em]">System Error</h1>
        <p className="mt-5 text-[0.85rem] leading-relaxed text-[#9fc6e8]">
          [An unexpected error has occurred. The System could not complete that request.]
        </p>
        <p className="mt-2 text-[0.78rem] leading-relaxed text-[#8fb8d8]">
          [Your progress is stored on this device and has not been lost.]
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button type="button" className="sl-btn primary" onClick={() => reset()}>
            Try Again
          </button>
          <a href="/system" className="sl-btn ghost">
            Return to the System
          </a>
        </div>
      </main>
    </div>
  )
}
