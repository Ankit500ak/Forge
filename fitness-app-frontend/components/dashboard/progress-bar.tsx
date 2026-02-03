'use client'

import { useRankTheme } from '@/lib/rank-theme-context'

interface ProgressBarProps {
  label: string
  current: number
  goal: number
  percentage: number
  color?: 'purple' | 'cyan' | 'indigo'
}

export function ProgressBar({
  label,
  current,
  goal,
  percentage,
  color = 'purple',
}: ProgressBarProps) {
  const { theme } = useRankTheme()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-black text-transparent bg-clip-text uppercase tracking-widest"
          style={{
            backgroundImage: `linear-gradient(to right, rgb(var(--color-${theme.accent.light})), rgb(var(--color-${theme.accent.main})))`,
          }}
        >
          {label}
        </h3>
        <span
          className="text-xs font-black"
          style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
        >
          {Math.round(percentage)}%
        </span>
      </div>
      <div
        className="w-full rounded-full h-3 overflow-hidden border transition-all duration-300"
        style={{
          backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.1)`,
          borderColor: `rgb(var(--color-${theme.accent.main}) / 0.3)`,
        }}
      >
        <div
          className={`bg-gradient-to-r ${theme.gradient} h-full rounded-full transition-all duration-500`}
          style={{
            width: `${percentage}%`,
            boxShadow: `0 0 10px rgb(var(--color-${theme.accent.main}) / 0.5)`,
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground font-semibold">
        {current}/{goal}
      </p>
    </div>
  )
}
