'use client'

import React from 'react'
import { useRankTheme } from '@/lib/rank-theme-context'

interface SectionCardProps {
  title: string
  children: React.ReactNode
  icon?: string
  subtitle?: string
}

export function SectionCard({ title, children, icon, subtitle }: SectionCardProps) {
  const { theme } = useRankTheme()

  return (
    <>
      <style>{`
        @keyframes subtle-glow {
          0%, 100% { box-shadow: 0 0 20px rgb(var(--color-${theme.accent.main}) / 0.2), inset 0 0 15px rgb(var(--color-${theme.accent.main}) / 0.05); }
          50% { box-shadow: 0 0 40px rgb(var(--color-${theme.accent.main}) / 0.3), inset 0 0 25px rgb(var(--color-${theme.accent.main}) / 0.1); }
        }
        .section-card-container {
          animation: subtle-glow 3s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        .section-card-container:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <div
        className="section-card-container border rounded-2xl p-5 sm:p-6 transition-all duration-300 space-y-4 backdrop-blur-sm overflow-hidden relative"
        style={{
          borderColor: `rgb(var(--color-${theme.accent.main}) / 0.6)`,
          background: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.1), rgb(var(--color-${theme.accent.main}) / 0.05))`,
          boxShadow: `0 0 30px rgb(var(--color-${theme.accent.main}) / 0.2), inset 0 0 20px rgb(var(--color-${theme.accent.main}) / 0.05)`,
        }}
      >
        {/* Top Decorative Line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(to right, transparent, rgb(var(--color-${theme.accent.main})), transparent)`,
          }}
        />

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4 flex-1">
              {icon && <span className="text-3xl sm:text-4xl flex-shrink-0 mt-0.5">{icon}</span>}
              <div className="flex-1">
                <h2
                  className="text-lg sm:text-xl font-black uppercase tracking-wide"
                  style={{
                    color: `rgb(var(--color-${theme.accent.main}))`,
                    textShadow: `0 0 15px rgb(var(--color-${theme.accent.main}) / 0.5)`,
                  }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs sm:text-sm mt-1 font-semibold" style={{ color: `rgb(var(--color-${theme.accent.light}) / 0.7)` }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="mt-4 sm:mt-5">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
