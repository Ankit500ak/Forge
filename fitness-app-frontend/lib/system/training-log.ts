// AI Training session log — localStorage only, like the rest of the
// System layer. One entry per finished training session.

import type { RepExercise } from './rep-counter'

const STORAGE_KEY = 'forge-training-log-v1'
const MAX_ENTRIES = 60

export interface TrainingSession {
  /** Local date (yyyy-mm-dd) the session finished. */
  date: string
  exercise: RepExercise
  reps: number
  /** How the reps were counted. */
  source: 'ai' | 'manual'
}

export function loadTrainingLog(): TrainingSession[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is TrainingSession =>
        e &&
        typeof e.date === 'string' &&
        typeof e.reps === 'number' &&
        (e.exercise === 'pushups' || e.exercise === 'squats' || e.exercise === 'situps'),
    )
  } catch {
    return []
  }
}

export function appendTrainingSession(session: TrainingSession): TrainingSession[] {
  const log = [...loadTrainingLog(), session].slice(-MAX_ENTRIES)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
  } catch {
    // Storage unavailable — the session still counted toward the quest.
  }
  return log
}
