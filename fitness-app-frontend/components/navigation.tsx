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
    { href: '/camera', label: 'Scan', icon: Camera },
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
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.92) 15%, rgba(0, 0, 0, 0.98) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Subtle top glow */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          }}
        />

        <div className="flex justify-around items-center px-4 py-2 max-w-md mx-auto">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 group min-w-[56px]`}
              >
                {/* Active background glow */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-xl opacity-30 blur-md"
                    style={{
                      background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 70%)',
                    }}
                  />
                )}

                {/* Icon */}
                <div className="relative mb-0.5">
                  <Icon
                    size={20}
                    strokeWidth={2.5}
                    className={`transition-all duration-300 ${
                      isActive ? 'scale-100' : 'scale-90 group-hover:scale-95'
                    }`}
                    style={{
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                      filter: isActive
                        ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))'
                        : 'none',
                    }}
                  />
                  
                  {/* Active ping indicator */}
                  {isActive && (
                    <div
                      className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-white animate-pulse"
                      style={{
                        boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-semibold transition-all duration-300 whitespace-nowrap ${
                    isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-70'
                  }`}
                  style={{
                    color: '#ffffff',
                    letterSpacing: '0.3px',
                  }}
                >
                  {item.label}
                </span>

                {/* Bottom indicator */}
                {isActive && (
                  <div
                    className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                      boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)',
                    }}
                  />
                )}
              </Link>
            )
          })}

          {/* More Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 group min-w-[56px]`}
            >
              {/* Active glow */}
              {showMenu && (
                <div
                  className="absolute inset-0 rounded-xl opacity-30 blur-md"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent 70%)',
                  }}
                />
              )}

              {/* Icon */}
              <div className="relative mb-0.5">
                <Settings
                  size={20}
                  strokeWidth={2.5}
                  className={`transition-all duration-300 ${
                    showMenu ? 'scale-100 rotate-90' : 'scale-90 group-hover:scale-95 group-hover:rotate-45'
                  }`}
                  style={{
                    color: showMenu ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    filter: showMenu
                      ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))'
                      : 'none',
                  }}
                />

                {showMenu && (
                  <div
                    className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-white animate-pulse"
                    style={{
                      boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-semibold transition-all duration-300 ${
                  showMenu ? 'opacity-100' : 'opacity-50 group-hover:opacity-70'
                }`}
                style={{
                  color: '#ffffff',
                  letterSpacing: '0.3px',
                }}
              >
                More
              </span>

              {/* Bottom indicator */}
              {showMenu && (
                <div
                  className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)',
                  }}
                />
              )}
            </button>

            {/* Compact Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(4px)',
                  }}
                />

                {/* Menu */}
                <div
                  className="absolute bottom-full mb-2 right-0 w-48 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.96))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    animation: 'slideUp 0.2s ease-out',
                  }}
                >
                  {/* Header */}
                  <div 
                    className="px-3 py-2 border-b"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" 
                           style={{ boxShadow: '0 0 8px rgba(52, 211, 153, 0.6)' }} />
                      <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Quick Menu</span>
                    </div>
                  </div>

                  {/* Menu Items - Compact */}
                  <div className="py-1">
                    {secondaryNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMenu(false)}
                        className="group flex items-center gap-2.5 px-3 py-2 transition-all duration-200 relative overflow-hidden"
                      >
                        {/* Hover background */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent)',
                          }}
                        />

                        {/* Icon */}
                        <div 
                          className="relative w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {item.icon}
                        </div>

                        {/* Label */}
                        <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                          {item.label}
                        </span>

                        {/* Arrow */}
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-1 h-1 rounded-full bg-white/60" />
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Divider */}
                  <div 
                    className="h-px mx-3"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    }}
                  />

                  {/* Settings Items */}
                  <div className="py-1">
                    {settingsItems.map((item, idx) => (
                      <div key={idx}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            onClick={(e) => {
                              if (item.onClick) item.onClick(e);
                              setShowMenu(false);
                            }}
                            className="group flex items-center gap-2.5 px-3 py-2 transition-all duration-200 relative overflow-hidden"
                          >
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent)',
                              }}
                            />

                            <div 
                              className="relative w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0 transition-transform group-hover:scale-110"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              {item.icon}
                            </div>

                            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                              {item.label}
                            </span>
                          </Link>
                        ) : (
                          <button
                            onClick={(e) => {
                              if (item.onClick) item.onClick(e as any);
                              else setShowMenu(false);
                            }}
                            className={`group w-full flex items-center gap-2.5 px-3 py-2 transition-all duration-200 relative overflow-hidden ${
                              item.label === 'Logout' ? 'text-red-400' : ''
                            }`}
                          >
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                background: item.label === 'Logout'
                                  ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.1), transparent)'
                                  : 'linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent)',
                              }}
                            />

                            <div 
                              className="relative w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0 transition-transform group-hover:scale-110"
                              style={{
                                background: item.label === 'Logout'
                                  ? 'rgba(239, 68, 68, 0.1)'
                                  : 'rgba(255, 255, 255, 0.05)',
                                border: item.label === 'Logout'
                                  ? '1px solid rgba(239, 68, 68, 0.2)'
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              {item.icon}
                            </div>

                            <span className={`text-sm font-medium transition-colors ${
                              item.label === 'Logout' 
                                ? 'text-red-400 group-hover:text-red-300' 
                                : 'text-white/80 group-hover:text-white'
                            }`}>
                              {item.label}
                            </span>

                            {item.label === 'Logout' && (
                              <div className="ml-auto">
                                <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Safe area for home indicator */}
        <div className="h-2 sm:h-0" />
      </nav>

      {/* Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}