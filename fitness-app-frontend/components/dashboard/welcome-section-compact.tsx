'use client'

import { useRankTheme } from '@/lib/rank-theme-context'
import { useAuth } from '@/lib/auth-context'
import { useState, useRef, useEffect } from 'react'

interface WelcomeSectionProps {
  userName: string
  rank: string
}

export function WelcomeSection({ userName, rank }: WelcomeSectionProps) {
  const { theme } = useRankTheme()
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
  }

  return (
    <div className="relative overflow-hidden px-3 sm:px-4 py-2 sm:py-3">
      {/* Subtle Background Glow */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at top center, rgb(var(--color-${theme.accent.main})), transparent 80%)`,
        }}
      />

      {/* Main Content - Left Name & Right Rank Badge + Menu */}
      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left: Large Name */}
        <h1
          className="text-2xl sm:text-4xl font-black flex-1"
          style={{
            color: `rgb(var(--color-${theme.accent.main}))`,
            textShadow: `0 0 12px rgb(var(--color-${theme.accent.main}) / 0.6)`,
          }}
        >
          {userName}
        </h1>

        {/* Right: Rank Badge + Hamburger Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Rank Badge */}
          <div
            className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg border backdrop-blur-md flex items-center gap-2.5 whitespace-nowrap"
            style={{
              backgroundColor: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.3), rgb(var(--color-${theme.accent.main}) / 0.12))`,
              borderColor: `rgb(var(--color-${theme.accent.main}) / 0.9)`,
              boxShadow: `0 0 25px rgb(var(--color-${theme.accent.main}) / 0.6), inset 0 1px 3px rgb(255, 255, 255 / 0.1)`,
            }}
          >
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center font-black text-sm sm:text-base text-white"
              style={{
                background: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main})), rgb(var(--color-${theme.accent.main}) / 0.6))`,
                boxShadow: `0 0 18px rgb(var(--color-${theme.accent.main}) / 0.9), inset 0 0 8px rgb(255, 255, 255 / 0.2)`,
              }}
            >
              {rank}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: `rgb(var(--color-${theme.accent.light}))` }}>Rank</p>
              <p
                className="text-sm sm:text-base font-black leading-tight"
                style={{ color: `rgb(var(--color-${theme.accent.light}))` }}
              >
                {theme.name}
              </p>
            </div>
          </div>

          {/* Hamburger Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg border backdrop-blur-md transition-all hover:scale-110 relative z-10"
              style={{
                backgroundColor: `linear-gradient(135deg, rgb(var(--color-${theme.accent.main}) / 0.3), rgb(var(--color-${theme.accent.main}) / 0.12))`,
                borderColor: `rgb(var(--color-${theme.accent.main}) / 0.9)`,
                boxShadow: `0 0 20px rgb(var(--color-${theme.accent.main}) / 0.5)`,
              }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: `rgb(var(--color-${theme.accent.light}))` }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Dropdown Menu - Fixed Positioning */}
            {menuOpen && (
              <div
                className="fixed z-[9999] w-48 rounded-lg border backdrop-blur-md shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: `rgba(0, 0, 0, 0.8)`,
                  borderColor: `rgb(var(--color-${theme.accent.main}) / 0.8)`,
                  boxShadow: `0 8px 32px rgb(var(--color-${theme.accent.main}) / 0.4)`,
                  top: '52px',
                  right: 'calc(1rem + 1rem)',
                }}
              >
                {/* Settings */}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-opacity-80 transition-all border-b"
                  style={{
                    color: `rgb(var(--color-${theme.accent.light}))`,
                    borderColor: `rgb(var(--color-${theme.accent.main}) / 0.3)`,
                  }}
                >
                  <span>⚙️</span>
                  <span className="font-semibold">Settings</span>
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-opacity-80 transition-all"
                  style={{
                    color: `rgb(var(--color-${theme.accent.main}))`,
                  }}
                >
                  <span>🚪</span>
                  <span className="font-semibold">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
