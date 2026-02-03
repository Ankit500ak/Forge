'use client'

import { useRankTheme } from '@/lib/rank-theme-context'

interface Objective {
  label: string
  value: string | number
  goal: string | number
  icon: string
  progress: number
  unit?: string
}

interface DailyObjectivesProps {
  objectives: Objective[]
}

export function DailyObjectivesSection({ objectives }: DailyObjectivesProps) {
  const { theme } = useRankTheme()

  const getCompletionStatus = (progress: number) => {
    if (progress >= 100) return { status: 'Complete!', color: 'green' }
    if (progress >= 75) return { status: 'Almost There!', color: 'yellow' }
    if (progress >= 50) return { status: 'Halfway!', color: 'blue' }
    return { status: 'Just Started', color: 'gray' }
  }

  return (
    <div
      className="border rounded-2xl p-6 transition-all duration-300 overflow-hidden"
      style={{
        borderColor: `rgb(var(--color-${theme.accent.main}) / 0.5)`,
        backgroundColor: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.08), rgb(var(--color-${theme.accent.main}) / 0.04))`,
        boxShadow: `0 0 30px rgb(var(--color-${theme.accent.main}) / 0.15)`,
      }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <div>
            <h2
              className="text-lg sm:text-2xl font-black text-transparent bg-clip-text uppercase tracking-widest"
              style={{
                backgroundImage: `linear-gradient(to right, rgb(var(--color-${theme.accent.light})), rgb(var(--color-${theme.accent.main})))`,
              }}
            >
              Daily Objectives
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Complete your daily goals</p>
          </div>
        </div>
      </div>

      {/* Objectives Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {objectives.map((objective, idx) => {
          const completion = getCompletionStatus(objective.progress)
          const isComplete = objective.progress >= 100

          return (
            <div
              key={idx}
              className="group relative border rounded-xl p-4 transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden"
              style={{
                backgroundColor: isComplete
                  ? `rgb(var(--color-${theme.accent.main}) / 0.2)`
                  : `rgb(var(--color-${theme.accent.main}) / 0.08)`,
                borderColor: `rgb(var(--color-${theme.accent.main}) / ${isComplete ? '0.6' : '0.4'})`,
              }}
            >
              {/* Background Glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  backgroundImage: `radial-gradient(circle at center, rgb(var(--color-${theme.accent.main})), transparent)`,
                }}
              />

              <div className="relative z-10 space-y-3">
                {/* Top Section: Icon and Value */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{objective.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground font-semibold mb-1">{objective.label}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-xl sm:text-2xl font-black text-white">{objective.value}</p>
                        {objective.unit && <p className="text-xs text-muted-foreground">{objective.unit}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="text-2xl font-black"
                      style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
                    >
                      {objective.progress}%
                    </div>
                  </div>
                </div>

                {/* Goal Info */}
                <div className="flex items-center justify-between text-xs pt-2 border-t" style={{ borderTopColor: `rgb(var(--color-${theme.accent.main}) / 0.2)` }}>
                  <p className="text-muted-foreground">
                    Goal: <span className="font-semibold text-white">{objective.goal}{objective.unit ? ' ' + objective.unit : ''}</span>
                  </p>
                  <p
                    className="font-bold px-2 py-1 rounded-full text-xs"
                    style={{
                      color: `rgb(var(--color-${theme.accent.light}))`,
                      backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.25)`,
                    }}
                  >
                    {completion.status}
                  </p>
                </div>

                {/* Progress Bar */}
                <div
                  className="relative h-2.5 rounded-full overflow-hidden border"
                  style={{
                    backgroundColor: `rgb(var(--color-${theme.accent.main}) / 0.15)`,
                    borderColor: `rgb(var(--color-${theme.accent.main}) / 0.3)`,
                  }}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${theme.gradient}`}
                    style={{
                      width: `${Math.min(objective.progress, 100)}%`,
                      boxShadow: `0 0 15px rgb(var(--color-${theme.accent.main}) / 0.6)`,
                    }}
                  />
                </div>

                {/* Completion Indicator */}
                {isComplete && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <p className="text-xs font-bold text-green-400">Completed!</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Summary */}
      <div
        className="mt-6 pt-6 border-t flex items-center justify-between"
        style={{ borderTopColor: `rgb(var(--color-${theme.accent.main}) / 0.2)` }}
      >
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total Progress</p>
          <p className="text-lg font-bold text-white">
            {Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Objectives Completed</p>
          <p
            className="text-lg font-bold"
            style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
          >
            {objectives.filter(obj => obj.progress >= 100).length} / {objectives.length}
          </p>
        </div>
        <div className="w-16 h-16 flex items-center justify-center rounded-full text-3xl group hover:scale-110 transition-transform">
          🏆
        </div>
      </div>
    </div>
  )
}
