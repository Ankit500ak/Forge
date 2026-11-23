'use client'

import type { ComponentType } from 'react'
import {
  QUEST_DEFS,
  QUEST_REWARD_POINTS,
  QUEST_REWARD_XP,
  isQuestComplete,
  questTarget,
  type QuestKey,
  type SystemState,
} from '@/lib/system/types'
import { DAILY_CLAIM_GOLD } from '@/lib/system/rewards'
import { SystemWindow } from './SystemWindow'
import { BoltIcon, CheckIcon, CoreIcon, DumbbellIcon, LockIcon, SquatIcon } from './icons'

const QUEST_ICONS: Record<QuestKey, ComponentType<{ className?: string }>> = {
  pushups: DumbbellIcon,
  situps: CoreIcon,
  squats: SquatIcon,
  run: BoltIcon,
}

interface DailyQuestProps {
  state: SystemState
  onAddProgress: (key: QuestKey, delta: number) => void
  onCompleteTask: (key: QuestKey) => void
  onClaimReward: () => void
  onDismissMissedWarning: () => void
}

function formatAmount(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))
}

/** The Daily Quest panel: "Train to become the strongest." */
export function DailyQuest({
  state,
  onAddProgress,
  onCompleteTask,
  onClaimReward,
  onDismissMissedWarning,
}: DailyQuestProps) {
  const claimedToday = state.lastClaimedDate === state.questDate
  const allComplete = isQuestComplete(state.questProgress, state.level, state.questCommitted)
  const doneCount = QUEST_DEFS.filter(
    (def) =>
      state.questCommitted[def.key] &&
      state.questProgress[def.key] >= questTarget(def, state.level),
  ).length
  const anyProgress = QUEST_DEFS.some((def) => state.questProgress[def.key] > 0)

  // The System's voice reacts to the quest state. Copy stays short —
  // one line, brackets hugging the text.
  const stripText = claimedToday
    ? 'Daily Quest cleared. Reward claimed.'
    : allComplete
      ? 'Daily Quest cleared. Reward available.'
      : anyProgress
        ? `Quest in progress: ${doneCount} of ${QUEST_DEFS.length} complete.`
        : 'A new Daily Quest has arrived.'

  return (
    <SystemWindow title="Quest" style={{ animationDelay: '0.12s' }} bare>
      {/* The System speaks first: a bracketed notification strip. The
          brackets are pinned to the strip edges so they can never split
          across lines, whatever the text does. */}
      <p className="sl-strip" role="note">
        <span className="sl-strip-bracket" aria-hidden>
          [
        </span>
        <span className="sl-strip-text">{stripText}</span>
        <span className="sl-strip-bracket" aria-hidden>
          ]
        </span>
      </p>
      <div className="mt-5 text-center">
        <h3 className="sl-display text-[1.65rem] leading-tight tracking-wide sm:text-4xl">
          Train to become
          <br className="sm:hidden" /> the strongest
        </h3>
        <p className="mx-auto mt-2.5 max-w-sm text-[0.8rem] leading-relaxed text-[#9fc6e8]">
          {claimedToday
            ? 'Reward claimed. Return tomorrow for a new quest.'
            : allComplete
              ? 'Every task is complete. Claim your reward, Player.'
              : 'Complete every task before the day ends.'}
        </p>
      </div>

      {state.missedDate && (
        <div className="sl-warning danger mt-5 flex items-start justify-between gap-3" role="alert">
          <p>
            [Warning: the daily quest for {state.missedDate} was not completed. The penalty has
            been recorded by the System. Do not fail again, Player.]
          </p>
          <button
            type="button"
            onClick={onDismissMissedWarning}
            className="sl-dismiss text-[#fecaca]"
            aria-label="Dismiss penalty warning"
          >
            ✕
          </button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {QUEST_DEFS.map((def) => {
          const target = questTarget(def, state.level)
          const progress = state.questProgress[def.key]
          const atTarget = progress >= target
          const done = atTarget && state.questCommitted[def.key]
          const pct = Math.min(100, (progress / target) * 100)
          const Icon = QUEST_ICONS[def.key]
          if (done) {
            // A finished task collapses to one compact row: a single
            // indicator (check + bright edge) carries the state, so the
            // claim button is never pushed far down the page.
            return (
              <li key={def.key} className="sl-quest-card done">
                <div className="sl-quest-done-row">
                  <span className="sl-quest-icon small">
                    <Icon />
                  </span>
                  <p className="min-w-0 flex-1 truncate font-bold text-white">{def.label}</p>
                  <span className="sl-num flex-none text-[0.78rem] font-bold text-[#a9cdec]">
                    {formatAmount(progress, def.decimals)} / {formatAmount(target, def.decimals)}{' '}
                    {def.unit}
                  </span>
                  <span className="sl-check-badge">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                </div>
              </li>
            )
          }
          return (
            <li key={def.key} className="sl-quest-card">
              <div className="flex items-center gap-3.5">
                <span className="sl-quest-icon">
                  <Icon />
                </span>

                <p className="min-w-0 flex-1 font-bold text-white">{def.label}</p>

                <div className="flex-none text-right">
                  <p className="sl-num text-[1.55rem] font-extrabold leading-none text-white">
                    {formatAmount(progress, def.decimals)}
                  </p>
                  <p className="sl-num mt-1 text-[0.7rem] font-medium tracking-wider text-[#a9cdec]">
                    / {formatAmount(target, def.decimals)} {def.unit}
                  </p>
                </div>
              </div>

              {/* The bar is the single progress representation — full
                  width, so every card's bar shares the same right edge. */}
              <div className="sl-bar mt-3" style={{ height: 7 }}>
                <div className="sl-bar-fill quest" style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  className="sl-round-btn"
                  onClick={() => onAddProgress(def.key, -def.step)}
                  disabled={claimedToday || progress <= 0}
                  aria-label={`Decrease ${def.label}`}
                >
                  −
                </button>
                <button
                  type="button"
                  className="sl-round-btn"
                  onClick={() => onAddProgress(def.key, def.step)}
                  disabled={claimedToday}
                  aria-label={`Increase ${def.label}`}
                >
                  +
                </button>
                <button
                  type="button"
                  className="sl-btn ghost"
                  onClick={() => onAddProgress(def.key, def.quickAdd)}
                  disabled={claimedToday}
                >
                  +{formatAmount(def.quickAdd, def.decimals)}
                </button>
                <button
                  type="button"
                  className={`sl-btn commit ml-auto${atTarget ? ' ready' : ''}`}
                  onClick={() => onCompleteTask(def.key)}
                  disabled={claimedToday}
                >
                  Complete
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {!allComplete && !claimedToday && (
        <div className="sl-warning mt-5 text-center" role="note">
          [Warning: if the daily quest remains incomplete, a penalty will be imposed upon the
          Player.]
        </div>
      )}

      <div className="mt-6 text-center">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span className="sl-chip">
            <span className="sl-chip-label">Reward:</span>
            <span className="sl-num">
              +{QUEST_REWARD_XP} XP · +{QUEST_REWARD_POINTS} Ability Points · +
              {DAILY_CLAIM_GOLD} Gold
            </span>
          </span>
        </div>
        {claimedToday ? (
          <p className="sl-value inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.28em]">
            <span className="sl-check-badge">
              <CheckIcon className="h-3 w-3" />
            </span>
            Reward Claimed — Return Tomorrow
          </p>
        ) : (
          <>
            <button
              type="button"
              className="sl-btn primary sl-claim"
              onClick={onClaimReward}
              disabled={!allComplete}
            >
              {!allComplete && <LockIcon className="h-4 w-4" aria-hidden />}
              Claim Reward
            </button>
            {!allComplete && (
              <p className="sl-claim-note">
                {doneCount} of {QUEST_DEFS.length} tasks complete
              </p>
            )}
          </>
        )}
      </div>
    </SystemWindow>
  )
}
