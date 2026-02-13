'use client'

import { useRankTheme } from '@/lib/rank-theme-context'
import { WelcomeSection } from './welcome-section-compact'

interface HeaderProProps {
  userName: string
  rank: string
  level: number
  rankName: string
  totalXp: number
  weeklyXp: number
  nextRank: string
  nextRankName: string
  progressPercent: number
}

export function HeaderPro({
  userName,
  rank,
  level,
  rankName,
  totalXp,
  weeklyXp,
  nextRank,
  nextRankName,
  progressPercent,
}: HeaderProProps) {
  const { theme } = useRankTheme()

  return (
    <div className="relative">
      {/* Background Gradient Backdrop */}
      <div
        className="absolute inset-0 h-40 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at top center, rgb(var(--color-${theme.accent.main})), transparent)`,
        }}
      />

      {/* Welcome Section */}
      <WelcomeSection userName={userName} rank={rank} />

      {/* Stats Cards Section */}
      <div className="relative px-3 sm:px-4 py-6 space-y-6">
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Rank Card */}
          <div
            className="relative group overflow-hidden rounded-2xl border-2 p-4 sm:p-5 backdrop-blur-sm transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 transform"
            style={{
              backgroundColor: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.15), rgb(var(--color-${theme.accent.main}) / 0.05))`,
              borderColor: `rgb(var(--color-${theme.accent.main}) / 0.6)`,
              boxShadow: `0 0 30px rgb(var(--color-${theme.accent.main}) / 0.2), inset 0 0 20px rgb(var(--color-${theme.accent.main}) / 0.05)`,
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none" style={{
              backgroundImage: `linear-gradient(45deg, transparent 30%, white 50%, transparent 70%)`,
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s infinite',
            }} />

            <div className="relative z-10 text-center space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-widest">Rank</p>
              <div
                className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg"
                style={{ textShadow: `0 0 20px rgb(var(--color-${theme.accent.main}) / 0.5)` }}
              >
                {rank}
              </div>
              <p
                className="text-xs font-bold"
                style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
              >
                {rankName}
              </p>
            </div>

            <div
              className="absolute top-0 right-0 w-12 h-12 opacity-20 rounded-full"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}))`,
                filter: 'blur(8px)',
              }}
            />
          </div>

          {/* Level Card */}
          <div
            className="relative group overflow-hidden rounded-2xl border-2 p-4 sm:p-5 backdrop-blur-sm transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 transform"
            style={{
              backgroundColor: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.15), rgb(var(--color-${theme.accent.main}) / 0.05))`,
              borderColor: `rgb(var(--color-${theme.accent.main}) / 0.6)`,
              boxShadow: `0 0 30px rgb(var(--color-${theme.accent.main}) / 0.2), inset 0 0 20px rgb(var(--color-${theme.accent.main}) / 0.05)`,
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none" style={{
              backgroundImage: `linear-gradient(45deg, transparent 30%, white 50%, transparent 70%)`,
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s infinite',
            }} />

            <div className="relative z-10 text-center space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-widest">Level</p>
              <div
                className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg"
                style={{ textShadow: `0 0 20px rgb(var(--color-${theme.accent.main}) / 0.5)` }}
              >
                {level}
              </div>
              <p className="text-xs font-bold text-muted-foreground">Current</p>
            </div>

            <div
              className="absolute bottom-0 left-0 w-12 h-12 opacity-20 rounded-full"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}))`,
                filter: 'blur(8px)',
              }}
            />
          </div>

          {/* Weekly XP Card */}
          <div
            className="relative group overflow-hidden rounded-2xl border-2 p-4 sm:p-5 backdrop-blur-sm transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 transform"
            style={{
              backgroundColor: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.15), rgb(var(--color-${theme.accent.main}) / 0.05))`,
              borderColor: `rgb(var(--color-${theme.accent.main}) / 0.6)`,
              boxShadow: `0 0 30px rgb(var(--color-${theme.accent.main}) / 0.2), inset 0 0 20px rgb(var(--color-${theme.accent.main}) / 0.05)`,
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none" style={{
              backgroundImage: `linear-gradient(45deg, transparent 30%, white 50%, transparent 70%)`,
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s infinite',
            }} />

            <div className="relative z-10 text-center space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-widest">Weekly</p>
              <div
                className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg"
                style={{ textShadow: `0 0 20px rgb(var(--color-${theme.accent.main}) / 0.5)` }}
              >
                +{Math.round(weeklyXp)}
              </div>
              <p className="text-xs font-bold text-green-400">XP</p>
            </div>

            <div
              className="absolute top-0 left-0 w-12 h-12 opacity-20 rounded-full"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}))`,
                filter: 'blur(8px)',
              }}
            />
          </div>

          {/* Next Rank Card - Hidden on mobile */}
          <div
            className="hidden sm:flex relative group overflow-hidden rounded-2xl border-2 p-5 backdrop-blur-sm transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-105 transform flex-col justify-center"
            style={{
              backgroundColor: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.15), rgb(var(--color-${theme.accent.main}) / 0.05))`,
              borderColor: `rgb(var(--color-${theme.accent.main}) / 0.6)`,
              boxShadow: `0 0 30px rgb(var(--color-${theme.accent.main}) / 0.2), inset 0 0 20px rgb(var(--color-${theme.accent.main}) / 0.05)`,
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none" style={{
              backgroundImage: `linear-gradient(45deg, transparent 30%, white 50%, transparent 70%)`,
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s infinite',
            }} />

            <div className="relative z-10 text-center space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Next Rank</p>
              <div
                className="text-5xl font-black text-white drop-shadow-lg"
                style={{ textShadow: `0 0 20px rgb(var(--color-${theme.accent.main}) / 0.5)` }}
              >
                {nextRank}
              </div>
              <p className="text-xs font-bold text-blue-400">{nextRankName}</p>
            </div>

            <div
              className="absolute bottom-0 right-0 w-12 h-12 opacity-20 rounded-full"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}))`,
                filter: 'blur(8px)',
              }}
            />
          </div>
        </div>

        {/* Progress to Next Rank */}
        <div
          className="relative group overflow-hidden rounded-2xl border-2 p-5 sm:p-6 backdrop-blur-sm transition-all duration-300"
          style={{
            backgroundColor: `linear-gradient(90deg, rgb(var(--color-${theme.accent.main}) / 0.2), rgb(var(--color-${theme.accent.main}) / 0.08))`,
            borderColor: `rgb(var(--color-${theme.accent.main}) / 0.7)`,
            boxShadow: `0 0 40px rgb(var(--color-${theme.accent.main}) / 0.25), inset 0 0 30px rgb(var(--color-${theme.accent.main}) / 0.1)`,
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-semibold uppercase tracking-widest">
                  Progress to {nextRankName}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-lg sm:text-2xl font-black"
                  style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
                >
                  {Math.round(progressPercent)}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="relative h-3 rounded-full overflow-hidden"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.2)`,
                border: `1px solid rgb(var(--color-${theme.accent.main}) / 0.5)`,
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  backgroundImage: `linear-gradient(90deg, rgb(var(--color-${theme.accent.main})), rgb(var(--color-${theme.accent.light})))`,
                  boxShadow: `0 0 20px rgb(var(--color-${theme.accent.main}) / 0.6)`,
                }}
              />
            </div>

            {/* Total XP Display */}
            <div className="mt-4 flex items-baseline gap-2">
              <p className="text-muted-foreground text-sm">Total XP Earned:</p>
              <p
                className="text-2xl font-black"
                style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
              >
                {(totalXp / 1000).toFixed(1)}k
              </p>
            </div>
          </div>

          {/* Corner Glows */}
          <div
            className="absolute top-0 right-0 w-20 h-20 opacity-20 rounded-full"
            style={{
              backgroundColor: `rgb(var(--color-${theme.accent.main}))`,
              filter: 'blur(12px)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-16 h-16 opacity-15 rounded-full"
            style={{
              backgroundColor: `rgb(var(--color-${theme.accent.main}))`,
              filter: 'blur(10px)',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}
