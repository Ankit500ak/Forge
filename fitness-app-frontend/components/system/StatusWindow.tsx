'use client'

import type { ComponentType } from 'react'
import {
  STAT_KEYS,
  STAT_LABELS,
  nextRankForLevel,
  questCompletionFraction,
  rankForLevel,
  rankTitle,
  xpForNextLevel,
  type StatKey,
  type SystemState,
} from '@/lib/system/types'
import type { TitleDef } from '@/lib/system/rewards'
import { SystemWindow } from './SystemWindow'
import { CheckIcon, CoinIcon, CrownIcon, EyeIcon, FlameIcon, HeartIcon, LockIcon, SwordIcon, WindIcon } from './icons'

const STAT_ICONS: Record<StatKey, ComponentType<{ className?: string }>> = {
  STR: SwordIcon,
  AGI: WindIcon,
  VIT: HeartIcon,
  END: FlameIcon,
  PER: EyeIcon,
}

export interface TitleStatus {
  def: TitleDef
  earned: boolean
}

interface StatusWindowProps {
  playerName: string
  state: SystemState
  onAllocate: (key: StatKey) => void
  /** Briefly pulse the stat numbers (e.g. right after a level-up). */
  pulseStats?: boolean
  /** Gold balance, derived from the System Ledger. */
  gold?: number
  /** The Player's current (most recently earned) title. */
  currentTitle?: string
  /** Every title and whether the Player's records have earned it. */
  titles?: TitleStatus[]
}

function Bar({
  label,
  value,
  max,
  variant,
}: {
  label: string
  value: number
  max: number
  variant?: 'hp' | 'mp' | 'xp'
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const isXp = variant === 'xp'
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="sl-label">{label}</span>
        <span className="sl-num text-xs font-bold text-[#eaf9ff]">
          {value} <span className="font-medium text-[#8fd0f2]">/ {max}</span>
        </span>
      </div>
      <div className={`sl-bar ${isXp ? 'xp' : ''}`}>
        <div className={`sl-bar-fill ${variant ?? ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Player Status window: hero level/rank display, XP + flavour bars, stat tiles. */
export function StatusWindow({
  playerName,
  state,
  onAllocate,
  pulseStats,
  gold,
  currentTitle,
  titles,
}: StatusWindowProps) {
  const rank = rankForLevel(state.level)
  const nextRank = nextRankForLevel(state.level)
  const xpNext = xpForNextLevel(state.level)
  // Flavour bars driven by the System itself: HP tracks today's quest
  // completion (vitality), MP tracks progress through the current level.
  const hp = Math.round(questCompletionFraction(state.questProgress, state.level) * 100)
  const mp = Math.round((state.xp / xpNext) * 100)

  return (
    <SystemWindow title="Status" id="sl-status">
      <div className="sl-hero" data-rank={rank}>
        {/* Identity + rank emblem */}
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-5 sm:text-left">
          <div className="sl-emblem-wrap">
            <div className="sl-emblem-frame" aria-hidden>
              <div className="sl-emblem-frame-mid">
                <div className="sl-emblem-frame-inner" />
              </div>
            </div>
            <div className="sl-emblem">
              <div className="sl-emblem-core">
                <span className="sl-rank-letter">{rank}</span>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="sl-display truncate text-3xl tracking-wide sm:text-4xl">
              {playerName}
            </p>
            <div className="sl-meta-row mt-3 justify-center sm:justify-start">
              <span className="sl-meta-item">
                <span className="sl-meta-label">Title</span> {currentTitle ?? 'Player'}
              </span>
              <span className="sl-meta-sep" aria-hidden />
              <span className="sl-meta-item">
                <span className="sl-meta-label">Class</span> {rankTitle(rank)}
              </span>
              <span className="sl-meta-sep" aria-hidden />
              <span className="sl-meta-item">
                <span className="sl-meta-label">Quests Cleared</span>
                <span className="sl-num">{state.questsCompleted}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Level strip: the level numeral owns a tall cell; TOTAL XP and
            NEXT RANK stack compactly beside it. */}
        <div className="sl-level-strip mt-5 border-t border-white/[0.07] pt-5 sm:mt-7">
          <div>
            <p className="sl-label">Level</p>
            <p className="sl-level-num mt-1">{state.level}</p>
          </div>
          <div className="sl-level-side">
            <div className="sl-level-mini">
              <span className="sl-label">Total XP</span>
              <span className="sl-num sl-value sl-level-mini-num">{state.totalXp}</span>
            </div>
            <div className="sl-level-mini">
              <span className="sl-label">Next Rank</span>
              <span className="sl-num sl-value sl-level-mini-num">
                {nextRank ? nextRank.rank : '—'}{' '}
                <span className="sl-level-sub">
                  {nextRank ? `At Lv ${nextRank.minLevel}` : 'Max Rank'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Bars — HP and MP keep a wide gutter so their values can never
            run together into one phrase on narrow screens. */}
        <div className="mt-4 space-y-4">
          <Bar label="XP" value={state.xp} max={xpNext} variant="xp" />
          <div className="grid grid-cols-2 gap-6 sm:gap-4">
            <Bar label="HP" value={hp} max={100} variant="hp" />
            <Bar label="MP" value={mp} max={100} variant="mp" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        className={`mt-5 border-t border-white/[0.07] pt-5 sm:mt-7${pulseStats ? ' sl-stats-pulse' : ''}`}
      >
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <p className="sl-label">Stats</p>
          <div className="flex flex-wrap items-center gap-2">
            {gold !== undefined && (
              <span className="sl-gold-chip" title="Gold — spend it in the System Shop">
                <CoinIcon />
                <span className="sl-num">{gold}</span> Gold
              </span>
            )}
            <span
              className={`sl-points-pill ${state.availablePoints > 0 ? 'live' : 'idle'}`}
              title="Ability points available to spend"
            >
              <span className="sl-plus-lit" aria-hidden>
                +
              </span>
              {state.availablePoints} Ability Points
            </span>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-6">
          {STAT_KEYS.map((key, i) => {
            const Icon = STAT_ICONS[key]
            // One grid, shared column lines: desktop (6-col) row one is
            // 2+2+2, row two is 2+4 — every second-row edge lands on a
            // first-row line. Mobile (2-col): last tile spans the row.
            const span = i === STAT_KEYS.length - 1 ? 'lg:col-span-4' : 'lg:col-span-2'
            const mobileSpan = i === STAT_KEYS.length - 1 ? 'col-span-2' : ''
            return (
              <li key={key} className={`sl-stat-tile ${span} ${mobileSpan}`}>
                <span className="sl-icon-orb">
                  <Icon />
                </span>
                <div className="sl-stat-labels">
                  <span className="sl-stat-abbr">{key}</span>
                  <span className="sl-stat-full">{STAT_LABELS[key]}</span>
                </div>
                <span className="sl-num sl-stat-value">{state.stats[key]}</span>
                <button
                  type="button"
                  className="sl-plus-btn"
                  onClick={() => onAllocate(key)}
                  disabled={state.availablePoints <= 0}
                  aria-label={`Increase ${STAT_LABELS[key]}`}
                  title={
                    state.availablePoints > 0
                      ? `Spend 1 point on ${STAT_LABELS[key]}`
                      : 'No ability points available'
                  }
                >
                  +
                </button>
              </li>
            )
          })}
        </ul>
        {state.availablePoints > 0 ? (
          <p className="mt-3.5 text-[0.72rem] text-[#8fd0f2]">
            [Ability points available. Distribute them wisely, Player.]
          </p>
        ) : (
          <p className="mt-3.5 text-[0.72rem] text-[#8fd0f2]">
            [No ability points available. Gain levels to earn more.]
          </p>
        )}
      </div>

      {/* Titles — earned from real records and sealed in the Ledger. */}
      {titles && titles.length > 0 && (
        <div className="mt-5 border-t border-white/[0.07] pt-5 sm:mt-7">
          <p className="sl-label mb-2 flex items-center gap-2">
            <CrownIcon className="h-4 w-4 text-[#8fd0f2]" /> Titles
          </p>
          <div>
            {titles.map(({ def, earned }) => (
              <div key={def.id} className={`sl-title-row ${earned ? 'earned' : 'locked'}`}>
                {earned ? <CheckIcon /> : <LockIcon />}
                <span className="sl-title-name">{def.name}</span>
                <span className="min-w-0 flex-1 truncate text-right text-[0.7rem] text-[#8fb8d8]">
                  {earned ? 'Earned' : def.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </SystemWindow>
  )
}
