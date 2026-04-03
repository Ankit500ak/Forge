'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'
import RankBadge from '@/components/rank-badge'
import apiClient from '@/lib/api-client'

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

export default function RankingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState<'global' | 'strength' | 'speed' | 'endurance' | 'agility' | 'power' | 'recovery'>('global')
  const [rankings, setRankings] = useState<RankerUser[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<RankerUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
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

  if (!user) {
    return null
  }

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'S': 'from-red-600 to-red-700',
      'S+': 'from-red-500 to-red-600',
      'S++': 'from-red-500 to-pink-600',
      'SS': 'from-red-500 to-pink-500',
      'SS+': 'from-pink-500 to-pink-600',
      'Monarch': 'from-yellow-500 to-orange-600',
      'A': 'from-orange-500 to-orange-600',
      'A+': 'from-orange-400 to-orange-500',
      'B': 'from-blue-500 to-blue-600',
      'B+': 'from-blue-400 to-blue-500',
      'B++': 'from-blue-400 to-cyan-500',
      'C': 'from-purple-500 to-purple-600',
      'C+': 'from-purple-400 to-purple-500',
      'D': 'from-green-500 to-green-600',
      'D+': 'from-green-400 to-green-500',
      'E': 'from-gray-500 to-gray-600',
      'F': 'from-slate-500 to-slate-600',
    }
    return colors[rank] || 'from-gray-500 to-gray-600'
  }

  const getStatValue = (ranker: RankerUser) => {
    if (filter === 'global') return ranker.totalXP
    return ranker[filter as keyof RankerUser] || 0
  }

  const getStatLabel = () => {
    const labels: Record<string, string> = {
      global: 'XP',
      strength: 'STR',
      speed: 'SPD',
      endurance: 'END',
      agility: 'AGI',
      power: 'PWR',
      recovery: 'REC',
    }
    return labels[filter] || 'XP'
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

        {error && (
          <div className="m-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-orange-500 mb-2">Global Rankings</h1>
            <p className="text-muted-foreground">See where you stand among the forged warriors</p>
          </div>

          {/* User Position Card */}
          {currentUserRank && (
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
                      <span className="text-muted-foreground">
                        {filter === 'global' ? 'XP' : getStatLabel()}{' '}
                      </span>
                      <span className="font-bold text-yellow-400">
                        {typeof getStatValue(currentUserRank) === 'number'
                          ? getStatValue(currentUserRank).toLocaleString()
                          : 0}
                      </span>
                    </div>
                  </div>
                </div>
                <RankBadge rank={currentUserRank.userRank} size="lg" />
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {(['global', 'strength', 'speed', 'endurance', 'agility', 'power', 'recovery'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === filterOption
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-card border border-orange-500/30 text-muted-foreground hover:text-foreground'
                  }`}
              >
                {filterOption === 'global' && 'Global Ranking'}
                {filterOption === 'strength' && 'Strength'}
                {filterOption === 'speed' && 'Speed'}
                {filterOption === 'endurance' && 'Endurance'}
                {filterOption === 'agility' && 'Agility'}
                {filterOption === 'power' && 'Power'}
                {filterOption === 'recovery' && 'Recovery'}
              </button>
            ))}
          </div>

          {/* Rankings Table */}
          <div className="bg-card border border-orange-500/50 rounded-lg overflow-hidden shadow-lg shadow-orange-500/20">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading leaderboard...</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-orange-500/5">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Warrior</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Tier</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Level</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">
                        {filter === 'global' ? 'XP' : getStatLabel().toUpperCase()}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.slice(0, 50).map((ranker, idx) => {
                      const isCurrent = ranker.id === user.id
                      return (
                        <tr
                          key={ranker.id}
                          className={`border-b border-border transition-colors ${isCurrent
                            ? 'bg-orange-500/10 border-orange-500/30'
                            : idx < 3
                              ? 'hover:bg-orange-500/5'
                              : 'hover:bg-orange-500/5'
                            }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx === 0
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
                              {isCurrent && (
                                <span className="text-xs font-bold text-orange-400 bg-orange-500/20 px-2 py-1 rounded">
                                  YOU
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-foreground">{ranker.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{getStatValue(ranker).toLocaleString()} {getStatLabel()}</p>
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
                            <span className="font-bold text-orange-400">{getStatValue(ranker).toLocaleString()}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
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
              <h3 className="font-bold text-purple-400 mb-4">⚡ Your Statistics</h3>
              <div className="space-y-3">
                {currentUserRank && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-muted-foreground">Rank Position</span>
                        <span className="text-purple-400 font-bold">#{currentUserRank.rank}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-muted-foreground">Level</span>
                        <span className="text-green-400 font-bold">{currentUserRank.level}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="text-muted-foreground">Total XP</span>
                        <span className="text-blue-400 font-bold">{currentUserRank.totalXP.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
