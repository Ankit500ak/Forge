"use client"

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import Navigation from '@/components/navigation'
import apiClient from '@/lib/api-client'

type DetectionPrediction = {
	food: string
	confidence: number
	probability?: string
	bbox?: number[] | null
}

type DetectionResult = {
	status: string
	food_name?: string
	calories?: number
	protein?: number
	carbs?: number
	fat?: number
	confidence?: number
	error?: string
	all_predictions?: DetectionPrediction[]
}

type CalorieLog = {
	id: string
	food: string
	calories: number
	protein?: number
	carbs?: number
	fat?: number
	time: string
}

type Box = {
	left: number
	top: number
	width: number
	height: number
	label: string
	conf: number
}

const CALORIE_GOAL = 2000

const ACCENT = {
	bg: '#04050a',
	panel: 'rgba(255,255,255,0.05)',
	panel2: 'rgba(255,255,255,0.08)',
	border: 'rgba(255,255,255,0.10)',
	calories: '#fb7185',
	protein: '#38bdf8',
	carbs: '#a78bfa',
	fat: '#f59e0b',
	success: '#34d399',
	cyan: '#22d3ee',
}

function SectionLabel({ title, caption }: { title: string; caption?: string }) {
	return (
		<div className="mb-4">
			<p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">{title}</p>
			{caption ? <p className="mt-1 text-sm text-zinc-400">{caption}</p> : null}
		</div>
	)
}

function StatTile({
	label,
	value,
	accent,
	detail,
}: {
	label: string
	value: string | number
	accent: string
	detail?: string
}) {
	return (
		<div
			className="relative overflow-hidden rounded-[1.6rem] border p-4 shadow-xl shadow-black/20"
			style={{ background: ACCENT.panel, borderColor: `${accent}26` }}
		>
			<div className="absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-40" style={{ background: accent }} />
			<p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">{label}</p>
			<p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
			{detail ? <p className="mt-1 text-xs text-zinc-400">{detail}</p> : null}
		</div>
	)
}

function MacroPill({
	label,
	value,
	unit = 'g',
	accent,
}: {
	label: string
	value: number
	unit?: string
	accent: string
}) {
	return (
		<div className="rounded-2xl border px-3 py-3" style={{ background: `${accent}12`, borderColor: `${accent}2c` }}>
			<p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: `${accent}cc` }}>
				{label}
			</p>
			<p className="mt-1 text-xl font-black text-white">
				{value}
				<span className="ml-1 text-xs font-normal text-zinc-400">{unit}</span>
			</p>
		</div>
	)
}

function MacroBar({
	label,
	value,
	max,
	accent,
}: {
	label: string
	value: number
	max: number
	accent: string
}) {
	const pct = Math.min(100, Math.round((value / max) * 100))
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-xs">
				<span className="font-semibold uppercase tracking-[0.35em]" style={{ color: accent }}>
					{label}
				</span>
				<span className="text-zinc-400">{value}g</span>
			</div>
			<div className="h-2 rounded-full bg-white/8 overflow-hidden">
				<div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: accent }} />
			</div>
		</div>
	)
}

function GoalRing({ current, goal }: { current: number; goal: number }) {
	const radius = 50
	const circumference = 2 * Math.PI * radius
	const progress = Math.min(1, current / goal)
	const dash = circumference * progress

	return (
		<div className="relative flex h-36 w-36 items-center justify-center">
			<svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
				<circle cx="72" cy="72" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
				<circle
					cx="72"
					cy="72"
					r={radius}
					fill="none"
					stroke={current > goal ? '#f87171' : ACCENT.calories}
					strokeWidth="10"
					strokeLinecap="round"
					strokeDasharray={`${dash} ${circumference}`}
					className="transition-all duration-700"
				/>
			</svg>
			<div className="relative z-10 text-center">
				<p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">Today</p>
				<p className="mt-1 text-3xl font-black tracking-tight text-white">{current.toLocaleString()}</p>
				<p className="mt-1 text-xs text-zinc-400">of {goal.toLocaleString()} kcal</p>
			</div>
		</div>
	)
}

export default function CalorieDetectorPage() {
	const { user } = useAuth()
	const router = useRouter()

	const [mounted, setMounted] = useState(false)
	const [cameraActive, setCameraActive] = useState(false)
	const [videoReady, setVideoReady] = useState(false)
	const [loading, setLoading] = useState(false)
	const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
	const [realtimeMode, setRealtimeMode] = useState(false)
	const [streamConnected, setStreamConnected] = useState(false)
	const [boxes, setBoxes] = useState<Box[]>([])
	const [dailyLogs, setDailyLogs] = useState<CalorieLog[]>([])
	const [totalCalories, setTotalCalories] = useState(0)
	const [calorieGoal, setCalorieGoal] = useState(CALORIE_GOAL)
	const [goalDraft, setGoalDraft] = useState(String(CALORIE_GOAL))
	const [editingGoal, setEditingGoal] = useState(false)

	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const wsRef = useRef<WebSocket | null>(null)
	const streamBusyRef = useRef(false)
	const streamModeRef = useRef(false)
	const reconnectTimerRef = useRef<number | null>(null)
	const streamTimerRef = useRef<number | null>(null)

	useEffect(() => {
		setMounted(true)
		if (!user) router.push('/')
	}, [user, router])

	useEffect(() => {
		return () => {
			streamRef.current?.getTracks().forEach((track) => track.stop())
			if (wsRef.current) wsRef.current.close()
			if (streamTimerRef.current) window.clearInterval(streamTimerRef.current)
			if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current)
		}
	}, [])

	const wsUrl = useMemo(() => {
		const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
		const base = api.replace(/\/api\/?$/, '')
		if (base.startsWith('https://')) return `${base.replace(/^https:/, 'wss:')}/api/food/stream?threshold=0.3`
		if (base.startsWith('http://')) return `${base.replace(/^http:/, 'ws:')}/api/food/stream?threshold=0.3`
		if (typeof window !== 'undefined') {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
			return `${protocol}//${window.location.host}/api/food/stream?threshold=0.3`
		}
		return 'ws://localhost:5000/api/food/stream?threshold=0.3'
	}, [])

	const getFrameBlob = async (quality = 0.84): Promise<Blob | null> => {
		const video = videoRef.current
		const canvas = canvasRef.current
		if (!video || !canvas) return null
		if (!video.videoWidth || !video.videoHeight) return null

		const context = canvas.getContext('2d')
		if (!context) return null

		canvas.width = video.videoWidth
		canvas.height = video.videoHeight
		context.drawImage(video, 0, 0)

		return new Promise((resolve) => {
			canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
		})
	}

	const waitForVideoReady = async () => {
		const video = videoRef.current
		if (!video) return false

		if (video.videoWidth > 0 && video.videoHeight > 0) {
			setVideoReady(true)
			return true
		}

		return new Promise<boolean>((resolve) => {
			const startedAt = Date.now()
			const timeoutMs = 5000

			const tick = () => {
				if (!videoRef.current) {
					resolve(false)
					return
				}

				if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
					setVideoReady(true)
					resolve(true)
					return
				}

				if (Date.now() - startedAt > timeoutMs) {
					resolve(false)
					return
				}

				window.setTimeout(tick, 100)
			}

			tick()
		})
	}

	const mapBoxes = (predictions?: DetectionResult['all_predictions']) => {
		const video = videoRef.current
		if (!video || !predictions?.length) {
			setBoxes([])
			return
		}

		const videoWidth = video.videoWidth || video.clientWidth || 1
		const videoHeight = video.videoHeight || video.clientHeight || 1
		const renderWidth = video.clientWidth || videoWidth
		const renderHeight = video.clientHeight || videoHeight

		setBoxes(
			predictions
				.filter((item) => item.bbox && item.bbox.length >= 4)
				.map((item) => {
					const [x1, y1, x2, y2] = item.bbox as number[]
					return {
						left: (x1 / videoWidth) * renderWidth,
						top: (y1 / videoHeight) * renderHeight,
						width: ((x2 - x1) / videoWidth) * renderWidth,
						height: ((y2 - y1) / videoHeight) * renderHeight,
						label: item.food,
						conf: item.confidence,
					}
				})
		)
	}

	const applyDetection = (result: DetectionResult) => {
		setDetectionResult(result)
		if (result.all_predictions) mapBoxes(result.all_predictions)
	}

	const captureAndDetect = async () => {
		setLoading(true)
		try {
			const ready = await waitForVideoReady()
			if (!ready) throw new Error('Camera frame not ready')

			const blob = await getFrameBlob()
			if (!blob) throw new Error('Camera frame not ready')

			const formData = new FormData()
			formData.append('image', blob, 'frame.jpg')

			const response = await apiClient.post('/food/detect', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			})

			applyDetection(response.data)
		} catch (error) {
			setDetectionResult({
				status: 'error',
				error: error instanceof Error ? error.message : 'Detection failed',
			})
			setBoxes([])
		} finally {
			setLoading(false)
		}
	}

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		setLoading(true)
		try {
			const formData = new FormData()
			formData.append('image', file)

			const response = await apiClient.post('/food/detect', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			})

			applyDetection(response.data)
		} catch (error) {
			setDetectionResult({
				status: 'error',
				error: error instanceof Error ? error.message : 'Upload detection failed',
			})
			setBoxes([])
		} finally {
			setLoading(false)
			event.target.value = ''
		}
	}

	const startCamera = async () => {
		try {
			setVideoReady(false)
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'environment',
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
			})

			streamRef.current = stream
			if (videoRef.current) {
				videoRef.current.srcObject = stream
				await videoRef.current.play().catch(() => {})
			}
			setCameraActive(true)
			void waitForVideoReady()
		} catch (error) {
			console.error(error)
			alert('Camera access denied or unavailable.')
		}
	}

	const stopCamera = () => {
		streamRef.current?.getTracks().forEach((track) => track.stop())
		streamRef.current = null
		setCameraActive(false)
		stopStream()
	}

	const connectStream = () => {
		if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
			return
		}

		const socket = new WebSocket(wsUrl)
		socket.binaryType = 'arraybuffer'

		socket.onopen = () => setStreamConnected(true)
		socket.onclose = () => {
			setStreamConnected(false)
			streamBusyRef.current = false
			if (streamModeRef.current) {
				reconnectTimerRef.current = window.setTimeout(() => {
					if (streamModeRef.current) connectStream()
				}, 600)
			}
		}
		socket.onerror = () => {
			setStreamConnected(false)
			streamBusyRef.current = false
		}
		socket.onmessage = (event) => {
			try {
				const payload = JSON.parse(typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data))

				if (payload?.type === 'ready') {
					setStreamConnected(true)
					return
				}

				if (payload?.type === 'busy') {
					streamBusyRef.current = false
					return
				}

				if (payload?.type === 'detection') {
					applyDetection(payload)
					streamBusyRef.current = false
					return
				}

				if (payload?.type === 'error') {
					setDetectionResult({
						status: 'error',
						error: payload.error || 'Realtime detection failed',
					})
					streamBusyRef.current = false
				}
			} catch (error) {
				console.warn('Could not parse stream message', error)
				streamBusyRef.current = false
			}
		}

		wsRef.current = socket
	}

	const sendStreamFrame = async () => {
		const socket = wsRef.current
		if (!streamModeRef.current || !cameraActive || !socket || socket.readyState !== WebSocket.OPEN || streamBusyRef.current) return
		if (!videoReady) {
			const ready = await waitForVideoReady()
			if (!ready) return
		}

		const blob = await getFrameBlob(0.8)
		if (!blob) return

		streamBusyRef.current = true
		socket.send(blob)
	}

	const startStream = () => {
		streamModeRef.current = true
		connectStream()
		if (streamTimerRef.current) window.clearInterval(streamTimerRef.current)
		streamTimerRef.current = window.setInterval(() => {
			void sendStreamFrame()
		}, 450)
	}

	const stopStream = () => {
		streamModeRef.current = false
		streamBusyRef.current = false
		if (streamTimerRef.current) {
			window.clearInterval(streamTimerRef.current)
			streamTimerRef.current = null
		}
		if (reconnectTimerRef.current) {
			window.clearTimeout(reconnectTimerRef.current)
			reconnectTimerRef.current = null
		}
		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}
		setStreamConnected(false)
		setRealtimeMode(false)
	}

	const addToLog = () => {
		if (!detectionResult || detectionResult.status !== 'success') return

		const entry: CalorieLog = {
			id: crypto.randomUUID(),
			food: detectionResult.food_name || 'Unknown food',
			calories: detectionResult.calories || 0,
			protein: detectionResult.protein,
			carbs: detectionResult.carbs,
			fat: detectionResult.fat,
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
		}

		setDailyLogs((prev) => [entry, ...prev])
		setTotalCalories((prev) => prev + entry.calories)
		setDetectionResult(null)
		setBoxes([])
	}

	const deleteLog = (id: string) => {
		setDailyLogs((prev) => {
			const removed = prev.find((item) => item.id === id)
			if (removed) setTotalCalories((current) => current - removed.calories)
			return prev.filter((item) => item.id !== id)
		})
	}

	const calorieProgress = Math.min(100, Math.round((totalCalories / calorieGoal) * 100))
	const remainingCalories = Math.max(0, calorieGoal - totalCalories)
	const macroTotals = useMemo(() => {
		return dailyLogs.reduce(
			(acc, item) => ({
				protein: acc.protein + (item.protein || 0),
				carbs: acc.carbs + (item.carbs || 0),
				fat: acc.fat + (item.fat || 0),
			}),
			{ protein: 0, carbs: 0, fat: 0 }
		)
	}, [dailyLogs])

	const saveGoal = () => {
		const nextGoal = parseInt(goalDraft, 10)
		if (!Number.isNaN(nextGoal) && nextGoal > 0) {
			setCalorieGoal(nextGoal)
		}
		setEditingGoal(false)
	}

	if (!mounted || !user) return null

	return (
		<div className="min-h-screen pb-28 text-white" style={{ background: ACCENT.bg }}>
			<Navigation />

			<div className="pointer-events-none fixed inset-0 overflow-hidden">
				<div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" />
				<div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
				<div className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full bg-amber-500/10 blur-3xl" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_35%),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_100%,30px_30px,30px_30px] opacity-20" />
			</div>

			<header className="sticky top-0 z-20 border-b border-white/5 bg-[#04050af2] backdrop-blur-2xl">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
					<div>
						<p className="text-[10px] uppercase tracking-[0.45em] text-cyan-300/70">Calorie Detector</p>
						<h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Mobile food scanner</h1>
					</div>
					<div className="flex items-center gap-2">
						<span
							className="rounded-full border px-3 py-1 text-xs font-semibold"
							style={{
								background: streamConnected ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
								borderColor: streamConnected ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.08)',
								color: streamConnected ? '#86efac' : '#94a3b8',
							}}
						>
							{streamConnected ? '● Live' : cameraActive ? 'Camera on' : 'Idle'}
						</span>
						<button
							onClick={() => fileInputRef.current?.click()}
							className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
						>
							Upload
						</button>
						<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
					</div>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
				<section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
						<div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),transparent_38%,rgba(244,114,182,0.08))]" />
						<div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
							<div>
								<p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">Today's intake</p>
								<div className="mt-3 flex items-end gap-3">
									<p className="text-5xl font-black tracking-tight text-white sm:text-6xl">{totalCalories.toLocaleString()}</p>
									<p className="pb-2 text-sm font-semibold text-zinc-400">kcal</p>
								</div>
								<p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">
									Scan a plate, capture a photo, or stream camera frames in realtime. The design is optimized for thumb use on mobile.
								</p>

								<div className="mt-5 flex flex-wrap gap-2">
									<span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">{dailyLogs.length} meals</span>
									<span className="rounded-full border border-fuchsia-400/15 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold text-fuchsia-200">
										{realtimeMode ? 'Realtime enabled' : 'One-shot scan'}
									</span>
									<span className="rounded-full border border-amber-400/15 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
										{remainingCalories.toLocaleString()} kcal left
									</span>
								</div>
							</div>

							<div className="mx-auto">
								<GoalRing current={totalCalories} goal={calorieGoal} />
							</div>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
						<StatTile label="Goal progress" value={`${calorieProgress}%`} accent={ACCENT.calories} detail={`Target: ${calorieGoal.toLocaleString()} kcal`} />
						<StatTile label="Stream" value={streamConnected ? 'Online' : 'Off'} accent={ACCENT.success} detail={realtimeMode ? 'Low-latency mode active' : 'Manual capture mode'} />
						<StatTile label="Mood" value={cameraActive ? 'Scanning' : 'Ready'} accent={ACCENT.cyan} detail="One-hand mobile controls" />
					</div>
				</section>

				<section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="rounded-[2rem] border border-white/10 bg-[#0b0d12]/92 p-4 shadow-2xl shadow-black/25 sm:p-5">
						<SectionLabel
							title="Capture"
							caption="Start the camera, upload a meal photo, or switch on realtime stream for lower latency detection."
						/>

						{!cameraActive ? (
							<div className="grid gap-3 sm:grid-cols-2">
								<button
									onClick={startCamera}
									className="rounded-[1.5rem] border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-blue-600 p-5 text-left shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
								>
									<p className="text-xs font-semibold text-white/80">Step 1</p>
									<p className="mt-1 text-xl font-black tracking-tight text-white">Open camera</p>
									<p className="mt-2 text-sm text-white/70">Use your back camera for the cleanest food detection shot.</p>
								</button>

								<button
									onClick={() => fileInputRef.current?.click()}
									className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/8"
								>
									<p className="text-xs font-semibold text-zinc-400">Step 2</p>
									<p className="mt-1 text-xl font-black tracking-tight text-white">Upload photo</p>
									<p className="mt-2 text-sm text-zinc-400">Fast path for images already saved in your gallery.</p>
								</button>
							</div>
						) : (
							<div className="space-y-4">
								<div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black shadow-2xl shadow-black/40" style={{ aspectRatio: '16/11' }}>
									<video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />

									<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.28))]" />

									<div className="absolute left-4 top-4 flex gap-2">
										<span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">Camera on</span>
										{streamConnected ? (
											<span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200 backdrop-blur">Live stream</span>
										) : (
											<span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur">Connecting...</span>
										)}
									</div>

									{boxes.length > 0 && (
										<div className="pointer-events-none absolute inset-0">
											{boxes.map((box, index) => (
												<div key={index} className="absolute" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}>
													<div
														className="absolute inset-0 rounded-2xl border-2"
														style={{ borderColor: ACCENT.cyan, boxShadow: '0 0 0 1px rgba(34,211,238,0.25), 0 0 24px rgba(34,211,238,0.20)' }}
													/>
													<div className="absolute -top-8 left-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-[#04111a] shadow-lg" style={{ background: ACCENT.cyan }}>
														{box.label} {Math.round(box.conf * 100)}%
													</div>
												</div>
											))}
										</div>
									)}

									<canvas ref={canvasRef} className="hidden" />
								</div>

								<div className="grid gap-3 sm:grid-cols-[1fr_auto]">
									<button
										onClick={captureAndDetect}
										disabled={loading || !videoReady}
										className="rounded-[1.4rem] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-5 py-4 text-sm font-black tracking-wide text-[#061018] shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{loading ? 'Analyzing frame...' : !videoReady ? 'Preparing camera...' : 'Capture & detect'}
									</button>

									<button
										onClick={stopCamera}
										className="rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
									>
										Stop camera
									</button>
								</div>
								<label className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3">
									<div>
										<p className="text-sm font-semibold text-white">Realtime detection</p>
										<p className="text-xs text-zinc-400">Lower latency streaming over WebSocket.</p>
									</div>
									<input
										type="checkbox"
										className="h-5 w-5 rounded border-zinc-500 bg-zinc-900 text-cyan-400"
											disabled={!videoReady}
										checked={realtimeMode}
										onChange={(event) => {
											const on = event.target.checked
											setRealtimeMode(on)
											if (on) startStream()
											else stopStream()
										}}
									/>
								</label>
									{!videoReady ? <p className="text-xs text-amber-300/80">Waiting for camera to warm up...</p> : null}
							</div>
						)}

						<div className="mt-4 grid gap-3 sm:grid-cols-3">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">Camera</p>
								<p className="mt-1 text-base font-black text-white">{cameraActive ? 'Active' : 'Stopped'}</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">Stream</p>
								<p className="mt-1 text-base font-black text-white">{streamConnected ? 'Connected' : 'Waiting'}</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								<p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">Mode</p>
								<p className="mt-1 text-base font-black text-white">{realtimeMode ? 'Realtime' : 'Manual'}</p>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						<div className="rounded-[2rem] border border-white/10 bg-[#0b0d12]/92 p-5 shadow-2xl shadow-black/25">
							<SectionLabel title="Detection" caption="Latest scan results and macro breakdown." />

							{detectionResult ? (
								detectionResult.status === 'success' ? (
									<div className="space-y-4">
										<div className="flex items-start justify-between gap-4">
											<div>
												<p className="text-[10px] uppercase tracking-[0.35em] text-emerald-300/80">Detected food</p>
												<p className="mt-2 text-2xl font-black tracking-tight text-white">{detectionResult.food_name}</p>
												<p className="mt-1 text-sm text-zinc-400">Confidence {Math.round((detectionResult.confidence || 0) * 100)}%</p>
											</div>
											<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-xl text-emerald-300">✓</div>
										</div>

										<div className="grid grid-cols-2 gap-3">
											<MacroPill label="Calories" value={detectionResult.calories ?? 0} unit="kcal" accent={ACCENT.calories} />
											<MacroPill label="Protein" value={detectionResult.protein ?? 0} accent={ACCENT.protein} />
											<MacroPill label="Carbs" value={detectionResult.carbs ?? 0} accent={ACCENT.carbs} />
											<MacroPill label="Fat" value={detectionResult.fat ?? 0} accent={ACCENT.fat} />
										</div>

										<button
											onClick={addToLog}
											className="w-full rounded-[1.4rem] bg-gradient-to-r from-emerald-400 to-green-500 px-5 py-4 text-sm font-black tracking-wide text-[#061018] shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
										>
											Add to daily log
										</button>
									</div>
								) : (
									<div className="rounded-[1.4rem] border border-rose-400/20 bg-rose-500/10 p-4">
										<p className="text-sm font-bold text-rose-200">Detection failed</p>
										<p className="mt-1 text-sm text-rose-100/70">{detectionResult.error}</p>
										<button
											onClick={() => setDetectionResult(null)}
											className="mt-4 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200"
										>
											Try again
										</button>
									</div>
								)
							) : (
								<div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5 text-sm text-zinc-400">
									The latest scan will appear here with calories, protein, carbs, and fat.
								</div>
							)}
						</div>

						<div className="rounded-[2rem] border border-white/10 bg-[#0b0d12]/92 p-5 shadow-2xl shadow-black/25">
							<div className="flex items-center justify-between gap-4">
								<SectionLabel title="Daily log" caption="Saved detections for the current day." />
								<div className="text-right">
									<p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">Remaining</p>
									<p className="text-sm font-black text-white">{remainingCalories.toLocaleString()} kcal</p>
								</div>
							</div>

							<div className="grid gap-3 sm:grid-cols-3">
								<StatTile label="Protein" value={`${macroTotals.protein}g`} accent={ACCENT.protein} />
								<StatTile label="Carbs" value={`${macroTotals.carbs}g`} accent={ACCENT.carbs} />
								<StatTile label="Fat" value={`${macroTotals.fat}g`} accent={ACCENT.fat} />
							</div>

							<div className="mt-4 space-y-3">
								<MacroBar label="Protein" value={macroTotals.protein} max={150} accent={ACCENT.protein} />
								<MacroBar label="Carbs" value={macroTotals.carbs} max={300} accent={ACCENT.carbs} />
								<MacroBar label="Fat" value={macroTotals.fat} max={80} accent={ACCENT.fat} />
							</div>

							<div className="mt-5 flex flex-wrap items-center gap-2">
								{editingGoal ? (
									<div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
										<input
											value={goalDraft}
											onChange={(event) => setGoalDraft(event.target.value)}
											onKeyDown={(event) => event.key === 'Enter' && saveGoal()}
											type="number"
											className="w-24 bg-transparent text-sm font-bold text-white outline-none"
										/>
										<button onClick={saveGoal} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#061018]">
											Save goal
										</button>
									</div>
								) : (
									<button
										onClick={() => {
											setGoalDraft(String(calorieGoal))
											setEditingGoal(true)
										}}
										className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
									>
										Edit goal: {calorieGoal.toLocaleString()} kcal
									</button>
								)}

								<button
									onClick={stopCamera}
									className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
								>
									Reset camera
								</button>
							</div>

							{dailyLogs.length > 0 ? (
								<div className="mt-5 space-y-2">
									{dailyLogs.map((entry) => (
										<div key={entry.id} className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3">
											<div className="h-2.5 w-2.5 rounded-full" style={{ background: ACCENT.calories }} />
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-bold text-white">{entry.food}</p>
												<p className="text-xs text-zinc-500">{entry.time}</p>
											</div>
											<div className="text-right">
												<p className="text-sm font-black" style={{ color: ACCENT.calories }}>
													{entry.calories}
												</p>
												<p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">kcal</p>
											</div>
											<button
												onClick={() => deleteLog(entry.id)}
												className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/10 hover:text-white"
											>
												Remove
											</button>
										</div>
									))}
								</div>
							) : (
								<div className="mt-5 rounded-[1.4rem] border border-dashed border-white/10 bg-white/5 p-5 text-sm text-zinc-500">
									No meals logged yet. Scan food to build your daily history.
								</div>
							)}
						</div>
					</div>
				</section>

				<canvas ref={canvasRef} className="hidden" />
			</main>
		</div>
	)
}
