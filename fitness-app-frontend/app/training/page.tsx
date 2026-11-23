'use client'

import Link from 'next/link'
import Navigation from '@/components/navigation'
import { AiTrainer } from '@/components/system/AiTrainer'
import { ChevronLeftIcon } from '@/components/system/icons'
import { SystemNotification } from '@/components/system/SystemNotification'
import { useSystemState } from '@/lib/system/use-system-state'
import { useLedger } from '@/lib/system/use-ledger'
import { GOLD_PER_TRAINING_REP } from '@/lib/system/rewards'
import '@/components/system/system.css'

/** Deterministic aura particles drifting through the backdrop. */
const PARTICLES: { left: string; top: string; size: number; duration: number; delay: number }[] = [
  { left: '8%', top: '76%', size: 4, duration: 12, delay: -3 },
  { left: '19%', top: '66%', size: 3, duration: 10, delay: -7 },
  { left: '33%', top: '88%', size: 5, duration: 15, delay: -9 },
  { left: '47%', top: '70%', size: 3, duration: 11, delay: -2 },
  { left: '61%', top: '84%', size: 4, duration: 13, delay: -6 },
  { left: '74%', top: '68%', size: 3, duration: 10, delay: -4 },
  { left: '86%', top: '80%', size: 5, duration: 14, delay: -11 },
  { left: '93%', top: '60%', size: 3, duration: 12, delay: -5 },
]

/**
 * AI Training — camera-based rep counting for the daily quest.
 * Fully on-device and local, like the rest of the System layer.
 */
export default function TrainingPage() {
  const system = useSystemState()
  const { state } = system
  const ledger = useLedger()

  // Gold for training: one coin per rep the System applied to the
  // quest, written to the Ledger like every other earning.
  const handleRepsApplied = (reps: number) => {
    if (ledger.status !== 'verified') return
    void ledger.earnGold(reps * GOLD_PER_TRAINING_REP, 'training')
  }

  return (
    <div
      className="sl-system relative min-h-screen"
      style={{ paddingBottom: 'calc(10rem + env(safe-area-inset-bottom))' }}
    >
      <div className="sl-page-bg" aria-hidden>
        <div className="sl-aura sl-aura-blue" />
        <div className="sl-particles">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[880px] space-y-6 px-4 pt-6 sm:pt-10">
        <header className="flex flex-row items-start gap-3">
          <Link
            href="/system"
            className="sl-btn icon mt-1 flex-none"
            aria-label="Back to the System"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="sl-label whitespace-nowrap">Forge // AI Training</p>
            <h1 className="sl-display hero mt-2 whitespace-nowrap text-3xl tracking-[0.12em] sm:text-5xl sm:tracking-[0.14em]">
              AI Training
            </h1>
          </div>
        </header>

        {state === null ? (
          <p className="py-16 text-center text-xs uppercase tracking-[0.35em] text-[#8fd0f2]">
            <span className="sl-blink">▶</span> Accessing the System…
          </p>
        ) : (
          <>
            <AiTrainer
              state={state}
              onAddProgress={system.addProgress}
              onRepsApplied={handleRepsApplied}
            />
            <p className="sl-footer pb-2 text-center text-[0.72rem] leading-relaxed text-[#93bde0]">
              [The System counts only what it can see.
              <br />
              Train in good light, Player.]
            </p>
          </>
        )}
      </main>

      <Navigation />

      {system.notification && (
        <SystemNotification
          notification={system.notification}
          onDismiss={system.dismissNotification}
        />
      )}
    </div>
  )
}
