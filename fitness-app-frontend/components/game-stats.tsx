"use client"

import React, { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Progression {
  user_id: string
  level: number
  stat_points: number
  xp_today: number
  rank: string
  total_xp: number
  next_level_percent: number
}

interface RankTheme {
  name: string
  title: string
  subtitle: string
  minXP: number
  maxXP: number
  colors: {
    primary: string
    secondary: string
    gradient: string
    accentFrom: string
    accentTo: string
    shadow: string
    border: string
    bgPattern: string
    textGlow: string
  }
  effects: {
    particle: string
    glowIntensity: number
    pulseSpeed: string
    rotationSpeed: string
    hasAura: boolean
  }
}

// ============================================================================
// SOLO LEVELING RANK SYSTEM
// ============================================================================

const RANK_THEMES: Record<string, RankTheme> = {
  F: {
    name: 'F',
    title: 'Beginner',
    subtitle: 'Weakest Hunter',
    minXP: 0,
    maxXP: 39999,
    colors: {
      primary: '#4a4a4a',
      secondary: '#6b6b6b',
      gradient: 'from-gray-600 via-gray-500 to-gray-700',
      accentFrom: 'from-gray-500',
      accentTo: 'to-gray-700',
      shadow: 'shadow-gray-500/40',
      border: 'border-gray-500/30',
      bgPattern: 'from-gray-800/30',
      textGlow: 'drop-shadow-[0_0_8px_rgba(100,100,100,0.8)]',
    },
    effects: {
      particle: '💀',
      glowIntensity: 0.3,
      pulseSpeed: '4s',
      rotationSpeed: '20s',
      hasAura: false,
    },
  },
  E: {
    name: 'E',
    title: 'Novice Hunter',
    subtitle: 'Gaining Strength',
    minXP: 40000,
    maxXP: 199999,
    colors: {
      primary: '#cd7f32',
      secondary: '#b8860b',
      gradient: 'from-amber-700 via-orange-600 to-amber-800',
      accentFrom: 'from-amber-600',
      accentTo: 'to-orange-800',
      shadow: 'shadow-amber-600/50',
      border: 'border-amber-500/40',
      bgPattern: 'from-amber-900/30',
      textGlow: 'drop-shadow-[0_0_10px_rgba(205,127,50,0.9)]',
    },
    effects: {
      particle: '⚔️',
      glowIntensity: 0.4,
      pulseSpeed: '3.5s',
      rotationSpeed: '18s',
      hasAura: false,
    },
  },
  D: {
    name: 'D',
    title: 'Common Hunter',
    subtitle: 'Rising Power',
    minXP: 200000,
    maxXP: 599999,
    colors: {
      primary: '#c0c0c0',
      secondary: '#a8a8a8',
      gradient: 'from-slate-400 via-gray-300 to-slate-500',
      accentFrom: 'from-slate-400',
      accentTo: 'to-gray-600',
      shadow: 'shadow-slate-400/60',
      border: 'border-slate-400/50',
      bgPattern: 'from-slate-800/30',
      textGlow: 'drop-shadow-[0_0_12px_rgba(192,192,192,1)]',
    },
    effects: {
      particle: '🗡️',
      glowIntensity: 0.5,
      pulseSpeed: '3s',
      rotationSpeed: '16s',
      hasAura: true,
    },
  },
  C: {
    name: 'C',
    title: 'Skilled Hunter',
    subtitle: 'Proven Warrior',
    minXP: 600000,
    maxXP: 1199999,
    colors: {
      primary: '#ffd700',
      secondary: '#ffed4e',
      gradient: 'from-yellow-500 via-amber-400 to-yellow-600',
      accentFrom: 'from-yellow-400',
      accentTo: 'to-amber-600',
      shadow: 'shadow-yellow-500/70',
      border: 'border-yellow-400/60',
      bgPattern: 'from-yellow-900/40',
      textGlow: 'drop-shadow-[0_0_14px_rgba(255,215,0,1)]',
    },
    effects: {
      particle: '⚡',
      glowIntensity: 0.6,
      pulseSpeed: '2.5s',
      rotationSpeed: '14s',
      hasAura: true,
    },
  },
  B: {
    name: 'B',
    title: 'Elite Hunter',
    subtitle: 'Exceptional Power',
    minXP: 1200000,
    maxXP: 2999999,
    colors: {
      primary: '#4169e1',
      secondary: '#1e90ff',
      gradient: 'from-blue-500 via-cyan-400 to-blue-600',
      accentFrom: 'from-blue-400',
      accentTo: 'to-cyan-600',
      shadow: 'shadow-blue-500/80',
      border: 'border-blue-400/70',
      bgPattern: 'from-blue-900/40',
      textGlow: 'drop-shadow-[0_0_16px_rgba(65,105,225,1)]',
    },
    effects: {
      particle: '💎',
      glowIntensity: 0.7,
      pulseSpeed: '2s',
      rotationSpeed: '12s',
      hasAura: true,
    },
  },
  A: {
    name: 'A',
    title: 'High Ranker',
    subtitle: 'Supreme Hunter',
    minXP: 3000000,
    maxXP: 5999999,
    colors: {
      primary: '#9370db',
      secondary: '#ba55d3',
      gradient: 'from-purple-500 via-violet-400 to-purple-600',
      accentFrom: 'from-purple-400',
      accentTo: 'to-violet-600',
      shadow: 'shadow-purple-500/90',
      border: 'border-purple-400/80',
      bgPattern: 'from-purple-900/50',
      textGlow: 'drop-shadow-[0_0_18px_rgba(147,112,219,1)]',
    },
    effects: {
      particle: '👑',
      glowIntensity: 0.8,
      pulseSpeed: '1.8s',
      rotationSpeed: '10s',
      hasAura: true,
    },
  },
  'A+': {
    name: 'A+',
    title: 'Supreme Master',
    subtitle: 'Legendary Power',
    minXP: 6000000,
    maxXP: 11999999,
    colors: {
      primary: '#ff1493',
      secondary: '#ff69b4',
      gradient: 'from-pink-500 via-rose-400 to-red-500',
      accentFrom: 'from-pink-400',
      accentTo: 'to-red-600',
      shadow: 'shadow-pink-500/100',
      border: 'border-pink-400/90',
      bgPattern: 'from-pink-900/60',
      textGlow: 'drop-shadow-[0_0_20px_rgba(255,20,147,1)]',
    },
    effects: {
      particle: '🌟',
      glowIntensity: 0.9,
      pulseSpeed: '1.5s',
      rotationSpeed: '8s',
      hasAura: true,
    },
  },
  S: {
    name: 'S',
    title: 'National Level',
    subtitle: 'Legendary Warrior',
    minXP: 12000000,
    maxXP: 23999999,
    colors: {
      primary: '#ff4500',
      secondary: '#ff6347',
      gradient: 'from-orange-500 via-red-500 to-pink-600',
      accentFrom: 'from-orange-400',
      accentTo: 'to-pink-600',
      shadow: 'shadow-orange-500/100',
      border: 'border-orange-400/100',
      bgPattern: 'from-orange-900/70',
      textGlow: 'drop-shadow-[0_0_22px_rgba(255,69,0,1)]',
    },
    effects: {
      particle: '👁️',
      glowIntensity: 1.2,
      pulseSpeed: '0.8s',
      rotationSpeed: '5s',
      hasAura: true,
    },
  },
  'S+': {
    name: 'S+',
    title: 'Transcendent',
    subtitle: 'Beyond Legend',
    minXP: 24000000,
    maxXP: 49999999,
    colors: {
      primary: '#0891b2',
      secondary: '#0ea5b7',
      gradient: 'from-cyan-400 via-sky-400 to-indigo-400',
      accentFrom: 'from-cyan-400',
      accentTo: 'to-indigo-500',
      shadow: 'shadow-cyan-400/100',
      border: 'border-cyan-300/80',
      bgPattern: 'from-cyan-900/40',
      textGlow: 'drop-shadow-[0_0_18px_rgba(14,165,233,0.9)]',
    },
    effects: {
      particle: '✨',
      glowIntensity: 1.0,
      pulseSpeed: '1.2s',
      rotationSpeed: '4s',
      hasAura: true,
    },
  },
  'SS+': {
    name: 'SS+',
    title: 'Divine Being',
    subtitle: 'Legendary Supreme',
    minXP: 50000000,
    maxXP: Infinity,
    colors: {
      primary: '#f59e0b',
      secondary: '#f97316',
      gradient: 'from-yellow-300 via-amber-400 to-orange-500',
      accentFrom: 'from-yellow-300',
      accentTo: 'to-orange-500',
      shadow: 'shadow-yellow-300/100',
      border: 'border-yellow-200/90',
      bgPattern: 'from-yellow-800/60',
      textGlow: 'drop-shadow-[0_0_22px_rgba(245,158,11,0.95)]',
    },
    effects: {
      particle: '🌞',
      glowIntensity: 1.0,
      pulseSpeed: '1s',
      rotationSpeed: '3s',
      hasAura: true,
    },
  },
}

const RANK_ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'A+', 'S', 'S+', 'SS+']

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateRankFromXP(totalXP: number): string {
  for (const rankName of RANK_ORDER) {
    const theme = RANK_THEMES[rankName]
    if (totalXP >= theme.minXP && totalXP <= theme.maxXP) {
      return rankName
    }
  }
  return 'SSS'
}

function getRankTheme(rankName: string): RankTheme {
  return RANK_THEMES[rankName] || RANK_THEMES['F']
}

function getRankTierIndex(rankName: string): number {
  return RANK_ORDER.indexOf(rankName)
}

// ============================================================================
// COMPONENT: StatCard
// ============================================================================

interface StatCardProps {
  label: string
  value: string
  icon?: string
  theme: RankTheme
}

function StatCard({ label, value, icon, theme }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm">
      {/* Hover glow effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
        style={{
          background: `radial-gradient(circle at center, ${theme.colors.primary}20 0%, transparent 70%)`
        }}
      />
      
      {/* Content */}
      <div className="relative p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          {icon && (
            <div className="text-xl sm:text-2xl filter drop-shadow-lg">
              {icon}
            </div>
          )}
          <div 
            className={`text-xs sm:text-[10px] font-black uppercase tracking-[0.15em] bg-gradient-to-r ${theme.colors.accentFrom} ${theme.colors.accentTo} bg-clip-text text-transparent`}
          >
            {label}
          </div>
        </div>
        <div 
          className={`text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-br ${theme.colors.gradient} bg-clip-text text-transparent ${theme.colors.textGlow}`}
        >
          {value}
        </div>
      </div>

      {/* Decorative corner accent */}
      <div 
        className="absolute top-0 right-0 w-16 h-16 opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${theme.colors.primary} 0%, transparent 70%)`
        }}
      />
    </div>
  )
}

// ============================================================================
// COMPONENT: SoloLevelingRankBadge
// ============================================================================

interface RankBadgeProps {
  theme: RankTheme
}

function SoloLevelingRankBadge({ theme }: RankBadgeProps) {
  // Map rank names to image filenames - Only 10 available ranks
  const getRankImagePath = (rankName: string): string => {
    const rankMap: Record<string, string> = {
      'F': 'F_rank',
      'E': 'E-rank',
      'D': 'D_rank',
      'C': 'C_rank',
      'B': 'B_rank',
      'A': 'A_rank',
      'A+': 'A+_rank',
      'S': 'S_rank',
      'S+': 'S+_rank',
      'SS+': 'SS+_rank',
    };
    const filename = rankMap[rankName] || 'F_rank';
    return `/ranks/${filename}.png`;
  };

  return (
    <div className="relative group flex-shrink-0">
      {/* Outer glow layers */}
      {theme.effects.hasAura && (
        <>
          <div
            className={`absolute -inset-8 sm:-inset-10 rounded-full bg-gradient-to-br ${theme.colors.gradient} blur-2xl opacity-0 group-hover:opacity-50 transition-all duration-500`}
            style={{ 
              opacity: theme.effects.glowIntensity * 0.3,
              animation: `pulse ${theme.effects.pulseSpeed} ease-in-out infinite`
            }}
          />
          <div
            className={`absolute -inset-5 sm:-inset-6 rounded-full bg-gradient-to-br ${theme.colors.gradient} blur-xl opacity-0 group-hover:opacity-60 transition-all duration-500`}
            style={{ 
              opacity: theme.effects.glowIntensity * 0.4,
              animation: `pulse ${theme.effects.pulseSpeed} ease-in-out infinite reverse`
            }}
          />
        </>
      )}

      {/* Rotating rings */}
      <div
        className="absolute -inset-3 sm:-inset-4 rounded-[32px] opacity-30"
        style={{ animation: `spin ${theme.effects.rotationSpeed} linear infinite` }}
      >
        <div className={`w-full h-full rounded-[32px] bg-gradient-to-br ${theme.colors.gradient} opacity-50`} />
      </div>

      <div
        className="absolute -inset-2 sm:-inset-3 rounded-[28px] opacity-20"
        style={{ animation: `spin ${theme.effects.rotationSpeed} linear infinite reverse` }}
      >
        <div className={`w-full h-full rounded-[28px] bg-gradient-to-tl ${theme.colors.gradient} opacity-70`} />
      </div>

      {/* Main badge - Image based */}
      <div
        className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-3xl sm:rounded-[2rem] transition-all duration-300 group-hover:scale-105 overflow-hidden"
      >
        {/* Lighting layer - Top left highlight */}
        <div 
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${theme.colors.primary}40 0%, transparent 70%)`,
            filter: 'blur(40px)',
            mixBlendMode: 'screen'
          }}
        />

        {/* Lighting layer - Bottom right accent */}
        <div 
          className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${theme.colors.secondary}30 0%, transparent 70%)`,
            filter: 'blur(40px)',
            mixBlendMode: 'multiply'
          }}
        />

        {/* Center lighting glow */}
        <div 
          className="absolute inset-0 rounded-3xl sm:rounded-[2rem] pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, ${theme.colors.primary}25 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, ${theme.colors.secondary}15 0%, transparent 50%)
            `,
            mixBlendMode: 'overlay'
          }}
        />

        {/* Rank Badge Image */}
        <img 
          src={getRankImagePath(theme.name)}
          alt={`${theme.name} Rank`}
          className="w-full h-full object-cover relative z-10"
          style={{
            filter: `brightness(1.1) contrast(1.15)`
          }}
          onError={(e) => {
            // Fallback if image doesn't exist
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Top glossy reflection */}
        <div 
          className="absolute top-0 left-0 right-0 h-1/3 rounded-t-3xl pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
            mixBlendMode: 'screen'
          }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENT: ProgressBar
// ============================================================================

interface ProgressBarProps {
  currentLevel: number
  nextLevelPercent: number
  theme: RankTheme
}

function ProgressBar({ currentLevel, nextLevelPercent, theme }: ProgressBarProps) {
  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm p-4 sm:p-5">
      {/* Accent glow */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${theme.colors.primary}40 0%, transparent 60%)`
        }}
      />

      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-lg sm:text-xl">⬆️</div>
            <div className="text-xs sm:text-sm font-black text-white/70 uppercase tracking-wider">
              Level Progress
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r ${theme.colors.accentFrom} ${theme.colors.accentTo} bg-clip-text text-transparent ${theme.colors.textGlow}`}
          >
            {nextLevelPercent}%
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-5 sm:h-6 rounded-full bg-black/60 overflow-hidden border-2 border-white/20 shadow-inner">
          {/* Background shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5" />
          
          {/* Fill */}
          <div
            className={`relative h-full rounded-full bg-gradient-to-r ${theme.colors.accentFrom} ${theme.colors.accentTo} transition-all duration-1000 ease-out overflow-hidden`}
            style={{ 
              width: `${nextLevelPercent}%`,
              boxShadow: `0 0 25px ${theme.colors.primary}80, inset 0 0 25px ${theme.colors.primary}40`
            }}
          >
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent animate-pulse" />
            
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              style={{ animation: 'shimmer 2.5s infinite' }}
            />
          </div>
        </div>

        {/* Level labels */}
        <div className="flex justify-between items-center text-[11px] sm:text-xs text-white/60 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span>Lvl {currentLevel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Lvl {currentLevel + 1}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENT: RankProgression
// ============================================================================

interface RankProgressionProps {
  currentRank: string
  theme: RankTheme
  totalXP: number
  rankMeta: any
}

function RankProgression({ currentRank, theme, totalXP, rankMeta }: RankProgressionProps) {
  const rankTierIndex = getRankTierIndex(currentRank)
  const nextRank = RANK_ORDER[rankTierIndex + 1]

  return (
    <div className="space-y-3">
      {/* XP Display */}
      <div className="flex items-center justify-between">
        <div className="text-xs sm:text-sm text-white/60 font-bold uppercase tracking-wider">
          Total Experience
        </div>
        <div className={`text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r ${theme.colors.accentFrom} ${theme.colors.accentTo} bg-clip-text text-transparent`}>
          {totalXP.toLocaleString()} XP
        </div>
      </div>

      {/* Rank progress bar */}
      <div className="space-y-2">
        <div className="flex gap-1">
          {RANK_ORDER.map((rank, index) => {
            const isActive = index <= rankTierIndex
            const isCurrent = index === rankTierIndex
            
            return (
              <div
                key={rank}
                className={`relative flex-1 h-2 sm:h-2.5 rounded-sm transition-all duration-500 overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-r ${theme.colors.accentFrom} ${theme.colors.accentTo}`
                    : 'bg-white/10'
                }`}
                style={isActive ? { 
                  boxShadow: `0 0 ${isCurrent ? 15 : 8}px ${theme.colors.primary}`,
                  transform: isCurrent ? 'scaleY(1.2)' : 'scaleY(1)'
                } : {}}
              >
                {isActive && (
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{ animation: 'shimmer 3s infinite' }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Next rank info */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs">
          <div className="text-white/50 font-bold uppercase tracking-wider">
            Current: {theme.title}
          </div>
          {nextRank && (
            <div className="text-right">
              <div className="text-white/70 font-bold uppercase tracking-wider">
                Next: {RANK_THEMES[nextRank].title}
              </div>
              {rankMeta && typeof rankMeta.percent_to_next !== 'undefined' && (
                <div className={`text-[11px] sm:text-xs font-black bg-gradient-to-r ${theme.colors.accentFrom} ${theme.colors.accentTo} bg-clip-text text-transparent`}>
                  {rankMeta.percent_to_next}% progress
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT: GameStats
// ============================================================================

export default function GameStats() {
  const [progression, setProgression] = useState<Progression | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rankMeta, setRankMeta] = useState<any | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)

  const fetchProgression = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get('/users/me/game')
      const data = response.data?.progression || null
      const metadata = response.data?.rankMetadata || null

      if (data) {
        const calculatedRank = metadata?.rank || calculateRankFromXP(data.total_xp || 0)

        setProgression({
          user_id: data.user_id,
          level: data.level,
          stat_points: data.stat_points,
          xp_today: data.xp_today || 0,
          rank: calculatedRank,
          total_xp: data.total_xp || 0,
          next_level_percent: Number(data.next_level_percent) || 0,
        })
        setRankMeta(metadata)
        
        // Fetch global rank
        try {
          const globalRankRes = await apiClient.get('/users/me/global-rank')
          if (globalRankRes.data) {
            setRankMeta((prev: any) => ({
              ...prev,
              globalRank: globalRankRes.data.userGlobalRank,
              totalPlayers: globalRankRes.data.totalPlayers,
              qualifiesForSPlus: globalRankRes.data.qualifiesForSPlus,
              qualifiesForSSPlus: globalRankRes.data.qualifiesForSSPlus,
            }))
          }
        } catch (e) {
          // ignore if not available
        }

        try {
          const userRes = await apiClient.get('/users/me')
          setUserName(userRes.data?.user?.name || null)
        } catch (e) {
          // ignore if not available
        }
      } else {
        setProgression(null)
        setRankMeta(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load game stats')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (action: () => Promise<any>) => {
    setIsActionLoading(true)
    setShowSuccessNotification(false)
    try {
      await action()
      await fetchProgression()
      setShowSuccessNotification(true)
      setTimeout(() => setShowSuccessNotification(false), 2000)
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setIsActionLoading(false)
    }
  }

  useEffect(() => {
    fetchProgression()
  }, [])

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-purple-500/20 bg-gradient-to-br from-slate-900 via-black to-slate-900 backdrop-blur-xl p-8 sm:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 animate-pulse" />
        <div className="relative flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-white/70 text-center text-sm sm:text-base font-bold uppercase tracking-wider">
            Analyzing Hunter Data...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950/30 via-black to-red-950/20 backdrop-blur-xl p-8 sm:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5" />
        <div className="relative text-center space-y-4">
          <div className="text-4xl sm:text-5xl">⚠️</div>
          <div className="space-y-2">
            <p className="text-red-400 font-bold text-sm sm:text-base uppercase tracking-wider">Connection Failed</p>
            <p className="text-red-300/70 text-xs sm:text-sm">{error}</p>
          </div>
          <button
            onClick={fetchProgression}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-black uppercase tracking-wider transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (!progression) {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-black to-slate-900 backdrop-blur-xl p-8 sm:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
        <div className="relative text-center space-y-3">
          <div className="text-5xl sm:text-6xl">🎮</div>
          <p className="text-white/60 text-sm sm:text-base font-bold uppercase tracking-wider">
            No Hunter Data Available
          </p>
        </div>
      </div>
    )
  }

  const displayedRank = rankMeta?.rank || progression.rank
  const rankTheme = getRankTheme(displayedRank)

  return (
    <>
      {/* Success notification */}
      {showSuccessNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm font-black shadow-2xl animate-bounce uppercase tracking-wider"
          style={{ boxShadow: '0 0 40px rgba(16,185,129,0.7)' }}
        >
          ✓ Power Gained!
        </div>
      )}

      <div 
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 bg-gradient-to-br from-slate-950 via-black to-slate-950 shadow-2xl"
        style={{ borderColor: `${rankTheme.colors.primary}40` }}
      >
        {/* Animated background gradients */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${rankTheme.colors.primary}30 0%, transparent 50%), 
                        radial-gradient(circle at 70% 80%, ${rankTheme.colors.secondary}20 0%, transparent 50%)`,
            animation: 'pulse 6s ease-in-out infinite'
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Scanline effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
            animation: 'scanline 8s linear infinite'
          }}
        />

        {/* Content */}
        <div className="relative p-5 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Rank Badge */}
            <SoloLevelingRankBadge theme={rankTheme} />

            {/* User Info */}
            <div className="flex-1 w-full space-y-4 text-center sm:text-left">
              {/* Name and Rank Badge */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                  {userName || 'Ankit Pal'}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                  <div 
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${rankTheme.colors.accentFrom} ${rankTheme.colors.accentTo} shadow-lg`}
                    style={{ boxShadow: `0 4px 20px ${rankTheme.colors.primary}40` }}
                  >
                    <span className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                      Rank {displayedRank}
                    </span>
                  </div>
                  <div className={`text-sm sm:text-base text-white/80 font-bold uppercase tracking-wide ${rankTheme.colors.textGlow}`}>
                    {rankTheme.subtitle}
                  </div>
                </div>
              </div>

              {/* Rank Progression */}
              <RankProgression 
                currentRank={displayedRank}
                theme={rankTheme}
                totalXP={progression.total_xp}
                rankMeta={rankMeta}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Level" value={String(progression.level)} icon="⬆️" theme={rankTheme} />
            <StatCard label="Daily XP" value={String(progression.xp_today)} icon="⚡" theme={rankTheme} />
            <StatCard label="Total XP" value={progression.total_xp.toLocaleString()} icon="💎" theme={rankTheme} />
            <StatCard label="Stat Points" value={String(progression.stat_points)} icon="⭐" theme={rankTheme} />
          </div>

          {/* Progress Bar */}
          <ProgressBar
            currentLevel={progression.level}
            nextLevelPercent={progression.next_level_percent}
            theme={rankTheme}
          />
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </>
  )
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

export async function simulateXPGain(xpAmount = 450) {
  return apiClient.post('/users/me/game/update', { xpGain: xpAmount, statPointsGain: 0 })
}

export async function triggerDayRollover() {
  return apiClient.post('/users/me/game/rollover')
}

export { calculateRankFromXP, getRankTheme, RANK_THEMES, RANK_ORDER }