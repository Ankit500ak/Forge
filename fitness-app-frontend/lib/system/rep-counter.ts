// AI rep counting — pure logic, no DOM / MediaPipe imports.
//
// A pose model produces 33 landmarks per frame (MediaPipe Pose). For each
// supported exercise one joint angle carries the movement:
//
//   push-ups → elbow angle   (shoulder–elbow–wrist)
//   squats   → knee angle    (hip–knee–ankle)
//   sit-ups  → hip angle     (shoulder–hip–knee)
//
// Every exercise cycles between an EXTENDED position (angle near 180°)
// and a CONTRACTED position (angle small). The counter is a two-state
// machine with hysteresis: it arms when the angle drops to/below the
// exercise's `contractedAt` threshold and counts one rep when the angle
// returns to/above `extendedAt`. The gap between the thresholds is what
// stops jitter around a single cutoff from double-counting.
//
// This module is deliberately dependency-free so it can be unit-checked
// with synthetic angle series outside the browser.

export interface LandmarkPoint {
  x: number
  y: number
  z?: number
  visibility?: number
}

/** MediaPipe Pose landmark indices used by the counter. */
export const LM = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const

/** Skeleton segments drawn over the camera feed (MediaPipe pose topology subset). */
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [15, 17],
  [16, 18],
  [27, 29],
  [28, 30],
  [27, 31],
  [28, 32],
]

/** Angle in degrees at vertex `b` formed by points a–b–c (0–180). */
export function jointAngle(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): number {
  const v1x = a.x - b.x
  const v1y = a.y - b.y
  const v2x = c.x - b.x
  const v2y = c.y - b.y
  const m1 = Math.hypot(v1x, v1y)
  const m2 = Math.hypot(v2x, v2y)
  if (m1 === 0 || m2 === 0) return 180
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / (m1 * m2)))
  return (Math.acos(cos) * 180) / Math.PI
}

export type RepExercise = 'pushups' | 'squats' | 'situps'

export interface RepExerciseConfig {
  key: RepExercise
  label: string
  /** Angle at/below which the movement counts as fully contracted (bottom). */
  contractedAt: number
  /** Angle at/above which the movement counts as fully extended (top). */
  extendedAt: number
  /** Phase captions shown while training. */
  contractedLabel: string
  extendedLabel: string
  /** Short form cue shown on the picker. */
  cue: string
}

export const REP_EXERCISES: Record<RepExercise, RepExerciseConfig> = {
  pushups: {
    key: 'pushups',
    label: 'Push-ups',
    contractedAt: 95,
    extendedAt: 150,
    contractedLabel: 'Down',
    extendedLabel: 'Up',
    cue: 'Side-on to the camera, full body in frame.',
  },
  squats: {
    key: 'squats',
    label: 'Squats',
    contractedAt: 105,
    extendedAt: 158,
    contractedLabel: 'Down',
    extendedLabel: 'Stand',
    cue: 'Face the camera, feet to head in frame.',
  },
  situps: {
    key: 'situps',
    label: 'Sit-ups',
    contractedAt: 88,
    extendedAt: 140,
    contractedLabel: 'Curl up',
    extendedLabel: 'Lie back',
    cue: 'Side-on to the camera, lying in frame.',
  },
}

type Triple = [number, number, number]

/** Landmark triples (a, vertex, c) per exercise: [left side, right side]. */
const ANGLE_TRIPLES: Record<RepExercise, [Triple, Triple]> = {
  pushups: [
    [LM.leftShoulder, LM.leftElbow, LM.leftWrist],
    [LM.rightShoulder, LM.rightElbow, LM.rightWrist],
  ],
  squats: [
    [LM.leftHip, LM.leftKnee, LM.leftAnkle],
    [LM.rightHip, LM.rightKnee, LM.rightAnkle],
  ],
  situps: [
    [LM.leftShoulder, LM.leftHip, LM.leftKnee],
    [LM.rightShoulder, LM.rightHip, LM.rightKnee],
  ],
}

const MIN_VISIBILITY = 0.45

/**
 * The primary joint angle for an exercise from one frame of landmarks.
 * Both body sides are averaged, weighted by landmark visibility; a side
 * whose joints are barely visible is ignored. Returns null when neither
 * side is tracked well enough to trust.
 */
export function primaryAngle(
  exercise: RepExercise,
  landmarks: LandmarkPoint[] | undefined | null,
): number | null {
  if (!landmarks || landmarks.length < 29) return null
  let weighted = 0
  let weights = 0
  for (const [ia, ib, ic] of ANGLE_TRIPLES[exercise]) {
    const a = landmarks[ia]
    const b = landmarks[ib]
    const c = landmarks[ic]
    if (!a || !b || !c) continue
    const vis = Math.min(a.visibility ?? 1, b.visibility ?? 1, c.visibility ?? 1)
    if (vis < MIN_VISIBILITY) continue
    weighted += jointAngle(a, b, c) * vis
    weights += vis
  }
  if (weights === 0) return null
  return weighted / weights
}

export type RepPhase = 'extended' | 'contracted'

export interface RepUpdate {
  /** Total reps counted so far. */
  count: number
  /** Current position of the movement. */
  phase: RepPhase
  /** True only on the single update that completed a rep. */
  justCounted: boolean
  /** The angle that produced this update. */
  angle: number
}

/**
 * Two-state rep counter with hysteresis. Feed it one angle per frame via
 * `update`. A rep is counted on a full contracted → extended return after
 * the movement genuinely reached the contracted threshold.
 */
export class RepCounter {
  private readonly config: RepExerciseConfig
  private phase: RepPhase = 'extended'
  private reps = 0

  constructor(exercise: RepExercise) {
    this.config = REP_EXERCISES[exercise]
  }

  get count(): number {
    return this.reps
  }

  get currentPhase(): RepPhase {
    return this.phase
  }

  update(angle: number): RepUpdate {
    let justCounted = false
    if (this.phase === 'extended' && angle <= this.config.contractedAt) {
      this.phase = 'contracted'
    } else if (this.phase === 'contracted' && angle >= this.config.extendedAt) {
      this.phase = 'extended'
      this.reps += 1
      justCounted = true
    }
    return { count: this.reps, phase: this.phase, justCounted, angle }
  }

  reset(): void {
    this.phase = 'extended'
    this.reps = 0
  }
}
