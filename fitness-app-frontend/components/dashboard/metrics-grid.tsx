'use client'

import { useRankTheme } from '@/lib/rank-theme-context'

interface Metric {
  label: string
  value: string
  goal: string
  icon: string
  progress: number
  color: 'purple' | 'red' | 'cyan' | 'indigo'
}

interface MetricsGridProps {
  metrics: Metric[]
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const { theme } = useRankTheme()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="border rounded-lg p-4 backdrop-blur-sm transition-all duration-300 group hover:shadow-lg"
          style={{
            backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.08)`,
            borderColor: `rgb(var(--color-${theme.accent.main}) / 0.3)`,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl group-hover:scale-110 transition-transform">{metric.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">{metric.label}</p>
                <p className="text-lg sm:text-xl font-black text-white">{metric.value}</p>
              </div>
            </div>
            <span
              className="text-xs font-bold px-2 py-1 rounded transition-colors"
              style={{
                color: `rgb(var(--color-${theme.accent.light}))`,
                backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.2)`,
              }}
            >
              {metric.progress}%
            </span>
          </div>

          {/* Goal Info */}
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Goal: {metric.goal}</p>

          {/* Progress Bar */}
          <div
            className="w-full rounded-full h-2 overflow-hidden border transition-all"
            style={{
              backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.1)`,
              borderColor: `rgb(var(--color-${theme.accent.main}) / 0.2)`,
            }}
          >
            <div
              className={`bg-gradient-to-r ${theme.gradient} h-full rounded-full`}
              style={{ width: `${metric.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
