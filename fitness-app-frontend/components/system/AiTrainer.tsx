'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import {
  QUEST_DEFS,
  questTarget,
  type QuestKey,
  type SystemState,
} from '@/lib/system/types'
import {
  POSE_CONNECTIONS,
  REP_EXERCISES,
  RepCounter,
  primaryAngle,
  type RepExercise,
  type RepPhase,
} from '@/lib/system/rep-counter'
import {
  appendTrainingSession,
  loadTrainingLog,
  type TrainingSession,
} from '@/lib/system/training-log'
import { SystemWindow } from './SystemWindow'
import { CoreIcon, DumbbellIcon, SquatIcon } from './icons'

const EXERCISE_ICONS: Record<RepExercise, ComponentType<{ className?: string }>> = {
  pushups: DumbbellIcon,
  squats: SquatIcon,
  situps: CoreIcon,
}

type Stage = 'picker' | 'starting' | 'live' | 'manual' | 'done'

interface SessionSummary {
  exercise: RepExercise
  counted: number
  applied: number
  note: 'applied' | 'target-reached' | 'already-claimed' | 'none'
}

interface AiTrainerProps {
  state: SystemState
  onAddProgress: (key: QuestKey, delta: number) => void
  /** Called with the reps that were applied to the quest (gold hook). */
  onRepsApplied?: (reps: number, exercise: RepExercise) => void
}

const WASM_PATH = '/mediapipe/wasm'
const MODEL_PATH = '/models/pose_landmarker_lite.task'

/**
 * AI Training: on-device pose estimation (MediaPipe Pose Landmarker,
 * model + WASM served from the app's own assets) counts reps for
 * push-ups, squats and sit-ups, and feeds them into today's daily quest
 * through the System's existing addProgress. If the camera or the model
 * is unavailable, the screen falls back to a manual counter — the quest
 * integration is identical either way.
 */
export function AiTrainer({ state, onAddProgress, onRepsApplied }: AiTrainerProps) {
  const [stage, setStage] = useState<Stage>('picker')
  const [exercise, setExercise] = useState<RepExercise>('pushups')
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<RepPhase>('extended')
  const [angleDeg, setAngleDeg] = useState<number | null>(null)
  const [tracking, setTracking] = useState(false)
  const [fallbackNote, setFallbackNote] = useState<string | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [log, setLog] = useState<TrainingSession[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const counterRef = useRef<RepCounter | null>(null)
  const rafRef = useRef<number>(0)
  const runningRef = useRef(false)
  const mountedRef = useRef(true)
  const lastVideoTimeRef = useRef(-1)
  const exerciseRef = useRef<RepExercise>('pushups')
  const countRef = useRef(0)

  useEffect(() => {
    setLog(loadTrainingLog())
  }, [])

  const setCountBoth = useCallback((n: number) => {
    countRef.current = n
    setCount(n)
  }, [])

  const stopEngine = useCallback(() => {
    runningRef.current = false
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop()
      streamRef.current = null
    }
    if (landmarkerRef.current) {
      try {
        landmarkerRef.current.close()
      } catch {
        // Already closed.
      }
      landmarkerRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopEngine()
    }
  }, [stopEngine])

  const drawSkeleton = useCallback((landmarks: { x: number; y: number }[] | undefined) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (video.videoWidth && canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!landmarks || landmarks.length === 0) return
    ctx.lineWidth = Math.max(2, canvas.width / 240)
    ctx.strokeStyle = 'rgba(124, 224, 255, 0.85)'
    for (const [a, b] of POSE_CONNECTIONS) {
      const p = landmarks[a]
      const q = landmarks[b]
      if (!p || !q) continue
      ctx.beginPath()
      ctx.moveTo(p.x * canvas.width, p.y * canvas.height)
      ctx.lineTo(q.x * canvas.width, q.y * canvas.height)
      ctx.stroke()
    }
    ctx.fillStyle = '#eaf9ff'
    const r = Math.max(2, canvas.width / 320)
    for (const p of landmarks) {
      ctx.beginPath()
      ctx.arc(p.x * canvas.width, p.y * canvas.height, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  const startLoop = useCallback(() => {
    const loop = () => {
      if (!runningRef.current) return
      const video = videoRef.current
      const landmarker = landmarkerRef.current
      if (
        video &&
        landmarker &&
        video.readyState >= 2 &&
        video.currentTime !== lastVideoTimeRef.current
      ) {
        lastVideoTimeRef.current = video.currentTime
        try {
          const result = landmarker.detectForVideo(video, performance.now())
          const landmarks = result.landmarks?.[0]
          drawSkeleton(landmarks)
          setTracking(Boolean(landmarks))
          const angle = primaryAngle(exerciseRef.current, landmarks)
          if (angle !== null && counterRef.current) {
            const update = counterRef.current.update(angle)
            setAngleDeg(Math.round(angle))
            setPhase(update.phase)
            if (update.justCounted) setCountBoth(update.count)
          }
        } catch {
          // A transient detection error must not kill the session.
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [drawSkeleton, setCountBoth])

  const startAi = useCallback(
    async (ex: RepExercise) => {
      exerciseRef.current = ex
      setExercise(ex)
      setFallbackNote(null)
      setStage('starting')
      setCountBoth(0)
      setPhase('extended')
      setAngleDeg(null)
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('This device exposes no camera API.')
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (!mountedRef.current) {
          for (const track of stream.getTracks()) track.stop()
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) throw new Error('Camera view failed to mount.')
        video.srcObject = stream
        await video.play()

        const vision = await import('@mediapipe/tasks-vision')
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH)
        const options = (delegate: 'GPU' | 'CPU'): Parameters<typeof vision.PoseLandmarker.createFromOptions>[1] => ({
          baseOptions: { modelAssetPath: MODEL_PATH, delegate },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
        let landmarker: PoseLandmarker
        try {
          landmarker = await vision.PoseLandmarker.createFromOptions(fileset, options('GPU'))
        } catch {
          landmarker = await vision.PoseLandmarker.createFromOptions(fileset, options('CPU'))
        }
        if (!mountedRef.current) {
          landmarker.close()
          stopEngine()
          return
        }
        landmarkerRef.current = landmarker
        counterRef.current = new RepCounter(ex)
        runningRef.current = true
        setStage('live')
        startLoop()
      } catch (err) {
        stopEngine()
        if (!mountedRef.current) return
        const rawMessage =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera access was denied.'
            : err instanceof Error
              ? err.message
              : 'The pose engine failed to start.'
        const detail = rawMessage.endsWith('.') ? rawMessage.slice(0, -1) : rawMessage
        setFallbackNote(`[Camera unavailable: ${detail}. Manual counting engaged, Player.]`)
        setStage('manual')
      }
    },
    [setCountBoth, startLoop, stopEngine],
  )

  const startManual = useCallback(
    (ex: RepExercise) => {
      exerciseRef.current = ex
      setExercise(ex)
      setFallbackNote(null)
      setCountBoth(0)
      setStage('manual')
    },
    [setCountBoth],
  )

  const endSession = useCallback(() => {
    stopEngine()
    const counted = countRef.current
    const def = QUEST_DEFS.find((d) => d.key === exerciseRef.current)
    const claimedToday = state.lastClaimedDate === state.questDate
    let applied = 0
    let note: SessionSummary['note'] = 'none'
    if (def && counted > 0) {
      const target = questTarget(def, state.level)
      const remaining = Math.max(0, target - state.questProgress[def.key])
      applied = Math.min(counted, remaining)
      if (claimedToday) note = 'already-claimed'
      else if (applied < counted) note = 'target-reached'
      else note = 'applied'
      if (applied > 0) {
        // While a Boss Quest hunts this exercise, the full counted set
        // is passed through: addProgress clamps the daily quest itself,
        // and the boss feed takes the raw delta (its target sits far
        // above the daily cap). Otherwise only the applied reps move.
        const bossHunting =
          state.bossQuest &&
          state.bossQuest.status === 'active' &&
          state.bossQuest.date === state.questDate &&
          state.bossQuest.exercise === def.key
        onAddProgress(def.key, bossHunting ? counted : applied)
        onRepsApplied?.(applied, exerciseRef.current)
      }
      setLog(
        appendTrainingSession({
          date: state.questDate,
          exercise: exerciseRef.current,
          reps: counted,
          source: stage === 'manual' ? 'manual' : 'ai',
        }),
      )
    }
    setSummary({ exercise: exerciseRef.current, counted, applied, note })
    setStage('done')
  }, [onAddProgress, onRepsApplied, stage, state])

  const resetCount = useCallback(() => {
    counterRef.current?.reset()
    setCountBoth(0)
    setPhase('extended')
  }, [setCountBoth])

  const config = REP_EXERCISES[exercise]
  const questDef = QUEST_DEFS.find((d) => d.key === exercise)
  const questProgress = questDef ? state.questProgress[questDef.key] : 0
  const questGoal = questDef ? questTarget(questDef, state.level) : 0
  const claimedToday = state.lastClaimedDate === state.questDate

  const stripText =
    stage === 'picker'
      ? 'Select a training protocol. The System will count your repetitions.'
      : stage === 'starting'
        ? 'Accessing camera and loading the pose model…'
        : stage === 'live'
          ? `AI Training: ${config.label}. The System is watching your form.`
          : stage === 'manual'
            ? `Manual Training: ${config.label}. Count honestly, Player.`
            : 'Training recorded.'

  return (
    <SystemWindow title="AI Training" bare>
      <p className="sl-strip" role="note">
        <span className="sl-strip-bracket" aria-hidden>
          [
        </span>
        <span className="sl-strip-text">{stripText}</span>
        <span className="sl-strip-bracket" aria-hidden>
          ]
        </span>
      </p>

      {stage === 'picker' && (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(REP_EXERCISES) as RepExercise[]).map((key) => {
              const cfg = REP_EXERCISES[key]
              const Icon = EXERCISE_ICONS[key]
              const def = QUEST_DEFS.find((d) => d.key === key)
              const progress = def ? state.questProgress[def.key] : 0
              const goal = def ? questTarget(def, state.level) : 0
              const pct = goal > 0 ? Math.min(100, (progress / goal) * 100) : 0
              return (
                <button
                  key={key}
                  type="button"
                  className={`sl-exercise-card${exercise === key ? ' selected' : ''}`}
                  onClick={() => setExercise(key)}
                  aria-pressed={exercise === key}
                >
                  <span className="sl-quest-icon">
                    <Icon />
                  </span>
                  <span className="mt-2.5 block font-bold text-white">{cfg.label}</span>
                  <span className="mt-1 block text-[0.72rem] leading-relaxed text-[#9fc6e8]">
                    {cfg.cue}
                  </span>
                  <div className="sl-bar mt-3" style={{ height: 6 }}>
                    <div className="sl-bar-fill quest" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="sl-num mt-1.5 block text-[0.7rem] font-semibold text-[#a9cdec]">
                    Quest: {progress} / {goal} reps
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button type="button" className="sl-btn primary" onClick={() => startAi(exercise)}>
              Start AI Training
            </button>
            <button type="button" className="sl-btn ghost" onClick={() => startManual(exercise)}>
              Manual Counter
            </button>
          </div>
          <p className="mt-4 text-center text-[0.72rem] leading-relaxed text-[#8fb8d8]">
            [All processing happens on this device. No video is recorded or sent anywhere.]
          </p>

          {log.length === 0 ? (
            <div className="mt-6 border-t border-white/[0.07] pt-4">
              <p className="sl-label mb-2.5">Training Log</p>
              <p className="text-[0.78rem] leading-relaxed text-[#8fb8d8]">
                [No sessions recorded yet. Your training history will appear here.]
              </p>
            </div>
          ) : (
            <div className="mt-6 border-t border-white/[0.07] pt-4">
              <p className="sl-label mb-2.5">Training Log</p>
              <ul className="space-y-1.5">
                {[...log].reverse().slice(0, 5).map((entry, i) => (
                  <li
                    key={`${entry.date}-${i}`}
                    className="flex items-center gap-3 text-[0.78rem] text-[#c9e6f7]"
                  >
                    <span className="flex-1 truncate font-semibold text-white">
                      {REP_EXERCISES[entry.exercise].label}
                    </span>
                    <span className="sl-num font-bold">{entry.reps} reps</span>
                    <span className="sl-train-src">{entry.source === 'ai' ? 'AI' : 'Manual'}</span>
                    <span className="text-[#8fb8d8]">
                      {entry.date === state.questDate ? 'Today' : entry.date}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(stage === 'live' || stage === 'starting' || stage === 'manual') && (
        <div className="mt-5">
          {stage !== 'manual' ? (
            <>
              {/* The video element must stay mounted from 'starting' on:
                  startAi assigns the camera stream to it before the
                  stage flips to 'live'. */}
              <div className="sl-train-stage">
                <div className="sl-train-mirror">
                  <video ref={videoRef} playsInline muted autoPlay />
                  <canvas ref={canvasRef} />
                </div>
                {stage === 'live' && (
                  <span className={`sl-phase-pill${phase === 'contracted' ? ' low' : ''}`}>
                    {phase === 'contracted' ? config.contractedLabel : config.extendedLabel}
                  </span>
                )}
              </div>
              <p className="mt-2.5 text-center text-[0.72rem] text-[#8fb8d8]">
                {stage === 'starting'
                  ? '[Summoning the pose engine…]'
                  : tracking
                    ? '[Pose locked. The System is counting.]'
                    : '[No pose detected. Step into the frame, Player.]'}
              </p>
            </>
          ) : (
            fallbackNote && (
              <div className="sl-warning mb-4 text-center" role="note">
                {fallbackNote}
              </div>
            )
          )}

          <div className="mt-4 flex items-end justify-center gap-5">
            <div className="text-center">
              <p className="sl-label">Reps</p>
              <p className="sl-display sl-train-count">{count}</p>
            </div>
            <div className="pb-2 text-center">
              <p className="sl-label">Quest</p>
              <p className="sl-num mt-1 text-lg font-extrabold text-white">
                {questProgress} <span className="text-[#8fd0f2]">/ {questGoal}</span>
              </p>
              {angleDeg !== null && stage === 'live' && (
                <p className="sl-num mt-0.5 text-[0.7rem] text-[#8fb8d8]">Joint angle {angleDeg}°</p>
              )}
            </div>
          </div>

          {stage === 'manual' && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="sl-round-btn"
                onClick={() => setCountBoth(Math.max(0, countRef.current - 1))}
                aria-label="Remove one rep"
              >
                −
              </button>
              <button
                type="button"
                className="sl-btn commit"
                onClick={() => setCountBoth(countRef.current + 1)}
              >
                +1 Rep
              </button>
              <button
                type="button"
                className="sl-btn ghost"
                onClick={() => setCountBoth(countRef.current + 5)}
              >
                +5
              </button>
            </div>
          )}

          {stage !== 'starting' && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button type="button" className="sl-btn primary" onClick={endSession}>
                End Session
              </button>
              <button type="button" className="sl-btn ghost" onClick={resetCount}>
                Reset
              </button>
            </div>
          )}
          <p className="mt-3.5 text-center text-[0.72rem] leading-relaxed text-[#8fb8d8]">
            {claimedToday
              ? '[Today\u2019s reward is already claimed. This session will still be recorded.]'
              : '[Session reps are added to today\u2019s quest when you end the session.]'}
          </p>
        </div>
      )}

      {stage === 'done' && summary && (
        <div className="mt-5 text-center">
          <p className="sl-label">{REP_EXERCISES[summary.exercise].label} — Session Reps</p>
          <p className="sl-display sl-train-count">{summary.counted}</p>
          <p className="mx-auto mt-2 max-w-md text-[0.82rem] leading-relaxed text-[#9fc6e8]">
            {summary.note === 'applied' &&
              `[${summary.applied} reps added to today's quest. Well done, Player.]`}
            {summary.note === 'target-reached' &&
              `[Quest target reached — ${summary.applied} reps added. The surplus is recorded in your training log.]`}
            {summary.note === 'already-claimed' &&
              '[Today\u2019s reward was already claimed. The session is recorded in your training log.]'}
            {summary.note === 'none' &&
              '[No reps recorded. The System expects more tomorrow, Player.]'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              className="sl-btn ghost"
              onClick={() => {
                setSummary(null)
                setCountBoth(0)
                setStage('picker')
              }}
            >
              Train Again
            </button>
            <Link href="/system" className="sl-btn commit">
              Return to the System
            </Link>
          </div>
        </div>
      )}
    </SystemWindow>
  )
}
