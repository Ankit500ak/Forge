'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LEVEL_UP_POINTS,
  LEVEL_UP_STAT_GAIN,
  QUEST_DEFS,
  QUEST_REWARD_POINTS,
  QUEST_REWARD_XP,
  RECOVERY_QUEST_DEFS,
  RECOVERY_REWARD_POINTS,
  RECOVERY_REWARD_XP,
  STAT_KEYS,
  WEEKLY_QUEST_DEFS,
  WEEKLY_REWARD_POINTS,
  WEEKLY_REWARD_XP,
  defaultSystemState,
  emptyQuestCommitted,
  emptyQuestProgress,
  isQuestComplete,
  isRecoveryComplete,
  isWeeklyComplete,
  questTarget,
  rankForLevel,
  rankTitle,
  weekKeyFor,
  xpForNextLevel,
  type QuestKey,
  type StatKey,
  type SystemNotificationData,
  type SystemState,
} from './types'
import { BOSS_EXERCISE, bossNameForDate, bossTarget } from './rewards'

const STORAGE_KEY = 'forge-system-state-v1'

/** Local calendar date as yyyy-mm-dd. */
export function todayKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function loadState(): SystemState {
  const today = todayKey()
  let state = defaultSystemState(today)

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SystemState>
      if (parsed && parsed.version === 1) {
        state = {
          ...defaultSystemState(today),
          ...parsed,
          stats: { ...state.stats, ...(parsed.stats ?? {}) },
          questProgress: { ...emptyQuestProgress(), ...(parsed.questProgress ?? {}) },
          questHistory: { ...(parsed.questHistory ?? {}) },
          questCommitted: { ...emptyQuestCommitted(), ...(parsed.questCommitted ?? {}) },
          weeklyProgress: { ...emptyQuestProgress(), ...(parsed.weeklyProgress ?? {}) },
          recoveryProgress: { ...emptyQuestProgress(), ...(parsed.recoveryProgress ?? {}) },
          recoveredDates: [...(parsed.recoveredDates ?? [])],
          xpByDay: { ...(parsed.xpByDay ?? {}) },
          lifetimeReps: { ...emptyQuestProgress(), ...(parsed.lifetimeReps ?? {}) },
          bossQuest: parsed.bossQuest ?? null,
          shieldedDates: [...(parsed.shieldedDates ?? [])],
          restedDates: [...(parsed.restedDates ?? [])],
          elixirArmed: parsed.elixirArmed ?? false,
        }
      }
    }
  } catch {
    // Corrupted storage — fall back to a fresh state.
  }

  // Day rollover: a new day means a fresh daily quest. If the previous day
  // ended incomplete and unclaimed, remember it so the UI can show the
  // penalty warning — and offer a recovery quest for that date.
  if (state.questDate !== today) {
    const previousDay = state.questDate
    const previousClaimed = state.lastClaimedDate === previousDay
    if (
      !previousClaimed &&
      !isQuestComplete(state.questProgress, state.level, state.questCommitted)
    ) {
      state.missedDate = previousDay
      if (!state.recoveredDates.includes(previousDay)) {
        state.recoveryForDate = previousDay
        state.recoveryProgress = emptyQuestProgress()
      }
    }
    // Record the finished day in the quest history (streak + calendar).
    state.questHistory = { ...state.questHistory, [previousDay]: previousClaimed }
    state.questDate = today
    state.questProgress = emptyQuestProgress()
    state.questCommitted = emptyQuestCommitted()
  }

  // Week rollover: weekly totals belong to one Monday-anchored week.
  const currentWeek = weekKeyFor(today)
  if (state.weekKey !== currentWeek) {
    state.weekKey = currentWeek
    state.weeklyProgress = emptyQuestProgress()
  }

  // Boss rollover: a gate opened for a past day has closed. An unfinished
  // hunt — even an unclaimed victory — is lost; the key stays consumed.
  if (
    state.bossQuest &&
    state.bossQuest.date !== today &&
    (state.bossQuest.status === 'active' || state.bossQuest.status === 'won')
  ) {
    state.bossQuest = { ...state.bossQuest, status: 'lost' }
  }

  return state
}

interface GrantedRewards {
  level: number
  xp: number
  totalXp: number
  availablePoints: number
  stats: SystemState['stats']
  xpByDay: Record<string, number>
  notifications: SystemNotificationData[]
}

/**
 * Apply an XP + ability-point grant to a state snapshot: level-ups (with
 * their notifications), the per-day XP record, and — when the grant
 * crosses a Hunter Rank threshold — the rank-up ceremony notification.
 * Pure: returns the new fields plus the notifications to queue.
 */
function grantRewards(
  s: SystemState,
  xpGain: number,
  pointsGain: number,
  firstNotification: SystemNotificationData,
): GrantedRewards {
  let { level, xp } = s
  let availablePoints = s.availablePoints + pointsGain
  const stats = { ...s.stats }
  xp += xpGain
  const totalXp = s.totalXp + xpGain
  const xpByDay = { ...s.xpByDay, [s.questDate]: (s.xpByDay[s.questDate] ?? 0) + xpGain }

  const notifications: SystemNotificationData[] = [firstNotification]
  const rankBefore = rankForLevel(s.level)

  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level)
    const from = level
    level += 1
    availablePoints += LEVEL_UP_POINTS
    for (const key of STAT_KEYS) stats[key] += LEVEL_UP_STAT_GAIN
    notifications.push({
      kind: 'levelup',
      title: 'LEVEL UP!',
      lines: [
        `You have reached Level ${level}.`,
        `All stats +${LEVEL_UP_STAT_GAIN}`,
        `+${LEVEL_UP_POINTS} Ability Points`,
      ],
      levelFrom: from,
      levelTo: level,
    })
  }

  const rankAfter = rankForLevel(level)
  if (rankAfter !== rankBefore) {
    notifications.push({
      kind: 'rankup',
      title: 'RANK UP',
      lines: [
        `Your Hunter Rank has risen to ${rankAfter}.`,
        `New title: ${rankTitle(rankAfter)}.`,
        'The System recognises your growth, Player.',
      ],
      rankFrom: rankBefore,
      rankTo: rankAfter,
    })
  }

  return { level, xp, totalXp, availablePoints, stats, xpByDay, notifications }
}

/**
 * Feed an applied progress delta into today's Boss Quest, when one is
 * hunting this exercise. Only forward progress counts — stepping a
 * quest entry back down never drains the boss. Reaching the target
 * wins the hunt (the victory itself is claimed separately).
 */
function feedBossQuest(
  s: SystemState,
  key: QuestKey,
  appliedDelta: number,
): SystemState['bossQuest'] {
  const boss = s.bossQuest
  if (!boss || boss.status !== 'active') return s.bossQuest
  if (boss.date !== s.questDate || boss.exercise !== key || appliedDelta <= 0) {
    return s.bossQuest
  }
  const progress = Math.min(boss.target, boss.progress + appliedDelta)
  return { ...boss, progress, status: progress >= boss.target ? 'won' : 'active' }
}

/** Fold a daily-progress delta into the weekly totals (clamped). */
function addWeeklyProgress(
  s: SystemState,
  key: QuestKey,
  appliedDelta: number,
): SystemState['weeklyProgress'] {
  if (appliedDelta === 0) return s.weeklyProgress
  const def = WEEKLY_QUEST_DEFS.find((d) => d.key === key)
  if (!def) return s.weeklyProgress
  const target = questTarget(def, s.level)
  const factor = 10 ** def.decimals
  const next = Math.round((s.weeklyProgress[key] + appliedDelta) * factor) / factor
  const clamped = Math.min(Math.max(next, 0), target)
  if (clamped === s.weeklyProgress[key]) return s.weeklyProgress
  return { ...s.weeklyProgress, [key]: clamped }
}

export interface UseSystemState {
  /** Null until the state has been hydrated from localStorage. */
  state: SystemState | null
  /** The notification currently on screen, if any. */
  notification: SystemNotificationData | null
  dismissNotification: () => void
  addProgress: (key: QuestKey, delta: number) => void
  completeQuestTask: (key: QuestKey) => void
  allocateStat: (key: StatKey) => void
  claimReward: () => void
  dismissMissedWarning: () => void
  /** Open today's Boss Quest gate (the key itself is spent via the ledger). */
  openBossQuest: () => void
  /** Record a won Boss Quest as claimed (gold/shadow go through the ledger). */
  claimBossVictory: () => void
  /** A Streak Shield protected a missed date: restore its record, no penalty. */
  applyShieldProtection: (date: string) => void
  /** A Rest Pass marks today as rested: record kept, day locked, no penalty. */
  applyRestDay: () => void
  /** Arm a used Double XP Elixir for the next daily claim. */
  armElixir: () => void
  claimWeeklyReward: () => void
  addRecoveryProgress: (key: QuestKey, delta: number) => void
  completeRecoveryTask: (key: QuestKey) => void
  claimRecovery: () => void
}

export function useSystemState(): UseSystemState {
  const [state, setState] = useState<SystemState | null>(null)
  const [queue, setQueue] = useState<SystemNotificationData[]>([])
  const welcomedRef = useRef(false)

  useEffect(() => {
    const loaded = loadState()
    setState(loaded)
    if (!loaded.welcomed && !welcomedRef.current) {
      welcomedRef.current = true
      setQueue([
        {
          kind: 'welcome',
          title: 'NOTIFICATION',
          lines: [
            'You have acquired the qualifications to be a Player.',
            'Welcome, Player.',
          ],
        },
      ])
    }
  }, [])

  useEffect(() => {
    if (state) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Storage full/blocked — the System keeps running in memory.
      }
    }
  }, [state])

  const dismissNotification = useCallback(() => {
    setQueue((prev) => {
      const [current, ...rest] = prev
      if (current?.kind === 'welcome') {
        setState((s) => (s ? { ...s, welcomed: true } : s))
      }
      return rest
    })
  }, [])

  const addProgress = useCallback((key: QuestKey, delta: number) => {
    setState((s) => {
      if (!s || s.lastClaimedDate === s.questDate) return s
      const def = QUEST_DEFS.find((d) => d.key === key)
      if (!def) return s
      const target = questTarget(def, s.level)
      const factor = 10 ** def.decimals
      const next = Math.round((s.questProgress[key] + delta) * factor) / factor
      const clamped = Math.min(Math.max(next, 0), target)
      const appliedDelta = clamped - s.questProgress[key]
      // Dropping back below the target un-commits the task.
      const questCommitted =
        clamped < target && s.questCommitted[key]
          ? { ...s.questCommitted, [key]: false }
          : s.questCommitted
      return {
        ...s,
        questProgress: { ...s.questProgress, [key]: clamped },
        questCommitted,
        weeklyProgress: addWeeklyProgress(s, key, appliedDelta),
        lifetimeReps: {
          ...s.lifetimeReps,
          [key]: s.lifetimeReps[key] + Math.max(0, appliedDelta),
        },
        // The boss is fed the *requested* delta, not the daily-clamped
        // one: a boss target (100+) sits far above the daily quest cap,
        // so reps beyond the daily target must still reach the hunt.
        bossQuest: feedBossQuest(s, key, delta),
      }
    })
  }, [])

  const completeQuestTask = useCallback((key: QuestKey) => {
    setState((s) => {
      if (!s || s.lastClaimedDate === s.questDate) return s
      const def = QUEST_DEFS.find((d) => d.key === key)
      if (!def) return s
      const target = questTarget(def, s.level)
      const appliedDelta = target - s.questProgress[key]
      return {
        ...s,
        questProgress: { ...s.questProgress, [key]: target },
        questCommitted: { ...s.questCommitted, [key]: true },
        weeklyProgress: addWeeklyProgress(s, key, appliedDelta),
        lifetimeReps: {
          ...s.lifetimeReps,
          [key]: s.lifetimeReps[key] + Math.max(0, appliedDelta),
        },
        bossQuest: feedBossQuest(s, key, appliedDelta),
      }
    })
  }, [])

  const allocateStat = useCallback((key: StatKey) => {
    setState((s) => {
      if (!s || s.availablePoints <= 0) return s
      return {
        ...s,
        availablePoints: s.availablePoints - 1,
        stats: { ...s.stats, [key]: s.stats[key] + 1 },
      }
    })
  }, [])

  const claimReward = useCallback(() => {
    setState((s) => {
      if (!s) return s
      if (s.lastClaimedDate === s.questDate) return s
      if (!isQuestComplete(s.questProgress, s.level, s.questCommitted)) return s

      // A Double XP Elixir, once used, doubles this claim's XP only.
      const xpReward = s.elixirArmed ? QUEST_REWARD_XP * 2 : QUEST_REWARD_XP
      const granted = grantRewards(s, xpReward, QUEST_REWARD_POINTS, {
        kind: 'reward',
        title: 'QUEST COMPLETE',
        lines: [
          'Daily Quest rewards received.',
          `+${xpReward} XP`,
          `+${QUEST_REWARD_POINTS} Ability Points`,
          ...(s.elixirArmed ? ['Double XP Elixir consumed.'] : []),
        ],
      })
      setQueue((prev) => [...prev, ...granted.notifications])

      return {
        ...s,
        level: granted.level,
        xp: granted.xp,
        totalXp: granted.totalXp,
        availablePoints: granted.availablePoints,
        stats: granted.stats,
        xpByDay: granted.xpByDay,
        lastClaimedDate: s.questDate,
        questsCompleted: s.questsCompleted + 1,
        questHistory: { ...s.questHistory, [s.questDate]: true },
        elixirArmed: false,
      }
    })
  }, [])

  const claimWeeklyReward = useCallback(() => {
    setState((s) => {
      if (!s) return s
      if (s.weeklyClaimedKey === s.weekKey) return s
      if (!isWeeklyComplete(s)) return s

      const granted = grantRewards(s, WEEKLY_REWARD_XP, WEEKLY_REWARD_POINTS, {
        kind: 'weekly',
        title: 'WEEKLY QUEST COMPLETE',
        lines: [
          'Weekly Quest rewards received.',
          `+${WEEKLY_REWARD_XP} XP`,
          `+${WEEKLY_REWARD_POINTS} Ability Points`,
        ],
      })
      setQueue((prev) => [...prev, ...granted.notifications])

      return {
        ...s,
        level: granted.level,
        xp: granted.xp,
        totalXp: granted.totalXp,
        availablePoints: granted.availablePoints,
        stats: granted.stats,
        xpByDay: granted.xpByDay,
        weeklyClaimedKey: s.weekKey,
      }
    })
  }, [])

  const addRecoveryProgress = useCallback((key: QuestKey, delta: number) => {
    setState((s) => {
      if (!s || !s.recoveryForDate) return s
      const def = RECOVERY_QUEST_DEFS.find((d) => d.key === key)
      if (!def) return s
      const next = Math.min(Math.max(s.recoveryProgress[key] + delta, 0), def.baseTarget)
      return { ...s, recoveryProgress: { ...s.recoveryProgress, [key]: next } }
    })
  }, [])

  const completeRecoveryTask = useCallback((key: QuestKey) => {
    setState((s) => {
      if (!s || !s.recoveryForDate) return s
      const def = RECOVERY_QUEST_DEFS.find((d) => d.key === key)
      if (!def) return s
      return {
        ...s,
        recoveryProgress: { ...s.recoveryProgress, [key]: def.baseTarget },
      }
    })
  }, [])

  const claimRecovery = useCallback(() => {
    setState((s) => {
      if (!s || !s.recoveryForDate) return s
      if (s.recoveredDates.includes(s.recoveryForDate)) return s
      if (!isRecoveryComplete(s.recoveryProgress)) return s

      const restoredDate = s.recoveryForDate
      const granted = grantRewards(s, RECOVERY_REWARD_XP, RECOVERY_REWARD_POINTS, {
        kind: 'recovery',
        title: 'RECORD RESTORED',
        lines: [
          `Recovery Quest complete. The record for ${restoredDate} has been restored.`,
          `+${RECOVERY_REWARD_XP} XP`,
          `+${RECOVERY_REWARD_POINTS} Ability Point`,
        ],
      })
      setQueue((prev) => [...prev, ...granted.notifications])

      return {
        ...s,
        level: granted.level,
        xp: granted.xp,
        totalXp: granted.totalXp,
        availablePoints: granted.availablePoints,
        stats: granted.stats,
        xpByDay: granted.xpByDay,
        questHistory: { ...s.questHistory, [restoredDate]: true },
        recoveredDates: [...s.recoveredDates, restoredDate],
        missedDate: s.missedDate === restoredDate ? null : s.missedDate,
        recoveryForDate: null,
        recoveryProgress: emptyQuestProgress(),
      }
    })
  }, [])

  const openBossQuest = useCallback(() => {
    setState((s) => {
      if (!s) return s
      // One gate per day, and the day's training path must still be open
      // (boss progress flows through addProgress, which locks at claim).
      if (s.bossQuest && s.bossQuest.date === s.questDate) return s
      if (s.lastClaimedDate === s.questDate) return s
      return {
        ...s,
        bossQuest: {
          date: s.questDate,
          bossName: bossNameForDate(s.questDate),
          exercise: BOSS_EXERCISE,
          target: bossTarget(s.level),
          progress: 0,
          status: 'active' as const,
        },
      }
    })
  }, [])

  const claimBossVictory = useCallback(() => {
    setState((s) => {
      if (!s || !s.bossQuest) return s
      if (s.bossQuest.status !== 'won' || s.bossQuest.date !== s.questDate) return s
      return { ...s, bossQuest: { ...s.bossQuest, status: 'claimed' as const } }
    })
  }, [])

  const applyShieldProtection = useCallback((date: string) => {
    setState((s) => {
      if (!s) return s
      if (s.shieldedDates.includes(date)) return s
      return {
        ...s,
        questHistory: { ...s.questHistory, [date]: true },
        shieldedDates: [...s.shieldedDates, date],
        missedDate: s.missedDate === date ? null : s.missedDate,
        recoveryForDate: s.recoveryForDate === date ? null : s.recoveryForDate,
        recoveryProgress:
          s.recoveryForDate === date ? emptyQuestProgress() : s.recoveryProgress,
      }
    })
  }, [])

  const applyRestDay = useCallback(() => {
    setState((s) => {
      if (!s) return s
      if (s.lastClaimedDate === s.questDate) return s
      if (s.restedDates.includes(s.questDate)) return s
      return {
        ...s,
        questHistory: { ...s.questHistory, [s.questDate]: true },
        restedDates: [...s.restedDates, s.questDate],
        // Lock the day like a claim does: no progress, no reward claim.
        lastClaimedDate: s.questDate,
      }
    })
  }, [])

  const armElixir = useCallback(() => {
    setState((s) => (s ? { ...s, elixirArmed: true } : s))
  }, [])

  const dismissMissedWarning = useCallback(() => {
    setState((s) => (s ? { ...s, missedDate: null } : s))
  }, [])

  return {
    state,
    notification: queue[0] ?? null,
    dismissNotification,
    addProgress,
    completeQuestTask,
    allocateStat,
    claimReward,
    dismissMissedWarning,
    openBossQuest,
    claimBossVictory,
    applyShieldProtection,
    applyRestDay,
    armElixir,
    claimWeeklyReward,
    addRecoveryProgress,
    completeRecoveryTask,
    claimRecovery,
  }
}
