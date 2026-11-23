'use client'

import type { ComponentType } from 'react'
import {
  RECOVERY_QUEST_DEFS,
  RECOVERY_REWARD_POINTS,
  RECOVERY_REWARD_XP,
  isRecoveryComplete,
  type QuestKey,
  type SystemState,
} from '@/lib/system/types'
import { SystemWindow } from './SystemWindow'
import { CheckIcon, DumbbellIcon, SquatIcon } from './icons'

const RECOVERY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  pushups: DumbbellIcon,
  squats: SquatIcon,
}

interface RecoveryQuestProps {
  state: SystemState
  onAddProgress: (key: QuestKey, delta: number) => void
  onCompleteTask: (key: QuestKey) => void
  onClaimRecovery: () => void
}

/**
 * Penalty recovery quest: after a missed day, the System offers extra
 * work. Completing it restores the missed day's record — the calendar
 * keeps the day marked as recovered, and the streak counts it again.
 * Rendered only while a recovery is outstanding.
 */
export function RecoveryQuest({
  state,
  onAddProgress,
  onCompleteTask,
  onClaimRecovery,
}: RecoveryQuestProps) {
  if (!state.recoveryForDate) return null
  const complete = isRecoveryComplete(state.recoveryProgress)

  return (
    <SystemWindow title="Penalty Zone" style={{ animationDelay: '0.13s' }} bare>
      <p className="sl-strip" role="note">
        <span className="sl-strip-bracket" aria-hidden>
          [
        </span>
        <span className="sl-strip-text">Penalty Zone: a recovery quest is available.</span>
        <span className="sl-strip-bracket" aria-hidden>
          ]
        </span>
      </p>

      <p className="mx-auto mt-4 max-w-md text-center text-[0.8rem] leading-relaxed text-[#9fc6e8]">
        The daily quest for {state.recoveryForDate} was left incomplete. Finish this recovery
        quest and the System will restore that day&rsquo;s record.
      </p>

      <ul className="mt-5 space-y-3">
        {RECOVERY_QUEST_DEFS.map((def) => {
          const target = def.baseTarget
          const progress = state.recoveryProgress[def.key]
          const done = progress >= target
          const pct = Math.min(100, (progress / target) * 100)
          const Icon = RECOVERY_ICONS[def.key]
          if (done) {
            return (
              <li key={def.key} className="sl-quest-card done">
                <div className="sl-quest-done-row">
                  {Icon && (
                    <span className="sl-quest-icon small">
                      <Icon />
                    </span>
                  )}
                  <p className="min-w-0 flex-1 truncate font-bold text-white">{def.label}</p>
                  <span className="sl-num flex-none text-[0.78rem] font-bold text-[#a9cdec]">
                    {progress} / {target} {def.unit}
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
                {Icon && (
                  <span className="sl-quest-icon">
                    <Icon />
                  </span>
                )}
                <p className="min-w-0 flex-1 font-bold text-white">{def.label}</p>
                <div className="flex-none text-right">
                  <p className="sl-num text-[1.55rem] font-extrabold leading-none text-white">
                    {progress}
                  </p>
                  <p className="sl-num mt-1 text-[0.7rem] font-medium tracking-wider text-[#a9cdec]">
                    / {target} {def.unit}
                  </p>
                </div>
              </div>
              <div className="sl-bar mt-3" style={{ height: 7 }}>
                <div className="sl-bar-fill quest" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  className="sl-round-btn"
                  onClick={() => onAddProgress(def.key, -def.step)}
                  disabled={progress <= 0}
                  aria-label={`Decrease ${def.label}`}
                >
                  −
                </button>
                <button
                  type="button"
                  className="sl-round-btn"
                  onClick={() => onAddProgress(def.key, def.step)}
                  aria-label={`Increase ${def.label}`}
                >
                  +
                </button>
                <button
                  type="button"
                  className="sl-btn ghost"
                  onClick={() => onAddProgress(def.key, def.quickAdd)}
                >
                  +{def.quickAdd}
                </button>
                <button
                  type="button"
                  className={`sl-btn commit ml-auto${progress >= target ? ' ready' : ''}`}
                  onClick={() => onCompleteTask(def.key)}
                >
                  Complete
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 text-center">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span className="sl-chip">
            <span className="sl-chip-label">Reward:</span>
            <span className="sl-num">
              Record restored · +{RECOVERY_REWARD_XP} XP · +{RECOVERY_REWARD_POINTS} Ability
              Point
            </span>
          </span>
        </div>
        <button
          type="button"
          className="sl-btn primary sl-claim"
          onClick={onClaimRecovery}
          disabled={!complete}
        >
          Restore Record
        </button>
        {!complete && (
          <p className="sl-claim-note">Complete both recovery tasks to restore the record</p>
        )}
      </div>
    </SystemWindow>
  )
}
