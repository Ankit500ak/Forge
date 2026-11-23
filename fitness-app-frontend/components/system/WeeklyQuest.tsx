'use client'

import {
  WEEKLY_DAYS_TARGET,
  WEEKLY_QUEST_DEFS,
  WEEKLY_REWARD_POINTS,
  WEEKLY_REWARD_XP,
  daysClearedThisWeek,
  isWeeklyComplete,
  questTarget,
  type SystemState,
} from '@/lib/system/types'
import { WEEKLY_CLAIM_GOLD } from '@/lib/system/rewards'
import { SystemWindow } from './SystemWindow'
import { CheckIcon, LockIcon } from './icons'

interface WeeklyQuestProps {
  state: SystemState
  onClaimWeekly: () => void
}

function formatAmount(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
}

/**
 * Weekly Quest panel: week-sized exercise totals plus a cleared-days
 * requirement. Progress accrues automatically from daily training —
 * this panel is where the week's effort is read and rewarded.
 */
export function WeeklyQuest({ state, onClaimWeekly }: WeeklyQuestProps) {
  const claimed = state.weeklyClaimedKey === state.weekKey
  const complete = isWeeklyComplete(state)
  const daysCleared = daysClearedThisWeek(state)
  const totalsMet = WEEKLY_QUEST_DEFS.filter(
    (def) => state.weeklyProgress[def.key] >= questTarget(def, state.level),
  ).length

  const stripText = claimed
    ? 'Weekly Quest cleared. Reward claimed.'
    : complete
      ? 'Weekly Quest cleared. Reward available.'
      : `Weekly Quest: ${daysCleared} of ${WEEKLY_DAYS_TARGET} days cleared.`

  return (
    <SystemWindow title="Weekly Quest" style={{ animationDelay: '0.15s' }} bare>
      <p className="sl-strip" role="note">
        <span className="sl-strip-bracket" aria-hidden>
          [
        </span>
        <span className="sl-strip-text">{stripText}</span>
        <span className="sl-strip-bracket" aria-hidden>
          ]
        </span>
      </p>

      <ul className="mt-6 space-y-3">
        {WEEKLY_QUEST_DEFS.map((def) => {
          const target = questTarget(def, state.level)
          const progress = state.weeklyProgress[def.key]
          const done = progress >= target
          const pct = Math.min(100, (progress / target) * 100)
          return (
            <li key={def.key} className="sl-quest-card">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 flex-1 truncate font-bold text-white">{def.label}</p>
                <p className="sl-num flex-none text-[0.85rem] font-bold text-[#a9cdec]">
                  {formatAmount(progress, def.decimals)} / {formatAmount(target, def.decimals)}{' '}
                  {def.unit}
                  {done && (
                    <span className="sl-check-badge ml-2 align-middle">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                  )}
                </p>
              </div>
              <div className="sl-bar mt-2.5" style={{ height: 7 }}>
                <div
                  className={`sl-bar-fill ${done ? 'quest-done' : 'quest'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
        <li className="sl-quest-card">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 flex-1 truncate font-bold text-white">Daily quests cleared</p>
            <p className="sl-num flex-none text-[0.85rem] font-bold text-[#a9cdec]">
              {daysCleared} / {WEEKLY_DAYS_TARGET} days
              {daysCleared >= WEEKLY_DAYS_TARGET && (
                <span className="sl-check-badge ml-2 align-middle">
                  <CheckIcon className="h-3 w-3" />
                </span>
              )}
            </p>
          </div>
          <div className="sl-bar mt-2.5" style={{ height: 7 }}>
            <div
              className={`sl-bar-fill ${daysCleared >= WEEKLY_DAYS_TARGET ? 'quest-done' : 'quest'}`}
              style={{
                width: `${Math.min(100, (daysCleared / WEEKLY_DAYS_TARGET) * 100)}%`,
              }}
            />
          </div>
        </li>
      </ul>

      <p className="mt-4 text-center text-[0.72rem] leading-relaxed text-[#8fd0f2]">
        [Weekly totals grow with every daily quest entry. The week resets on Monday.]
      </p>

      <div className="mt-5 text-center">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span className="sl-chip">
            <span className="sl-chip-label">Reward:</span>
            <span className="sl-num">
              +{WEEKLY_REWARD_XP} XP · +{WEEKLY_REWARD_POINTS} Ability Points · +
              {WEEKLY_CLAIM_GOLD} Gold · +1 Dungeon Key
            </span>
          </span>
        </div>
        {claimed ? (
          <p className="sl-value inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.28em]">
            <span className="sl-check-badge">
              <CheckIcon className="h-3 w-3" />
            </span>
            Weekly Reward Claimed
          </p>
        ) : (
          <>
            <button
              type="button"
              className="sl-btn primary sl-claim"
              onClick={onClaimWeekly}
              disabled={!complete}
            >
              {!complete && <LockIcon className="h-4 w-4" aria-hidden />}
              Claim Weekly Reward
            </button>
            {!complete && (
              <p className="sl-claim-note">
                {totalsMet} of {WEEKLY_QUEST_DEFS.length} totals · {daysCleared} of{' '}
                {WEEKLY_DAYS_TARGET} days cleared
              </p>
            )}
          </>
        )}
      </div>
    </SystemWindow>
  )
}
