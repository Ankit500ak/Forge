'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'
import RankBadge from '@/components/rank-badge'
import apiClient from '@/lib/api-client'
import { Trophy, Activity, Zap, Shield, Flame, Target, Star, HeartPulse } from 'lucide-react'

interface RankerUser {
  id: string
  rank: number
  name: string
  userRank: string
  level: number
  statPoints: number
  totalXP: number
  strength: number
  speed: number
  endurance: number
  agility: number
  power: number
  recovery: number
}

const FILTERS = [
  { id: 'global', label: 'Global XP', icon: Star, color: '#a78bfa' },
  { id: 'strength', label: 'Strength', icon: Target, color: '#f43f5e' },
  { id: 'speed', label: 'Speed', icon: Zap, color: '#eab308' },
  { id: 'endurance', label: 'Endurance', icon: Flame, color: '#3b82f6' },
  { id: 'agility', label: 'Agility', icon: Activity, color: '#22c55e' },
  { id: 'power', label: 'Power', icon: Shield, color: '#a855f7' },
  { id: 'recovery', label: 'Recovery', icon: HeartPulse, color: '#ec4899' }
] as const

export default function RankingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState<typeof FILTERS[number]['id']>('global')
  const [rankings, setRankings] = useState<RankerUser[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<RankerUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) router.push('/')
  }, [user, router])

  useEffect(() => {
    if (!user) return
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get('/ranks/leaderboard', {
          params: { type: filter }
        })
        setRankings(response.data.rankings || [])
        setCurrentUserRank(response.data.currentUserRank || null)
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [user, filter])

  if (!mounted || !user) return null

  const getStatValue = (ranker: RankerUser) => {
    if (filter === 'global') return ranker.totalXP
    return ranker[filter as keyof RankerUser] || 0
  }

  const activeFilterData = FILTERS.find(f => f.id === filter) || FILTERS[0]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen pb-28 text-white" style={{ background: '#0a0a10', fontFamily: "'DM Mono', monospace" }}>
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#fbbf2420', color: '#fbbf24' }}>
              <Trophy size={16} />
            </div>
            <div>
              <h1 className="text-xl font-black leading-none" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>Leaderboard</h1>
              <p className="text-[10px] text-zinc-500 mt-0.5 tracking-widest uppercase">Global Ranks</p>
            </div>
          </div>
        </header>

        <main className="px-4 pt-4 space-y-6">
          {error && (
             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400">
               {error}
             </div>
          )}

          {/* Current User Card */}
          {currentUserRank && (
            <div
              className="relative rounded-3xl p-5 overflow-hidden flex flex-col gap-4"
              style={{
                background: `linear-gradient(135deg, ${activeFilterData.color}20 0%, ${activeFilterData.color}05 100%)`,
                border: `1px solid ${activeFilterData.color}30`,
                boxShadow: `0 8px 32px ${activeFilterData.color}15, inset 0 1px 0 ${activeFilterData.color}20`,
              }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-40 mix-blend-screen" style={{ background: activeFilterData.color }} />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: `${activeFilterData.color}99` }}>Your Standing</p>
                  <p className="text-4xl font-black leading-none" style={{ fontFamily: "'Syne', sans-serif" }}>
                    <span style={{ color: `${activeFilterData.color}60` }}>#</span>{currentUserRank.rank}
                  </p>
                </div>
                <RankBadge rank={currentUserRank.userRank} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                 <div className="bg-[#00000040] rounded-xl p-3 border border-[#ffffff0a]">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Level</p>
                    <p className="text-lg font-bold" style={{ color: '#a78bfa' }}>{currentUserRank.level}</p>
                 </div>
                 <div className="bg-[#00000040] rounded-xl p-3 border border-[#ffffff0a]">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{activeFilterData.label}</p>
                    <p className="text-lg font-bold" style={{ color: activeFilterData.color }}>
                      {typeof getStatValue(currentUserRank) === 'number' ? getStatValue(currentUserRank).toLocaleString() : 0}
                    </p>
                 </div>
              </div>
            </div>
          )}

          {/* Filters (Horizontal Scroll) */}
          <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar -mx-4 px-4 snap-x">
            {FILTERS.map((f) => {
              const Icon = f.icon
              const isActive = filter === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: isActive ? `${f.color}25` : '#16161e',
                    border: `1px solid ${isActive ? `${f.color}50` : '#ffffff0a'}`,
                    color: isActive ? f.color : '#888',
                    boxShadow: isActive ? `0 0 20px ${f.color}20` : 'none'
                  }}
                >
                  <Icon size={14} strokeWidth={2.5} />
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Leaderboard List */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 mb-2 px-1">
               <div className="w-1 h-4 rounded-full" style={{ background: activeFilterData.color }} />
               <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Top {activeFilterData.label}</h2>
             </div>

             {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-[#ffffff10]" />
                    <div className="absolute inset-0 rounded-full border-t-2 animate-spin" style={{ borderColor: activeFilterData.color }} />
                  </div>
                  <p className="text-xs text-zinc-600 tracking-widest uppercase">Fetching Ranks...</p>
                </div>
             ) : (
                <div className="space-y-2">
                  {rankings.map((ranker, idx) => {
                    const isCurrent = ranker.id === user.id
                    const isFirst = idx === 0
                    const isSecond = idx === 1
                    const isThird = idx === 2
                    
                    let rankColor = '#444'
                    let rankBg = '#16161e'
                    if (isFirst) { rankColor = '#fbbf24'; rankBg = '#fbbf2415' }
                    else if (isSecond) { rankColor = '#94a3b8'; rankBg = '#94a3b815' }
                    else if (isThird) { rankColor = '#b45309'; rankBg = '#b4530915' }

                    return (
                      <div 
                        key={ranker.id}
                        className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                        style={{
                          background: isCurrent ? `${activeFilterData.color}15` : '#16161e',
                          border: `1px solid ${isCurrent ? `${activeFilterData.color}40` : '#ffffff06'}`,
                        }}
                      >
                        {/* Rank Badge */}
                        <div 
                          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-black"
                          style={{
                            background: rankBg, border: `1px solid ${rankColor}30`, color: rankColor,
                            fontFamily: "'Syne', sans-serif"
                          }}
                        >
                          {ranker.rank}
                        </div>

                        {/* Name & Tier */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold truncate text-zinc-200">
                              {ranker.name}
                            </p>
                            {isCurrent && <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase" style={{ background: activeFilterData.color, color: '#000' }}>You</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[10px] text-zinc-500">Lvl {ranker.level}</span>
                             <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-black/40 text-zinc-400 border border-white/5">{ranker.userRank}-Tier</span>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <p className="text-sm font-black tabular-nums" style={{ color: activeFilterData.color }}>
                            {typeof getStatValue(ranker) === 'number' ? getStatValue(ranker).toLocaleString() : 0}
                          </p>
                          <p className="text-[9px] text-zinc-600 uppercase tracking-widest">{activeFilterData.id === 'global' ? 'XP' : 'PTS'}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
             )}
          </div>
          
        </main>
      </div>
    </>
  )
}
