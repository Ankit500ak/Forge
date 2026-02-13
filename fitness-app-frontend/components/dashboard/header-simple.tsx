'use client'

import { useRankTheme } from '@/lib/rank-theme-context'

interface HeaderSimpleProps {
  userName: string
  rank: string
}

export function HeaderSimple({ userName, rank }: HeaderSimpleProps) {
  const { theme } = useRankTheme()

  return (
    <div className="relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
      {/* Subtle Background Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at top center, rgb(var(--color-${theme.accent.main})), transparent 80%)`,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left: Large Name */}
        <div className="flex-1">
          <h1
            className="text-3xl sm:text-4xl font-black"
            style={{
              color: `rgb(var(--color-${theme.accent.main}))`,
              textShadow: `0 0 12px rgb(var(--color-${theme.accent.main}) / 0.6)`,
            }}
          >
            {userName}
          </h1>
          <p 
            className="text-xs sm:text-sm mt-1 font-semibold uppercase tracking-widest"
            style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
          >
            {theme.name} • Rank {rank}
          </p>
        </div>

        {/* Right: Rank Badge */}
        <div
          className="px-4 py-3 rounded-lg border backdrop-blur-md flex flex-col items-center gap-1 whitespace-nowrap"
          style={{
            backgroundColor: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.3), rgb(var(--color-${theme.accent.main}) / 0.12))`,
            borderColor: `rgb(var(--color-${theme.accent.main}) / 0.9)`,
            boxShadow: `0 0 25px rgb(var(--color-${theme.accent.main}) / 0.6), inset 0 1px 3px rgb(255, 255, 255 / 0.1)`,
          }}
        >
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center font-black text-base sm:text-lg text-white"
            style={{
              background: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main})), rgb(var(--color-${theme.accent.main}) / 0.6))`,
              boxShadow: `0 0 18px rgb(var(--color-${theme.accent.main}) / 0.9), inset 0 0 8px rgb(255, 255, 255 / 0.2)`,
            }}
          >
            {rank}
          </div>
        </div>
      </div>
    </div>
  )
}
