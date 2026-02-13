'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Trophy, Camera, Settings, Menu, Zap } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function Navigation() {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const { logout } = useAuth()

  const mainNavItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
    { href: '/ranking', label: 'Ranks', icon: Trophy },
    { href: '/camera', label: 'Rep Counter', icon: Camera },
  ]

  const settingsItems = [
    { href: '/settings', label: 'Settings', icon: '⚙️' },
    { href: '#', label: 'Profile', icon: '👤', onClick: (e: React.MouseEvent) => e.preventDefault() },
    { label: 'Logout', icon: '🚪', onClick: () => { logout(); setShowMenu(false); } },
  ]

  const secondaryNavItems = [
    { href: '/inventory', label: 'Gear', icon: '🎒' },
    { href: '/redeem', label: 'Redeem', icon: '🎁' },
    { href: '/workouts', label: 'Workouts', icon: '💪' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex justify-between items-center px-2 py-2 md:px-4 md:py-2 max-w-6xl mx-auto w-full">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-lg transition-all duration-300 group relative`}
              style={{
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid transparent',
              }}
            >
              {/* Glow effect on active */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-lg blur-lg -z-10"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent)',
                  }}
                />
              )}

              {/* Icon with animation */}
              <Icon
                size={22}
                strokeWidth={2}
                className={`transition-all duration-300 ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`}
                style={{
                  color: '#ffffff',
                  filter: isActive
                    ? 'brightness(2) drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))'
                    : 'brightness(1.5) grayscale(100%)',
                  opacity: 1,
                }}
              />

              {/* Active indicator dot */}
              {isActive && (
                <div
                  className="absolute bottom-0.5 w-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                  }}
                />
              )}
            </Link>
          )
        })}

        {/* More Menu (Settings) */}
        <div className="flex-1 relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`w-full flex flex-col items-center justify-center py-2 px-1.5 rounded-lg transition-all duration-300 group relative`}
            style={{
              backgroundColor: showMenu ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              border: showMenu ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid transparent',
            }}
          >
            {/* Glow effect on active */}
            {showMenu && (
              <div
                className="absolute inset-0 rounded-lg blur-lg -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent)',
                }}
              />
            )}

            {/* Menu Icon */}
            <Settings
              size={22}
              strokeWidth={2}
              className={`transition-all duration-300 ${showMenu ? 'scale-110' : 'group-hover:scale-105'}`}
              style={{
                color: '#ffffff',
                filter: showMenu
                  ? 'brightness(2) drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))'
                  : 'brightness(1.5) grayscale(100%)',
              }}
            />

            {/* Active indicator dot */}
            {showMenu && (
              <div
                className="absolute bottom-0.5 w-1 h-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                }}
              />
            )}

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                className="absolute bottom-full mb-2 right-0 bg-gray-900 rounded-lg overflow-hidden border border-white/20 shadow-xl min-w-max"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Secondary Navigation */}
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-white/80 hover:text-white border-b border-white/10"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Settings Section */}
                {settingsItems.map((item, idx) => (
                  <div key={idx}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ) : (
                      <button
                        onClick={(e) => {
                          if (item.onClick) item.onClick(e as any);
                          else setShowMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-white/80 hover:text-white text-left ${
                          item.label === 'Logout' ? 'text-red-400 hover:text-red-300' : ''
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
