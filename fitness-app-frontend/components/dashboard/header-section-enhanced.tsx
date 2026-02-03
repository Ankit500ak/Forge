'use client'

import { useRankTheme } from '@/lib/rank-theme-context'

interface HeaderSectionProps {
  userName: string
  rank: string
  level: number
  statPoints: number
  xpToday: number
  totalXp: number
}

export function HeaderSectionEnhanced({
  userName,
  rank,
  level,
  statPoints,
  xpToday,
  totalXp,
}: HeaderSectionProps) {
  const { theme } = useRankTheme()

  const getThemeAccentColor = () => {
    return theme.accent.main
  }

  const getThemeBorderColor = () => {
    return theme.borderColor
  }

  return (
    <div
      className={`sticky top-0 z-10 bg-gradient-to-b from-card/95 via-card/90 to-card/70 border-b transition-all duration-300`}
      style={{
        borderBottomColor: `rgb(var(--color-${theme.accent.main}) / 0.5)`,
      }}
    >
      <div className="px-3 sm:px-4 pt-4 pb-3 space-y-3">
        {/* Welcome Header */}
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold bg-clip-text bg-gradient-to-r text-transparent`}
            style={{
              backgroundImage: `linear-gradient(to right, rgb(var(--color-${theme.accent.light})), rgb(var(--color-${theme.accent.main})))`,
            }}
          >
            {`${theme.emoji} Welcome, ${userName}`}
          </h1>
          <p className="text-muted-foreground text-xs mt-1">{theme.description}</p>
        </div>

        {/* Rank Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Rank Badge */}
          <div
            className={`bg-gradient-to-br ${theme.badgeGradient} rounded-lg p-2 sm:p-3 border-2 ${theme.borderColor} shadow-lg transition-transform hover:scale-105`}
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{rank}</div>
              <p className="text-xs text-white/80 font-semibold">Rank</p>
            </div>
          </div>

          {/* Level Badge */}
          <div className={`bg-gradient-to-br ${theme.badgeGradient} rounded-lg p-2 sm:p-3 border-2 ${theme.borderColor} shadow-lg transition-transform hover:scale-105`}>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{level}</div>
              <p className="text-xs text-white/80 font-semibold">Level</p>
            </div>
          </div>

          {/* Stat Points Badge - Hidden on mobile */}
          <div className={`hidden sm:flex flex-col bg-gradient-to-br ${theme.badgeGradient} rounded-lg p-3 border-2 ${theme.borderColor} shadow-lg transition-transform hover:scale-105`}>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{statPoints}</div>
              <p className="text-xs text-white/80 font-semibold">Points</p>
            </div>
          </div>

          {/* XP Gained Today */}
          <div className={`bg-gradient-to-br ${theme.badgeGradient} rounded-lg p-2 sm:p-3 border-2 ${theme.borderColor} shadow-lg transition-transform hover:scale-105`}>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">+{xpToday}</div>
              <p className="text-xs text-white/80 font-semibold">Today</p>
            </div>
          </div>
        </div>

        {/* Total XP Display */}
        <div
          className={`bg-gradient-to-r border rounded-lg p-2.5 sm:p-3 transition-all duration-300`}
          style={{
            backgroundImage: `linear-gradient(to right, rgb(var(--color-${theme.accent.main}) / 0.15), rgb(var(--color-${theme.accent.main}) / 0.1))`,
            borderColor: `rgb(var(--color-${theme.accent.main}) / 0.5)`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Total XP Earned</p>
              <p className={`text-base sm:text-lg font-bold`} style={{ color: `rgb(var(--color-${theme.accent.light}))` }}>
                {(totalXp / 1000).toFixed(1)}k XP
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">All Time</p>
              <p className="text-xs sm:text-sm font-semibold" style={{ color: `rgb(var(--color-${theme.accent.main}))` }}>
                {theme.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { HeaderSectionEnhanced as HeaderSection }
