'use client'

import { BOSS_GOLD_REWARD, bossTarget } from '@/lib/system/rewards'
import type { SystemState } from '@/lib/system/types'
import { SystemWindow } from './SystemWindow'
import { CheckIcon, CoinIcon, KeyIcon, LockIcon, SkullIcon } from './icons'

interface BossQuestProps {
  state: SystemState
  /** Dungeon Keys held (derived from the ledger). */
  keys: number
  /** True while the ledger is loading or broken. */
  locked: boolean
  onOpen: () => void
  onClaimVictory: () => void
}

/**
 * The Boss Quest gate. A Dungeon Key (earned from the Weekly Quest)
 * opens one gate per day: a single big push-up total, fed by the same
 * training progress as the daily quest. Victory pays gold and leaves a
 * shadow in the Records; defeat costs only the key.
 */
export function BossQuest({ state, keys, locked, onOpen, onClaimVictory }: BossQuestProps) {
  const boss = state.bossQuest
  const todaysBoss = boss && boss.date === state.questDate ? boss : null
  const claimedToday = state.lastClaimedDate === state.questDate
  const targetIfOpened = bossTarget(state.level)
  const pct = todaysBoss ? Math.min(100, (todaysBoss.progress / todaysBoss.target) * 100) : 0

  const stripText = todaysBoss
    ? todaysBoss.status === 'active'
      ? `A boss awaits: ${todaysBoss.bossName}.`
      : todaysBoss.status === 'won'
        ? `${todaysBoss.bossName} has fallen. Claim your victory.`
        : todaysBoss.status === 'claimed'
          ? 'Boss defeated. Its shadow serves you now.'
          : 'The boss escaped.'
    : keys > 0
      ? 'A Dungeon Key turns in your inventory.'
      : 'The gate is sealed. Earn a Dungeon Key from the Weekly Quest.'

  return (
    <SystemWindow title="Boss Quest" style={{ animationDelay: '0.18s' }} bare>
      <p className="sl-strip" role="note">
        <span className="sl-strip-bracket" aria-hidden>
          [
        </span>
        <span className="sl-strip-text">{stripText}</span>
        <span className="sl-strip-bracket" aria-hidden>
          ]
        </span>
      </p>

      {!todaysBoss ? (
        <div className="mt-5 text-center">
          <span className="sl-item-icon gold mx-auto" style={{ width: 58, height: 58 }}>
            <SkullIcon className="h-7 w-7" />
          </span>
          <h3 className="sl-display mt-3 text-[1.4rem] leading-tight tracking-wide sm:text-3xl">
            The dungeon gate
          </h3>
          <p className="mx-auto mt-2.5 max-w-sm text-[0.8rem] leading-relaxed text-[#9fc6e8]">
            One key opens one gate, for one day: <span className="sl-num">{targetIfOpened}</span>{' '}
            push-ups before the day ends. Training feeds the hunt exactly as it feeds your quest.
            Win, and the boss&rsquo;s shadow joins your collection.
          </p>
          {boss?.status === 'lost' && (
            <p className="mt-3 text-[0.74rem] text-[#fca5a5]">
              [The {boss.bossName} escaped on {boss.date}. The key was consumed.]
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="sl-chip">
              <span className="sl-chip-label">Victory:</span>
              <span className="sl-num">+{BOSS_GOLD_REWARD} Gold · +1 Shadow</span>
            </span>
            <span className="sl-gold-chip">
              <KeyIcon />
              Keys <span className="sl-num">{keys}</span>
            </span>
          </div>
          <div className="mt-5">
            <button
              type="button"
              className="sl-btn primary sl-claim"
              onClick={onOpen}
              disabled={locked || keys <= 0 || claimedToday}
            >
              {keys <= 0 ? <LockIcon className="h-4 w-4" aria-hidden /> : <KeyIcon className="h-4 w-4" aria-hidden />}
              Open the Gate
            </button>
            <p className="sl-claim-note">
              {locked
                ? 'The Ledger must verify before a gate can open.'
                : keys <= 0
                  ? 'No Dungeon Keys held'
                  : claimedToday
                    ? "Today's reward is claimed — the gate opens tomorrow"
                    : 'The key is consumed when the gate opens, win or lose'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-center gap-3.5">
            <span className="sl-item-icon" style={{ borderColor: 'rgba(167,139,250,0.5)', color: '#c4b5fd' }}>
              <SkullIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold text-white">{todaysBoss.bossName}</p>
              <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[#a9cdec]">
                Boss Quest — Push-ups
              </p>
            </div>
            <div className="flex-none text-right">
              <p className="sl-num text-[1.55rem] font-extrabold leading-none text-white">
                {todaysBoss.progress}
              </p>
              <p className="sl-num mt-1 text-[0.7rem] font-medium tracking-wider text-[#a9cdec]">
                / {todaysBoss.target} reps
              </p>
            </div>
          </div>
          <div className="sl-bar mt-3" style={{ height: 7 }}>
            <div
              className="sl-bar-fill quest"
              style={{
                width: `${pct}%`,
                background:
                  todaysBoss.status === 'won' || todaysBoss.status === 'claimed'
                    ? 'linear-gradient(90deg,#8b5cf6,#c4b5fd)'
                    : undefined,
              }}
            />
          </div>

          <div className="mt-5 text-center">
            {todaysBoss.status === 'active' && (
              <p className="text-[0.78rem] leading-relaxed text-[#9fc6e8]">
                [Every push-up you log today strikes the boss. Finish before the day ends, or it
                escapes and the key is lost.]
              </p>
            )}
            {todaysBoss.status === 'won' && (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="sl-chip">
                    <span className="sl-chip-label">Reward:</span>
                    <span className="sl-num">+{BOSS_GOLD_REWARD} Gold · +1 Shadow</span>
                  </span>
                </div>
                <button
                  type="button"
                  className="sl-btn primary sl-claim"
                  onClick={onClaimVictory}
                  disabled={locked}
                >
                  <CoinIcon className="h-4 w-4" aria-hidden />
                  Claim Victory
                </button>
                {locked && (
                  <p className="sl-claim-note">The Ledger must verify before victory is recorded</p>
                )}
              </>
            )}
            {todaysBoss.status === 'claimed' && (
              <p className="sl-value inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.28em]">
                <span className="sl-check-badge">
                  <CheckIcon className="h-3 w-3" />
                </span>
                Victory Recorded — Shadow Acquired
              </p>
            )}
          </div>
        </div>
      )}
    </SystemWindow>
  )
}
