'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'
import apiClient from '@/lib/api-client'
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

// ── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-1"
      style={{
        background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
        border: `1px solid ${accent}30`,
        boxShadow: `0 0 32px ${accent}12, inset 0 1px 0 ${accent}20`,
      }}
    >
      {/* glow blob */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30"
        style={{ background: accent }}
      />
      <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: `${accent}99` }}>{label}</p>
      <p className="text-3xl font-black leading-none" style={{ color: accent, fontFamily: "'Syne', sans-serif" }}>{value}</p>
      <p className="text-[11px]" style={{ color: `${accent}70` }}>{sub}</p>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(160deg, #16161e 0%, #0f0f15 100%)',
        border: `1px solid ${accent}25`,
        boxShadow: `0 0 40px ${accent}0a`,
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full" style={{ background: accent }} />
        <h2
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: accent, fontFamily: "'Syne', sans-serif" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

// ── Attribute row ─────────────────────────────────────────────────────────────
function AttrRow({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, accent = '#a78bfa' }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs"
      style={{ background: '#1a1a24', border: `1px solid ${accent}40`, boxShadow: `0 8px 32px #00000060` }}
    >
      {label && <p className="text-zinc-400 mb-1 font-medium">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState<any>(null)
  const [gameStats, setGameStats] = useState<any>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalTasks, setTotalTasks] = useState(0)

  useEffect(() => {
    setMounted(true)
    if (!user) router.push('/')
  }, [user, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const [userRes, gameRes, tasksRes] = await Promise.all([
          apiClient.get('/users/me'),
          apiClient.get('/users/me/game'),
          apiClient.get('/tasks/today'),
        ])
        if (userRes.data?.user) setUserStats(userRes.data.user)
        if (gameRes.data) setGameStats(gameRes.data)
        if (tasksRes.data?.tasks) {
          const t = tasksRes.data.tasks
          setTotalTasks(t.length)
          setCompletedCount(t.filter((x: any) => x.completed).length)
        }
      } catch (e) {
        console.warn('Stats fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchStats()
  }, [user])

  if (!mounted || !user) return null

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a0a10' }}>
        <Navigation />
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
        </div>
        <p className="text-xs text-zinc-500 tracking-widest uppercase">Analyzing your progress…</p>
      </div>
    )
  }

  // ── Data ────────────────────────────────────────────────────────────────────
  const categoryStats = [
    { name: 'Strength', value: gameStats?.stats?.strength || 10, fill: '#60a5fa' },
    { name: 'Endurance', value: gameStats?.stats?.endurance || 10, fill: '#34d399' },
    { name: 'Speed', value: gameStats?.stats?.speed || 10, fill: '#a78bfa' },
    { name: 'Agility', value: gameStats?.stats?.agility || 10, fill: '#fbbf24' },
    { name: 'Power', value: gameStats?.stats?.power || 10, fill: '#fb923c' },
    { name: 'Recovery', value: gameStats?.stats?.recovery || 10, fill: '#f472b6' },
  ]

  const progressData = [
    { week: 'W1', xp: 450, completed: 10 },
    { week: 'W2', xp: 520, completed: 13 },
    { week: 'W3', xp: 480, completed: 10 },
    { week: 'W4', xp: 650, completed: 15 },
  ]

  const completionPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  const circumference = 2 * Math.PI * 42
  const dashOffset = circumference * (1 - completionPct / 100)

  const profileRows = [
    { label: 'Name', value: userStats?.name || 'User' },
    { label: 'Fitness Level', value: userStats?.fitness_level || 'Beginner' },
    { label: 'Age', value: userStats?.age || '—' },
    { label: 'Member Since', value: new Date(userStats?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
  ]

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div className="min-h-screen pb-28" style={{ background: '#0a0a10', fontFamily: "'DM Mono', monospace" }}>
        <Navigation />

        {/* ── Sticky header ── */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-5 py-4"
          style={{
            background: 'linear-gradient(180deg, #0a0a10f5 0%, #0a0a1080 100%)',
            borderBottom: '1px solid #ffffff0a',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div>
            <h1
              className="text-xl font-black text-white leading-none"
              style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}
            >
              Your Stats
            </h1>
            <p className="text-[10px] text-zinc-600 mt-0.5 tracking-widest uppercase">Fitness Progress</p>
          </div>
        </header>

        <main className="px-4 pt-4 space-y-4">

          {/* ── Key metrics ── */}
          <div className="grid grid-cols-2 gap-3">
            <StatPill label="Total XP" value={(gameStats?.progression?.total_xp || 0).toLocaleString()} sub="Experience points" accent="#a78bfa" />
            <StatPill label="Level" value={gameStats?.progression?.level || 1} sub={gameStats?.rankMetadata?.rank || 'Recruit'} accent="#60a5fa" />
            <StatPill label="Stat Pts" value={gameStats?.progression?.stat_points || 0} sub="Available points" accent="#fb923c" />
            <div
              className="relative rounded-2xl p-5 flex flex-col gap-1 items-start overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #34d39918 0%, #34d39908 100%)',
                border: '1px solid #34d39930',
                boxShadow: '0 0 32px #34d39912, inset 0 1px 0 #34d39920',
              }}
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30" style={{ background: '#34d399' }} />
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#34d39999' }}>Today</p>
              {/* Ring */}
              <div className="flex items-center gap-3 mt-1">
                <svg width="52" height="52" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#34d39915" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="42" fill="none" stroke="#34d399" strokeWidth="10"
                    strokeLinecap="round" strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                  <text x="50" y="55" textAnchor="middle" fill="#34d399" fontSize="22" fontWeight="900" fontFamily="Syne, sans-serif">{completionPct}</text>
                </svg>
                <div>
                  <p className="text-xs text-zinc-500">Exercises</p>
                  <p className="text-lg font-black leading-none" style={{ color: '#34d399', fontFamily: "'Syne', sans-serif" }}>{completedCount}<span className="text-zinc-600 font-normal text-sm">/{totalTasks}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Key Fitness Metrics ── */}
          <Section title="Key Metrics" accent="#a78bfa">
            {userStats ? (
              <div className="space-y-3">
                <AttrRow label="Tasks Completed" value={totalTasks ? totalTasks - completedCount : 0} max={totalTasks || 10} color="#f472b6" />
                <AttrRow label="Points Earned" value={gameStats?.progression?.total_xp || 0} max={(gameStats?.progression?.total_xp || 0) + 100} color="#60a5fa" />
                <AttrRow label="Level Progress" value={gameStats?.progression?.next_level_percent || 0} max={100} color="#34d399" />
                <AttrRow label="Rank Position" value={gameStats?.rankMetadata?.thresholds?.findIndex((r: any) => r.name === gameStats?.rankMetadata?.rank) || 0} max={gameStats?.rankMetadata?.thresholds?.length || 10} color="#fbbf24" />
              </div>
            ) : (
              <p className="text-zinc-600 text-xs text-center py-10">Start a workout to see your metrics</p>
            )}
          </Section>

          {/* ── Weekly Activity ── */}
          <Section title="Weekly Activity" accent="#60a5fa">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={progressData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff06" vertical={false} />
                <XAxis dataKey="week" stroke="none" tick={{ fill: '#555', fontSize: 11 }} />
                <YAxis stroke="none" tick={{ fill: '#444', fontSize: 10 }} />
                <Tooltip content={<ChartTooltip accent="#60a5fa" />} />
                <Line type="monotone" dataKey="xp" stroke="url(#xpGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }} name="Workouts" />
                <Line type="monotone" dataKey="completed" stroke="#34d399" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} name="Exercises" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <div className="w-5 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #60a5fa80, #a78bfa)' }} />
                Workouts
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <div className="w-5 h-0 border-t-2 border-dashed border-[#34d399]" />
                Exercises
              </div>
            </div>
          </Section>

          {/* ── Exercise Breakdown ── */}
          <Section title="Exercise Breakdown" accent="#f472b6">
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryStats.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip accent="#f472b6" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {categoryStats.map((c) => (
                  <div key={c.name}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-zinc-400">{c.name}</span>
                      <span className="font-bold" style={{ color: c.fill }}>{c.value}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.value}%`, background: c.fill }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Profile ── */}
          <Section title="Profile" accent="#fbbf24">
            <div className="space-y-0">
              {profileRows.map((r, i) => (
                <div
                  key={r.label}
                  className="flex justify-between items-center py-3"
                  style={{ borderBottom: i < profileRows.length - 1 ? '1px solid #ffffff06' : 'none' }}
                >
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{r.label}</span>
                  <span className="text-xs font-bold text-zinc-200 capitalize">{r.value}</span>
                </div>
              ))}
            </div>
          </Section>

        </main>
      </div>
    </>
  )
} 