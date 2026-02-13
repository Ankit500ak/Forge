'use client'

import { useRankTheme } from '@/lib/rank-theme-context'
import Image from 'next/image'

interface HeaderProProps {
  userName: string
  rank: string
  level?: number
  rankName?: string
  totalXp?: number
  weeklyXp?: number
  nextRank?: string
  nextRankName?: string
  progressPercent?: number
}

const RANK_ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'A+', 'S', 'S+', 'SS+']

export function HeaderPro({ 
  userName, 
  rank, 
  level = 1, 
  rankName = 'Novice',
  totalXp = 0,
  weeklyXp = 0,
  nextRank,
  nextRankName,
  progressPercent = 0
}: HeaderProProps) {
  const { theme } = useRankTheme()

  // Calculate next rank
  const currentRankIndex = RANK_ORDER.indexOf(rank)
  const calculatedNextRank = currentRankIndex < RANK_ORDER.length - 1 
    ? RANK_ORDER[currentRankIndex + 1] 
    : rank

  const finalNextRank = nextRank || calculatedNextRank
  const finalNextRankName = nextRankName || getRankNameForRank(finalNextRank)
  const finalProgressPercent = progressPercent || 0

  return (
    <div className="relative w-full overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
      {/* Background with animated gradient */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.3) 0%, transparent 50%), radial-gradient(circle at top right, rgb(var(--color-${theme.accent.main}) / 0.2), transparent 70%)`,
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent, rgb(var(--color-${theme.accent.main})), transparent)`,
          boxShadow: `0 0 20px rgb(var(--color-${theme.accent.main}) / 0.8)`,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Top Row: Name and Rank Badge */}
        <div className="flex items-start justify-between gap-6 mb-4">
          {/* Left: User Info */}
          <div className="flex-1">
            {/* User Name */}
            <h1
              className="text-4xl sm:text-5xl font-black mb-2 tracking-tight"
              style={{
                color: `rgb(var(--color-${theme.accent.main}))`,
                textShadow: `0 4px 20px rgb(var(--color-${theme.accent.main}) / 0.5), 0 0 40px rgb(var(--color-${theme.accent.main}) / 0.3)`,
              }}
            >
              {userName}
            </h1>

            {/* Status Line */}
            <div className="flex items-center gap-3">
              <div
                className="h-1 w-12 rounded-full"
                style={{
                  background: `linear-gradient(90deg, rgb(var(--color-${theme.accent.main})), transparent)`,
                }}
              />
              <p
                className="text-sm sm:text-base font-bold uppercase tracking-widest"
                style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
              >
                {rankName} • Rank {rank}
              </p>
            </div>
          </div>

          {/* Right: Large Rank Badge */}
          <div
            className="flex flex-col items-center justify-center relative"
            style={{
              width: '100px',
              height: '100px',
            }}
          >
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(circle, rgb(var(--color-${theme.accent.main}) / 0.4), transparent)`,
                filter: 'blur(20px)',
                animation: 'pulse 3s ease-in-out infinite',
              }}
            />

            {/* Main badge */}
            <div
              className="relative w-full h-full flex items-center justify-center rounded-2xl border-2 backdrop-blur-xl shadow-2xl"
              style={{
                backgroundColor: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.2), rgb(var(--color-${theme.accent.main}) / 0.05))`,
                borderColor: `rgb(var(--color-${theme.accent.main}) / 0.8)`,
                boxShadow: `0 8px 32px rgb(var(--color-${theme.accent.main}) / 0.4), inset 0 1px 2px rgb(255, 255, 255 / 0.3)`,
              }}
            >
              <span
                className="text-6xl font-black drop-shadow-lg"
                style={{
                  color: `rgb(var(--color-${theme.accent.main}))`,
                  textShadow: `0 0 20px rgb(var(--color-${theme.accent.main}) / 0.8)`,
                }}
              >
                {rank}
              </span>
            </div>

            {/* Level indicator below badge */}
            <div
              className="absolute -bottom-6 px-2 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wider whitespace-nowrap backdrop-blur-md"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.15)`,
                borderColor: `rgb(var(--color-${theme.accent.main}) / 0.6)`,
                color: `rgb(var(--color-${theme.accent.main}))`,
              }}
            >
              Lvl {level}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-2 space-y-2">
          {/* XP Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Total XP */}
            <div
              className="px-3 py-2 rounded-lg border backdrop-blur-sm flex flex-col items-center"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.08)`,
                borderColor: `rgb(var(--color-${theme.accent.main}) / 0.3)`,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
              >
                Total XP
              </p>
              <p
                className="text-base font-black"
                style={{ color: `rgb(var(--color-${theme.accent.main}))` }}
              >
                {totalXp.toLocaleString()}
              </p>
            </div>

            {/* Weekly XP */}
            <div
              className="px-3 py-2 rounded-lg border backdrop-blur-sm flex flex-col items-center"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.08)`,
                borderColor: `rgb(var(--color-${theme.accent.main}) / 0.3)`,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
              >
                Weekly XP
              </p>
              <p
                className="text-base font-black"
                style={{ color: `rgb(var(--color-${theme.accent.main}))` }}
              >
                {weeklyXp.toLocaleString()}
              </p>
            </div>

            {/* Next Rank */}
            <div
              className="px-3 py-2 rounded-lg border backdrop-blur-sm flex flex-col items-center"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.08)`,
                borderColor: `rgb(var(--color-${theme.accent.main}) / 0.3)`,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
              >
                Next Rank
              </p>
              <p
                className="text-base font-black"
                style={{ color: `rgb(var(--color-${theme.accent.main}))` }}
              >
                {finalNextRank}
              </p>
            </div>
          </div>

          {/* Progress Bar to Next Rank */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
              >
                Progress to {finalNextRankName}
              </p>
              <p
                className="text-xs font-black"
                style={{ color: `rgb(var(--color-${theme.accent.main}))` }}
              >
                {Math.round(finalProgressPercent)}%
              </p>
            </div>

            {/* Progress Bar */}
            <div
              className="relative h-2 rounded-full overflow-hidden border"
              style={{
                backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.1)`,
                borderColor: `rgb(var(--color-${theme.accent.main}) / 0.3)`,
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{
                  width: `${Math.min(finalProgressPercent, 100)}%`,
                  background: `linear-gradient(90deg, rgb(var(--color-${theme.accent.main})), rgb(var(--color-${theme.accent.main}) / 0.6))`,
                  boxShadow: `0 0 10px rgb(var(--color-${theme.accent.main}) / 0.6)`,
                }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, rgb(255, 255, 255 / 0.3), transparent)`,
                    animation: 'shimmer 2s infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className="mt-3 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgb(var(--color-${theme.accent.main}) / 0.3), transparent)`,
          }}
        />
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1.2;
          }
        }

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

function getRankNameForRank(rank: string): string {
  const rankNames: Record<string, string> = {
    'SS+': 'Legendary+',
    'SS': 'Legendary',
    'S+': 'Champion+',
    'S': 'Champion',
    'A+': 'Master+',
    'A': 'Master',
    'B': 'Expert',
    'C': 'Adept',
    'D': 'Intermediate',
    'E': 'Apprentice',
    'F': 'Novice',
  }
  return rankNames[rank] || 'Novice'
}
