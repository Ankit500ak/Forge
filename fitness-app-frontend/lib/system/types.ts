// Solo Leveling-inspired "System" layer for Forge.
// Self-contained game state: types, balance constants and pure helpers.
// All state is persisted locally (see use-system-state.ts) — no backend.

export type StatKey = 'STR' | 'AGI' | 'VIT' | 'END' | 'PER'

export type PlayerStats = Record<StatKey, number>

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

export type QuestKey = 'pushups' | 'situps' | 'squats' | 'run'

export interface QuestDef {
  key: QuestKey
  label: string
  unit: string
  /** Target at level 1. */
  baseTarget: number
  /** Extra target added per level above 1. */
  perLevel: number
  /** Amount changed by the - / + buttons. */
  step: number
  /** Amount added by the quick-add button. */
  quickAdd: number
  /** Decimal places used when displaying progress/target. */
  decimals: number
}

export const STAT_KEYS: StatKey[] = ['STR', 'AGI', 'VIT', 'END', 'PER']

export const STAT_LABELS: Record<StatKey, string> = {
  STR: 'Strength',
  AGI: 'Agility',
  VIT: 'Vitality',
  END: 'Endurance',
  PER: 'Perception',
}

export const QUEST_DEFS: QuestDef[] = [
  { key: 'pushups', label: 'Push-ups', unit: 'reps', baseTarget: 20, perLevel: 2, step: 1, quickAdd: 10, decimals: 0 },
  { key: 'situps', label: 'Sit-ups', unit: 'reps', baseTarget: 20, perLevel: 2, step: 1, quickAdd: 10, decimals: 0 },
  { key: 'squats', label: 'Squats', unit: 'reps', baseTarget: 30, perLevel: 3, step: 1, quickAdd: 10, decimals: 0 },
  { key: 'run', label: 'Run', unit: 'km', baseTarget: 1, perLevel: 0.2, step: 0.1, quickAdd: 0.5, decimals: 1 },
]

/** XP required to advance from `level` to `level + 1`. */
export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 50
}

/** Daily quest completion reward. */
export const QUEST_REWARD_XP = 60
export const QUEST_REWARD_POINTS = 3

/** Weekly quest targets (same exercises, week-sized totals). */
export const WEEKLY_QUEST_DEFS: QuestDef[] = [
  { key: 'pushups', label: 'Push-ups', unit: 'reps', baseTarget: 100, perLevel: 10, step: 5, quickAdd: 25, decimals: 0 },
  { key: 'situps', label: 'Sit-ups', unit: 'reps', baseTarget: 100, perLevel: 10, step: 5, quickAdd: 25, decimals: 0 },
  { key: 'squats', label: 'Squats', unit: 'reps', baseTarget: 150, perLevel: 15, step: 5, quickAdd: 25, decimals: 0 },
  { key: 'run', label: 'Run', unit: 'km', baseTarget: 5, perLevel: 0.5, step: 0.5, quickAdd: 1, decimals: 1 },
]

/** Daily quests that must be cleared inside the week for the weekly quest. */
export const WEEKLY_DAYS_TARGET = 4
/** Weekly quest completion reward. */
export const WEEKLY_REWARD_XP = 150
export const WEEKLY_REWARD_POINTS = 5

/**
 * Penalty recovery quest: fixed extra work offered after a missed day.
 * Completing it restores the missed day's record (and the streak).
 */
export const RECOVERY_QUEST_DEFS: QuestDef[] = [
  { key: 'pushups', label: 'Push-ups', unit: 'reps', baseTarget: 20, perLevel: 0, step: 1, quickAdd: 10, decimals: 0 },
  { key: 'squats', label: 'Squats', unit: 'reps', baseTarget: 20, perLevel: 0, step: 1, quickAdd: 10, decimals: 0 },
]
export const RECOVERY_REWARD_XP = 30
export const RECOVERY_REWARD_POINTS = 1
/** Ability points granted per level gained. */
export const LEVEL_UP_POINTS = 3
/** Every stat also grows by this much on level up. */
export const LEVEL_UP_STAT_GAIN = 1

const RANK_THRESHOLDS: { rank: HunterRank; minLevel: number; title: string }[] = [
  { rank: 'S', minLevel: 50, title: 'Monarch in the Making' },
  { rank: 'A', minLevel: 40, title: 'Elite Hunter' },
  { rank: 'B', minLevel: 30, title: 'Veteran Hunter' },
  { rank: 'C', minLevel: 20, title: 'Seasoned Hunter' },
  { rank: 'D', minLevel: 10, title: 'Rising Hunter' },
  { rank: 'E', minLevel: 1, title: 'Novice Hunter' },
]

export function rankForLevel(level: number): HunterRank {
  for (const entry of RANK_THRESHOLDS) {
    if (level >= entry.minLevel) return entry.rank
  }
  return 'E'
}

export function rankTitle(rank: HunterRank): string {
  return RANK_THRESHOLDS.find((entry) => entry.rank === rank)?.title ?? 'Novice Hunter'
}

/** The next rank above the player's current one, and the level it unlocks
 *  at — or null when the player already holds the highest rank (S). */
export function nextRankForLevel(level: number): { rank: HunterRank; minLevel: number } | null {
  const current = rankForLevel(level)
  const idx = RANK_THRESHOLDS.findIndex((entry) => entry.rank === current)
  if (idx <= 0) return null
  const next = RANK_THRESHOLDS[idx - 1]
  return { rank: next.rank, minLevel: next.minLevel }
}

/** Target for a quest at the given player level. */
export function questTarget(def: QuestDef, level: number): number {
  const raw = def.baseTarget + def.perLevel * (level - 1)
  const factor = 10 ** def.decimals
  return Math.round(raw * factor) / factor
}

export type QuestProgress = Record<QuestKey, number>

export function emptyQuestProgress(): QuestProgress {
  return { pushups: 0, situps: 0, squats: 0, run: 0 }
}

export type QuestCommitted = Record<QuestKey, boolean>

export function emptyQuestCommitted(): QuestCommitted {
  return { pushups: false, situps: false, squats: false, run: false }
}

/**
 * Daily quest completion. When `committed` is given, a task only counts
 * once its target has been reached AND committed via its Complete
 * action — reaching the target with the steppers alone leaves the task
 * "at target" (its Complete button escalates) but not yet complete.
 */
export function isQuestComplete(
  progress: QuestProgress,
  level: number,
  committed?: QuestCommitted,
): boolean {
  return QUEST_DEFS.every(
    (def) => progress[def.key] >= questTarget(def, level) && (!committed || committed[def.key]),
  )
}

/** Overall daily quest completion as a fraction between 0 and 1. */
export function questCompletionFraction(progress: QuestProgress, level: number): number {
  const total = QUEST_DEFS.reduce((sum, def) => {
    const target = questTarget(def, level)
    return sum + Math.min(progress[def.key] / target, 1)
  }, 0)
  return total / QUEST_DEFS.length
}

/**
 * An open Boss Quest: one big single-day target behind a dungeon gate.
 * The key that opened the gate is consumed at opening (ledger ITEM_USE);
 * the shadow of a victory lives in the ledger, not here.
 */
export interface BossQuestState {
  /** Local date (yyyy-mm-dd) the gate was opened for. */
  date: string
  /** The boss waiting behind the gate. */
  bossName: string
  /** The exercise the boss tests (always push-ups for now). */
  exercise: QuestKey
  /** Reps required before the day ends. */
  target: number
  /** Reps fed in so far today (via the normal progress path). */
  progress: number
  /**
   * active — the hunt is on; won — target reached, victory unclaimed;
   * claimed — victory recorded in the ledger; lost — the day ended (or
   * the target was not met) and the boss escaped.
   */
  status: 'active' | 'won' | 'claimed' | 'lost'
}

export interface SystemState {
  version: 1
  /** True once the welcome notification has been shown and accepted. */
  welcomed: boolean
  level: number
  /** XP accumulated inside the current level. */
  xp: number
  totalXp: number
  availablePoints: number
  stats: PlayerStats
  /** Local date (yyyy-mm-dd) the current quest progress belongs to. */
  questDate: string
  questProgress: QuestProgress
  /** Local date the daily reward was last claimed, or null. */
  lastClaimedDate: string | null
  /** A past date whose quest ended incomplete and unclaimed, or null. */
  missedDate: string | null
  /** Lifetime count of claimed daily quests. */
  questsCompleted: number
  /**
   * Per-day quest record: local date (yyyy-mm-dd) → whether the daily
   * reward was claimed that day. Feeds the streak count and the records
   * calendar. Days never recorded are simply absent.
   */
  questHistory: Record<string, boolean>
  /**
   * Per-task commit flags for today's daily quest. Progress reaching a
   * target is not enough — the task completes when it is committed.
   * Reset every day.
   */
  questCommitted: QuestCommitted
  /** Monday (yyyy-mm-dd) of the week the weekly quest progress belongs to. */
  weekKey: string
  /** Exercise totals accumulated inside the current week. */
  weeklyProgress: QuestProgress
  /** Week key whose weekly reward was claimed, or null. */
  weeklyClaimedKey: string | null
  /**
   * The missed date a penalty recovery quest is currently offered for,
   * or null when no recovery is outstanding.
   */
  recoveryForDate: string | null
  /** Progress inside the recovery quest (push-ups / squats only). */
  recoveryProgress: QuestProgress
  /** Missed dates whose record was restored by a recovery quest. */
  recoveredDates: string[]
  /**
   * XP gained per local date (yyyy-mm-dd). Feeds the XP graph in
   * Records. Recording started with the production build — earlier
   * days are simply absent.
   */
  xpByDay: Record<string, number>
  /**
   * Lifetime reps per exercise, accumulated from every applied
   * progress delta. Feeds the title records (e.g. Iron Fist).
   * Counting started with the reward-economy build.
   */
  lifetimeReps: QuestProgress
  /** The currently open (or most recent) Boss Quest, or null. */
  bossQuest: BossQuestState | null
  /**
   * Missed dates a Streak Shield protected: the record counts as kept
   * (questHistory is true) and the calendar marks the shield.
   */
  shieldedDates: string[]
  /**
   * Dates the Player marked as rested with a Rest Pass: the record
   * counts as kept and no penalty applies.
   */
  restedDates: string[]
  /** True while a Double XP Elixir waits to double the next daily claim. */
  elixirArmed: boolean
}

export function defaultSystemState(today: string): SystemState {
  return {
    version: 1,
    welcomed: false,
    level: 1,
    xp: 0,
    totalXp: 0,
    availablePoints: 0,
    stats: { STR: 10, AGI: 10, VIT: 10, END: 10, PER: 10 },
    questDate: today,
    questProgress: emptyQuestProgress(),
    lastClaimedDate: null,
    missedDate: null,
    questsCompleted: 0,
    questHistory: {},
    questCommitted: emptyQuestCommitted(),
    weekKey: weekKeyFor(today),
    weeklyProgress: emptyQuestProgress(),
    weeklyClaimedKey: null,
    recoveryForDate: null,
    recoveryProgress: emptyQuestProgress(),
    recoveredDates: [],
    xpByDay: {},
    lifetimeReps: emptyQuestProgress(),
    bossQuest: null,
    shieldedDates: [],
    restedDates: [],
    elixirArmed: false,
  }
}

/** Monday (yyyy-mm-dd) of the week containing the given date key. */
export function weekKeyFor(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y || 1970, (m || 1) - 1, d || 1)
  const mondayOffset = (date.getDay() + 6) % 7 // Monday = 0
  return shiftDateKey(dateKey, -mondayOffset)
}

/** How many days inside the current week have a claimed daily quest. */
export function daysClearedThisWeek(state: SystemState): number {
  let count = 0
  for (let i = 0; i < 7; i++) {
    if (state.questHistory[shiftDateKey(state.weekKey, i)]) count += 1
  }
  return count
}

/** Weekly quest completion: every weekly total met + enough cleared days. */
export function isWeeklyComplete(state: SystemState): boolean {
  const totalsMet = WEEKLY_QUEST_DEFS.every(
    (def) => state.weeklyProgress[def.key] >= questTarget(def, state.level),
  )
  return totalsMet && daysClearedThisWeek(state) >= WEEKLY_DAYS_TARGET
}

/** Recovery quest completion: every recovery task at its fixed target. */
export function isRecoveryComplete(progress: QuestProgress): boolean {
  return RECOVERY_QUEST_DEFS.every((def) => progress[def.key] >= def.baseTarget)
}

/** Shift a yyyy-mm-dd date key by a number of days (local calendar math). */
export function shiftDateKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y || 1970, (m || 1) - 1, d || 1)
  date.setDate(date.getDate() + deltaDays)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

/**
 * Current streak: consecutive claimed days ending today — or ending
 * yesterday, while today is still in play.
 */
export function currentStreak(history: Record<string, boolean>, today: string): number {
  let cursor = history[today] ? today : shiftDateKey(today, -1)
  let streak = 0
  while (history[cursor]) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }
  return streak
}

export interface SystemNotificationData {
  kind: 'welcome' | 'reward' | 'levelup' | 'rankup' | 'recovery' | 'weekly'
  title: string
  lines: string[]
  /** Level transition, present on level-up notifications. */
  levelFrom?: number
  levelTo?: number
  /** Rank transition, present on rank-up notifications. */
  rankFrom?: HunterRank
  rankTo?: HunterRank
}
