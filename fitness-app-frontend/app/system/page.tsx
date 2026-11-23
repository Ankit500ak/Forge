'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/navigation'
import { BossQuest } from '@/components/system/BossQuest'
import { DailyQuest } from '@/components/system/DailyQuest'
import { LedgerPanel } from '@/components/system/LedgerPanel'
import { ProgressRecords } from '@/components/system/ProgressRecords'
import { RecoveryQuest } from '@/components/system/RecoveryQuest'
import { RewardModal, type RewardModalData } from '@/components/system/RewardModal'
import { SystemShop } from '@/components/system/SystemShop'
import { WeeklyQuest } from '@/components/system/WeeklyQuest'
import { ChevronLeftIcon } from '@/components/system/icons'
import { StatusWindow } from '@/components/system/StatusWindow'
import { SystemWindow } from '@/components/system/SystemWindow'
import { SystemNotification } from '@/components/system/SystemNotification'
import { useSystemState } from '@/lib/system/use-system-state'
import { useLedger } from '@/lib/system/use-ledger'
import type { ItemKey } from '@/lib/system/ledger'
import {
  BOSS_GOLD_REWARD,
  DAILY_CLAIM_GOLD,
  TITLE_DEFS,
  WEEKLY_CLAIM_GOLD,
  bestStreak,
  earnedTitleIds,
  rollLootDrop,
} from '@/lib/system/rewards'
import { isQuestComplete, isWeeklyComplete } from '@/lib/system/types'
import { useAuth } from '@/lib/auth-context'
import '@/components/system/system.css'

/** Deterministic aura particles drifting through the backdrop. */
const PARTICLES: { left: string; top: string; size: number; duration: number; delay: number }[] = [
  { left: '6%', top: '78%', size: 5, duration: 13, delay: -2 },
  { left: '14%', top: '64%', size: 3, duration: 10, delay: -6 },
  { left: '22%', top: '88%', size: 4, duration: 15, delay: -9 },
  { left: '31%', top: '72%', size: 3, duration: 11, delay: -4 },
  { left: '40%', top: '92%', size: 5, duration: 14, delay: -11 },
  { left: '48%', top: '68%', size: 3, duration: 9, delay: -1 },
  { left: '57%', top: '84%', size: 4, duration: 12, delay: -7 },
  { left: '65%', top: '76%', size: 3, duration: 10, delay: -3 },
  { left: '72%', top: '90%', size: 5, duration: 16, delay: -13 },
  { left: '80%', top: '66%', size: 3, duration: 11, delay: -5 },
  { left: '87%', top: '82%', size: 4, duration: 13, delay: -8 },
  { left: '93%', top: '74%', size: 3, duration: 10, delay: -10 },
  { left: '18%', top: '45%', size: 3, duration: 12, delay: -12 },
  { left: '84%', top: '40%', size: 3, duration: 14, delay: -6 },
  { left: '52%', top: '50%', size: 2, duration: 9, delay: -3 },
  { left: '36%', top: '38%', size: 2, duration: 11, delay: -9 },
]

/**
 * The System — a Solo Leveling-inspired layer for Forge.
 * Fully local: player state lives in localStorage (see lib/system).
 * Intentionally not auth-gated so the System works even when the
 * Forge backend is unreachable.
 */
export default function SystemPage() {
  const { user } = useAuth()
  const system = useSystemState()
  const { state } = system
  const ledger = useLedger()
  const derived = ledger.derived
  const [pulseStats, setPulseStats] = useState(false)
  const [rewardQueue, setRewardQueue] = useState<RewardModalData[]>([])
  const shieldHandledRef = useRef<Set<string>>(new Set())
  const titleBaselineRef = useRef(false)
  const titleSubmittedRef = useRef<Set<string>>(new Set())

  const playerName = user?.name?.trim() || user?.email?.split('@')[0] || 'Player'

  // --- Reward-economy wiring -------------------------------------------------
  // Every handler below follows the same pattern: the System state moves
  // first (its own guards decide), then the matching value is written to
  // the Ledger. Ledger appends are idempotent per claim, so a claim can
  // never pay out twice.

  const handleClaimDaily = useCallback(() => {
    if (!state) return
    const claimable =
      state.lastClaimedDate !== state.questDate &&
      isQuestComplete(state.questProgress, state.level, state.questCommitted)
    system.claimReward()
    if (!claimable || ledger.status !== 'verified') return
    void ledger.earnGold(DAILY_CLAIM_GOLD, 'daily-claim', `daily:${state.questDate}`)
    const drop = rollLootDrop()
    if (drop) {
      void ledger.dropItem(drop)
      setRewardQueue((q) => [...q, { kind: 'loot', item: drop }])
    }
  }, [state, system, ledger])

  const handleClaimWeekly = useCallback(() => {
    if (!state) return
    const claimable = state.weeklyClaimedKey !== state.weekKey && isWeeklyComplete(state)
    system.claimWeeklyReward()
    if (!claimable || ledger.status !== 'verified') return
    void ledger.earnGold(WEEKLY_CLAIM_GOLD, 'weekly-claim', `weekly:${state.weekKey}`)
    void ledger.earnKey(state.weekKey)
  }, [state, system, ledger])

  const handleOpenBoss = useCallback(async () => {
    if (!state || !derived) return
    if (derived.items['dungeon-key'] <= 0) return
    if (state.bossQuest?.date === state.questDate) return
    if (state.lastClaimedDate === state.questDate) return
    const used = await ledger.useItem('dungeon-key', {
      context: 'boss-open',
      date: state.questDate,
    })
    if (used) system.openBossQuest()
  }, [state, derived, ledger, system])

  const handleClaimBossVictory = useCallback(() => {
    if (!state?.bossQuest || state.bossQuest.status !== 'won') return
    const { bossName, date } = state.bossQuest
    system.claimBossVictory()
    if (ledger.status !== 'verified') return
    void ledger.recordBossWin(bossName, date)
    void ledger.earnGold(BOSS_GOLD_REWARD, 'boss', `boss:${date}`)
  }, [state, system, ledger])

  const handleUseItem = useCallback(
    async (item: ItemKey) => {
      if (!state) return
      if (item === 'double-xp-elixir') {
        if (await ledger.useItem(item)) system.armElixir()
      } else if (item === 'rest-pass') {
        if (state.lastClaimedDate === state.questDate) return
        if (await ledger.useItem(item, { date: state.questDate })) system.applyRestDay()
      }
    },
    [state, ledger, system],
  )

  // Streak Shield: the moment a missed day is on record and a shield is
  // held, the shield is consumed and the record is protected — no
  // penalty, no recovery quest, the streak survives.
  useEffect(() => {
    if (!state?.missedDate) return
    if (ledger.status !== 'verified' || !derived) return
    if (derived.items['streak-shield'] <= 0) return
    const date = state.missedDate
    if (shieldHandledRef.current.has(date)) return
    shieldHandledRef.current.add(date)
    void ledger.useItem('streak-shield', { auto: true, date }).then((used) => {
      if (used) system.applyShieldProtection(date)
    })
  }, [state, ledger, derived, system])

  // Titles: whenever the Player's records satisfy a title that the
  // Ledger has not sealed yet, seal it. The first evaluation of a
  // session records silently (a veteran's backlog is not a fanfare);
  // titles earned live get their moment.
  useEffect(() => {
    if (!state || !derived || ledger.status !== 'verified') return
    const progress = {
      lifetimeReps: state.lifetimeReps,
      bestStreak: bestStreak(state.questHistory, state.questDate),
      bossWins: derived.shadows.length,
      lifetimeGoldEarned: derived.lifetimeGoldEarned,
    }
    const candidates = earnedTitleIds(progress).filter(
      (id) => !derived.titles.includes(id) && !titleSubmittedRef.current.has(id),
    )
    for (const id of candidates) {
      const def = TITLE_DEFS.find((t) => t.id === id)
      if (!def) continue
      titleSubmittedRef.current.add(id)
      void ledger.earnTitle(id, def.name)
      if (titleBaselineRef.current) {
        setRewardQueue((q) => [...q, { kind: 'title', title: def }])
      }
    }
    titleBaselineRef.current = true
  }, [state, derived, ledger])

  const titleStatuses = TITLE_DEFS.map((def) => ({
    def,
    earned: derived?.titles.includes(def.id) ?? false,
  }))
  const latestTitleId = derived?.titles[derived.titles.length - 1]
  const currentTitle =
    TITLE_DEFS.find((t) => t.id === latestTitleId)?.name ?? 'Player'

  // Accepting a level-up returns the player to the Status window and
  // pulses the stat numbers, so the growth is seen where it landed.
  const handleDismissNotification = useCallback(() => {
    const current = system.notification
    system.dismissNotification()
    if (current?.kind === 'levelup') {
      requestAnimationFrame(() => {
        document
          .getElementById('sl-status')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      setPulseStats(true)
      window.setTimeout(() => setPulseStats(false), 2000)
    }
  }, [system])

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
            href="/dashboard"
            className="sl-btn icon mt-1 flex-none"
            aria-label="Back to dashboard"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="sl-label whitespace-nowrap">Forge // System</p>
            <h1 className="sl-display hero mt-2 whitespace-nowrap text-3xl tracking-[0.12em] sm:text-5xl sm:tracking-[0.14em]">
              The System
            </h1>
          </div>
        </header>

        {state === null ? (
          <p className="py-16 text-center text-xs uppercase tracking-[0.35em] text-[#8fd0f2]">
            <span className="sl-blink">▶</span> Accessing the System…
          </p>
        ) : (
          <>
            <StatusWindow
              playerName={playerName}
              state={state}
              onAllocate={system.allocateStat}
              pulseStats={pulseStats}
              gold={derived?.gold}
              currentTitle={currentTitle}
              titles={titleStatuses}
            />
            <DailyQuest
              state={state}
              onAddProgress={system.addProgress}
              onCompleteTask={system.completeQuestTask}
              onClaimReward={handleClaimDaily}
              onDismissMissedWarning={system.dismissMissedWarning}
            />
            {state.recoveryForDate && (
              <RecoveryQuest
                state={state}
                onAddProgress={system.addRecoveryProgress}
                onCompleteTask={system.completeRecoveryTask}
                onClaimRecovery={system.claimRecovery}
              />
            )}
            <WeeklyQuest state={state} onClaimWeekly={handleClaimWeekly} />
            <BossQuest
              state={state}
              keys={derived?.items['dungeon-key'] ?? 0}
              locked={ledger.locked}
              onOpen={handleOpenBoss}
              onClaimVictory={handleClaimBossVictory}
            />
            <SystemWindow title="AI Training" style={{ animationDelay: '0.18s' }}>
              <p className="text-center text-[0.82rem] leading-relaxed text-[#9fc6e8]">
                [The System can now watch your training. Pose detection counts your push-ups,
                squats and sit-ups — and feeds them straight into today&rsquo;s quest.]
              </p>
              <div className="mt-4 text-center">
                <Link href="/training" className="sl-btn primary">
                  Enter AI Training
                </Link>
              </div>
            </SystemWindow>
            {derived && (
              <SystemShop
                locked={ledger.locked}
                gold={derived.gold}
                items={derived.items}
                elixirArmed={state.elixirArmed}
                purchases={derived.purchases}
                onBuy={ledger.buyReward}
                onRedeem={ledger.redeemReward}
                onUseItem={handleUseItem}
              />
            )}
            <ProgressRecords state={state} shadows={derived?.shadows} />
            <LedgerPanel
              status={ledger.status}
              entries={ledger.entries}
              firstInvalidIndex={ledger.firstInvalidIndex}
              onRestore={ledger.restore}
            />
            <p className="sl-footer pb-2 text-center text-[0.72rem] leading-relaxed text-[#93bde0]">
              [The System will issue a new quest every day.
              <br />
              Arise, Player.]
            </p>
          </>
        )}
      </main>

      <Navigation />

      {system.notification && (
        <SystemNotification
          notification={system.notification}
          onDismiss={handleDismissNotification}
        />
      )}

      {/* Loot drops and title moments queue behind System notifications. */}
      {!system.notification && rewardQueue.length > 0 && (
        <RewardModal
          data={rewardQueue[0]}
          onDismiss={() => setRewardQueue((q) => q.slice(1))}
        />
      )}
    </div>
  )
}
