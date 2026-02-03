'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'
import RankBadge from '@/components/rank-badge' // Import RankBadge component

interface RankerUser {
  id: string
  rank: number
  name: string
  userRank: string
  level: number
  statPoints: number
  totalXP: number
  strength: number
  cardio: number
}

export default function RankingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState<'global' | 'strength' | 'cardio'>('global')

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  // Mock ranking data
  const mockRankings: Record<string, RankerUser[]> = {
    global: [
      { id: '1', rank: 1, name: 'ShadowHunter', userRank: 'S', level: 87, statPoints: 45000, totalXP: 125000, strength: 850, cardio: 920 },
      { id: '2', rank: 2, name: 'IronTitan', userRank: 'S', level: 85, statPoints: 42500, totalXP: 118000, strength: 920, cardio: 780 },
      { id: '3', rank: 3, name: 'PhoenixRising', userRank: 'A', level: 82, statPoints: 38000, totalXP: 110000, strength: 780, cardio: 950 },
      { id: '4', rank: 4, name: 'VortexBlaze', userRank: 'A', level: 79, statPoints: 35200, totalXP: 105000, strength: 680, cardio: 890 },
      { id: '5', rank: 5, name: 'CrimsonStrike', userRank: 'A', level: 78, statPoints: 34500, totalXP: 102500, strength: 750, cardio: 810 },
      { id: '6', rank: 6, name: 'ThunderForce', userRank: 'B', level: 74, statPoints: 30000, totalXP: 95000, strength: 620, cardio: 720 },
      { id: '7', rank: 7, name: 'EchoWind', userRank: 'B', level: 71, statPoints: 27500, totalXP: 88000, strength: 550, cardio: 850 },
      { id: '8', rank: 8, name: 'SilentBlade', userRank: 'B', level: 69, statPoints: 26000, totalXP: 85000, strength: 680, cardio: 620 },
      { id: 'current', rank: 42, name: user.name ?? 'Unknown', userRank: user.rank ?? 'F', level: user.level ?? 1, statPoints: user.statPoints ?? 0, totalXP: 15000, strength: 650, cardio: 580 },
    ],
    strength: [
      { id: '1', rank: 1, name: 'IronTitan', userRank: 'S', level: 85, statPoints: 42500, totalXP: 118000, strength: 920, cardio: 780 },
      { id: '2', rank: 2, name: 'CrimsonStrike', userRank: 'A', level: 78, statPoints: 34500, totalXP: 102500, strength: 750, cardio: 810 },
      { id: '3', rank: 3, name: 'VortexBlaze', userRank: 'A', level: 79, statPoints: 35200, totalXP: 105000, strength: 680, cardio: 890 },
      { id: '4', rank: 4, name: 'ShadowHunter', userRank: 'S', level: 87, statPoints: 45000, totalXP: 125000, strength: 850, cardio: 920 },
      { id: '5', rank: 5, name: 'SilentBlade', userRank: 'B', level: 69, statPoints: 26000, totalXP: 85000, strength: 680, cardio: 620 },
      { id: 'current-strength', rank: 28, name: user.name ?? 'Unknown', userRank: user.rank ?? 'F', level: user.level ?? 1, statPoints: user.statPoints ?? 0, totalXP: 15000, strength: 650, cardio: 580 },
    ],
    cardio: [
      { id: '1', rank: 1, name: 'PhoenixRising', userRank: 'A', level: 82, statPoints: 38000, totalXP: 110000, strength: 780, cardio: 950 },
      { id: '2', rank: 2, name: 'ShadowHunter', userRank: 'S', level: 87, statPoints: 45000, totalXP: 125000, strength: 850, cardio: 920 },
      { id: '3', rank: 3, name: 'EchoWind', userRank: 'B', level: 71, statPoints: 27500, totalXP: 88000, strength: 550, cardio: 850 },
      { id: '4', rank: 4, name: 'VortexBlaze', userRank: 'A', level: 79, statPoints: 35200, totalXP: 105000, strength: 680, cardio: 890 },
      { id: '5', rank: 5, name: 'IronTitan', userRank: 'S', level: 85, statPoints: 42500, totalXP: 118000, strength: 920, cardio: 780 },
      { id: 'current-cardio', rank: 35, name: user.name ?? 'Unknown', userRank: user.rank ?? 'F', level: user.level ?? 1, statPoints: user.statPoints ?? 0, totalXP: 15000, strength: 650, cardio: 580 },
    ],
  }

  const rankings = mockRankings[filter]
  const currentUserRank = rankings.find(r => r.id.includes('current')) || rankings[0]

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'S': 'from-red-600 to-red-700',
      'A': 'from-orange-500 to-orange-600',
      'B': 'from-blue-500 to-blue-600',
      'C': 'from-purple-500 to-purple-600',
      'D': 'from-green-500 to-green-600',
      'E': 'from-gray-500 to-gray-600',
      'F': 'from-slate-500 to-slate-600',
    }
    return colors[rank] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />
      <main className="overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-card/95 to-card/50 backdrop-blur-sm border-b-2 border-orange-600/50 p-4 z-10">
          <h1 className="text-2xl font-bold text-orange-500">Rankings</h1>
          <p className="text-muted-foreground text-xs mt-1">Global leaderboards</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-orange-500 mb-2">Global Rankings</h1>
            <p className="text-muted-foreground">See where you stand among the forged warriors</p>
          </div>

          {/* User Position Card */}
          <div className="mb-8 bg-gradient-to-r from-orange-600/20 to-purple-600/20 border border-orange-500/50 rounded-lg p-6 shadow-lg shadow-orange-500/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Your Current Rank</p>
                <h2 className="text-4xl font-bold text-orange-400 mb-2">#{currentUserRank.rank}</h2>
                <div className="flex items-center gap-4">
                  <div className="text-lg">
                    <span className="text-muted-foreground">Level </span>
                    <span className="font-bold text-purple-400">{currentUserRank.level}</span>
                  </div>
                  <div className="text-lg">
                    <span className="text-muted-foreground">Points </span>
                    <span className="font-bold text-yellow-400">{currentUserRank.statPoints}</span>
                  </div>
                </div>
              </div>
              <RankBadge rank={currentUserRank.userRank} size="lg" />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('global')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'global'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-card border border-orange-500/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              Global Ranking
            </button>
            <button
              onClick={() => setFilter('strength')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'strength'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-card border border-orange-500/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              Strength Leaderboard
            </button>
            <button
              onClick={() => setFilter('cardio')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'cardio'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-card border border-orange-500/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              Cardio Leaderboard
            </button>
          </div>

          {/* Rankings Table */}
          <div className="bg-card border border-orange-500/50 rounded-lg overflow-hidden shadow-lg shadow-orange-500/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-orange-500/5">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Warrior</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Tier</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Level</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Stat Points</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((ranker, idx) => {
                    const isCurrent = ranker.id.includes('current')
                    return (
                      <tr
                        key={ranker.id}
                        className={`border-b border-border transition-colors ${
                          isCurrent
                            ? 'bg-orange-500/10 border-orange-500/30'
                            : idx < 3
                              ? 'hover:bg-orange-500/5'
                              : 'hover:bg-orange-500/5'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                                idx === 0
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                  : idx === 1
                                    ? 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                                    : idx === 2
                                      ? 'bg-orange-700/30 text-orange-400 border border-orange-700/50'
                                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                              }`}
                            >
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ranker.rank}
                            </div>
                            {isCurrent && <span className="text-xs font-bold text-orange-400 bg-orange-500/20 px-2 py-1 rounded">YOU</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-foreground">{ranker.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {filter === 'strength' ? `${ranker.strength} STR` : filter === 'cardio' ? `${ranker.cardio} CAR` : `${ranker.totalXP} XP`}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getRankColor(ranker.userRank)}`}>
                            {ranker.userRank}-Tier
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-purple-400">Lvl {ranker.level}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-orange-400">{ranker.statPoints.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-muted-foreground">{(ranker.totalXP / 1000).toFixed(0)}k</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Progression Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-blue-500/50 rounded-lg p-6">
              <h3 className="font-bold text-blue-400 mb-4">📈 Rank Distribution</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">S-Tier</span>
                  <span className="text-red-400 font-bold">2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">A-Tier</span>
                  <span className="text-orange-400 font-bold">8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">B-Tier</span>
                  <span className="text-yellow-400 font-bold">20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">C-Tier</span>
                  <span className="text-green-400 font-bold">35%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">D-Tier</span>
                  <span className="text-blue-400 font-bold">25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-Tier & F</span>
                  <span className="text-purple-400 font-bold">10%</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-green-500/50 rounded-lg p-6">
              <h3 className="font-bold text-green-400 mb-4">🏆 Rank Thresholds</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">F → E</span>
                  <span className="font-bold">1,000 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E → D</span>
                  <span className="font-bold">5,000 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">D → C</span>
                  <span className="font-bold">15,000 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">C → B</span>
                  <span className="font-bold">35,000 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">B → A</span>
                  <span className="font-bold">70,000 XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">A → S</span>
                  <span className="font-bold">120,000 XP</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-purple-500/50 rounded-lg p-6">
              <h3 className="font-bold text-purple-400 mb-4">⚡ Your Goals</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="text-muted-foreground">Next Rank</span>
                    <span className="text-purple-400 font-bold">35,000 XP</span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: '43%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="text-muted-foreground">S-Tier</span>
                    <span className="text-red-400 font-bold">120,000 XP</span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700">
                    <div className="bg-red-600 h-full rounded-full" style={{ width: '12%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
