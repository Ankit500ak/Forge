'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Trophy, Camera, Settings, Menu, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function Navigation() {
  const pathname = usePathname()
  const [showMenu, setShowMenu] = useState(false)
  const [activeGlow, setActiveGlow] = useState<string | null>(null)
  const { logout } = useAuth()

  const mainNavItems = [
    { href: '/dashboard', label: 'Home', icon: Home, color: '#3b82f6', emoji: '🏠' },
    { href: '/stats', label: 'Stats', icon: BarChart3, color: '#8b5cf6', emoji: '📊' },
    { href: '/ranking', label: 'Ranks', icon: Trophy, color: '#f59e0b', emoji: '🏆' },
    { href: '/camera', label: 'Rep Counter', icon: Camera, color: '#10b981', emoji: '📸' },
  ]

  const settingsItems = [
    { href: '/settings', label: 'Settings', icon: '⚙️', color: '#6366f1' },
    { href: '#', label: 'Profile', icon: '👤', color: '#8b5cf6', onClick: (e: React.MouseEvent) => e.preventDefault() },
    { label: 'Logout', icon: '🚪', color: '#ef4444', onClick: () => { logout(); setShowMenu(false); } },
  ]

  const secondaryNavItems = [
    { href: '/inventory', label: 'Gear', icon: '🎒', color: '#06b6d4' },
    { href: '/redeem', label: 'Redeem', icon: '🎁', color: '#ec4899' },
    { href: '/workouts', label: 'Workouts', icon: '💪', color: '#f97316' },
  ]

  // Add particle effect on click
  const handleNavClick = (href: string) => {
    setActiveGlow(href)
    setTimeout(() => setActiveGlow(null), 300)
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.95) 20%, rgba(0, 0, 0, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5), 0 -2px 10px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Top accent line with gradient */}
        <div 
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.5), transparent)',
          }}
        />

        <div className="flex justify-between items-center px-3 py-3 md:px-6 md:py-4 max-w-6xl mx-auto w-full relative">
          {/* Ambient glow effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 100%, rgba(59, 130, 246, 0.05), transparent 70%)',
            }}
          />

          {mainNavItems.map((item, index) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`relative flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300 group overflow-hidden ${
                  isActive ? 'transform -translate-y-1' : ''
                }`}
                style={{
                  background: isActive 
                    ? `linear-gradient(135deg, ${item.color}15, ${item.color}05)`
                    : 'transparent',
                  border: isActive 
                    ? `1px solid ${item.color}40` 
                    : '1px solid transparent',
                  boxShadow: isActive 
                    ? `0 4px 20px ${item.color}30, inset 0 1px 0 ${item.color}20`
                    : 'none',
                }}
              >
                {/* Animated background shimmer */}
                {isActive && (
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `linear-gradient(45deg, transparent, ${item.color}20, transparent)`,
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                )}

                {/* Glow effect on active */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl -z-10"
                    style={{
                      background: `radial-gradient(circle, ${item.color}40, transparent 70%)`,
                      animation: 'pulse-glow 2s ease-in-out infinite',
                    }}
                  />
                )}

                {/* Click ripple effect */}
                {activeGlow === item.href && (
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `radial-gradient(circle, ${item.color}60, transparent)`,
                      animation: 'ripple 0.6s ease-out',
                    }}
                  />
                )}

                {/* Icon container with 3D effect */}
                <div className="relative">
                  {/* Background circle for icon */}
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-300 ${
                      isActive ? 'scale-110' : 'scale-0 group-hover:scale-100'
                    }`}
                    style={{
                      background: `radial-gradient(circle, ${item.color}20, transparent)`,
                      filter: 'blur(8px)',
                    }}
                  />

                  {/* Icon */}
                  <Icon
                    size={24}
                    strokeWidth={2.5}
                    className={`relative transition-all duration-300 ${
                      isActive ? 'scale-110 rotate-0' : 'scale-100 group-hover:scale-110 group-hover:-rotate-6'
                    }`}
                    style={{
                      color: isActive ? item.color : '#9ca3af',
                      filter: isActive
                        ? `brightness(1.5) drop-shadow(0 0 8px ${item.color}80) drop-shadow(0 2px 4px rgba(0,0,0,0.3))`
                        : 'brightness(1)',
                    }}
                  />

                  {/* Particle effect on active */}
                  {isActive && (
                    <>
                      <div
                        className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full animate-ping"
                        style={{
                          background: item.color,
                          boxShadow: `0 0 10px ${item.color}`,
                        }}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-1 h-1 rounded-full animate-ping"
                        style={{
                          background: item.color,
                          boxShadow: `0 0 8px ${item.color}`,
                          animationDelay: '0.3s',
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Label with gradient */}
                <span
                  className={`text-xs font-bold mt-1.5 transition-all duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'
                  }`}
                  style={{
                    background: isActive 
                      ? `linear-gradient(135deg, ${item.color}, ${item.color}80)`
                      : '#9ca3af',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: isActive ? `0 0 20px ${item.color}50` : 'none',
                    letterSpacing: '0.5px',
                  }}
                >
                  {item.label}
                </span>

                {/* Active indicator bar */}
                {isActive && (
                  <div
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full transition-all duration-300"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
                      boxShadow: `0 0 10px ${item.color}, 0 0 20px ${item.color}40`,
                      animation: 'glow-pulse 2s ease-in-out infinite',
                    }}
                  />
                )}

                {/* Level indicator (optional) */}
                {isActive && (
                  <div
                    className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
                    style={{
                      background: item.color,
                      boxShadow: `0 0 6px ${item.color}`,
                    }}
                  />
                )}
              </Link>
            )
          })}

          {/* More Menu (Settings) - Game Style */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`relative w-full flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300 group overflow-hidden ${
                showMenu ? 'transform -translate-y-1' : ''
              }`}
              style={{
                background: showMenu 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05))'
                  : 'transparent',
                border: showMenu 
                  ? '1px solid rgba(99, 102, 241, 0.4)' 
                  : '1px solid transparent',
                boxShadow: showMenu 
                  ? '0 4px 20px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(99, 102, 241, 0.2)'
                  : 'none',
              }}
            >
              {/* Animated background */}
              {showMenu && (
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(45deg, transparent, rgba(99, 102, 241, 0.2), transparent)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
              )}

              {/* Glow effect */}
              {showMenu && (
                <div
                  className="absolute inset-0 rounded-2xl blur-xl -z-10"
                  style={{
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent 70%)',
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }}
                />
              )}

              {/* Icon container */}
              <div className="relative">
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-300 ${
                    showMenu ? 'scale-110' : 'scale-0 group-hover:scale-100'
                  }`}
                  style={{
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent)',
                    filter: 'blur(8px)',
                  }}
                />

                <Settings
                  size={24}
                  strokeWidth={2.5}
                  className={`relative transition-all duration-300 ${
                    showMenu ? 'scale-110 rotate-90' : 'scale-100 group-hover:scale-110 group-hover:rotate-45'
                  }`}
                  style={{
                    color: showMenu ? '#6366f1' : '#9ca3af',
                    filter: showMenu
                      ? 'brightness(1.5) drop-shadow(0 0 8px rgba(99, 102, 241, 0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      : 'brightness(1)',
                  }}
                />

                {showMenu && (
                  <div
                    className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full animate-ping"
                    style={{
                      background: '#6366f1',
                      boxShadow: '0 0 10px #6366f1',
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-bold mt-1.5 transition-all duration-300 ${
                  showMenu ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'
                }`}
                style={{
                  background: showMenu 
                    ? 'linear-gradient(135deg, #6366f1, rgba(99, 102, 241, 0.6))'
                    : '#9ca3af',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '0.5px',
                }}
              >
                More
              </span>

              {/* Active indicator */}
              {showMenu && (
                <div
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full transition-all duration-300"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                    boxShadow: '0 0 10px #6366f1, 0 0 20px rgba(99, 102, 241, 0.4)',
                    animation: 'glow-pulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </button>

            {/* Dropdown Menu - Game Style */}
            {showMenu && (
              <>
                {/* Backdrop overlay */}
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
                  onClick={() => setShowMenu(false)}
                />

                <div
                  className="absolute bottom-full mb-3 right-0 min-w-[220px] rounded-2xl overflow-hidden animate-slide-up z-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.95))',
                    backdropFilter: 'blur(20px)',
                    border: '2px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Header */}
                  <div 
                    className="px-4 py-3 border-b"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
                      borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-yellow-400 animate-pulse" />
                      <span className="text-sm font-bold text-white">Quick Menu</span>
                      <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" 
                           style={{ boxShadow: '0 0 8px #4ade80' }} />
                    </div>
                  </div>

                  {/* Secondary Navigation - Game Cards */}
                  <div className="py-2">
                    {secondaryNavItems.map((item, idx) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMenu(false)}
                        className="group relative flex items-center gap-3 px-4 py-3 transition-all duration-200 overflow-hidden"
                        style={{
                          background: 'transparent',
                        }}
                      >
                        {/* Hover background */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{
                            background: `linear-gradient(90deg, ${item.color}15, transparent)`,
                          }}
                        />

                        {/* Icon with glow */}
                        <div className="relative">
                          <div 
                            className="absolute inset-0 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              background: `${item.color}40`,
                            }}
                          />
                          <div 
                            className="relative w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                              border: `1px solid ${item.color}30`,
                            }}
                          >
                            {item.icon}
                          </div>
                        </div>

                        {/* Label */}
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                            {item.label}
                          </span>
                        </div>

                        {/* Arrow indicator */}
                        <div 
                          className="w-1.5 h-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                          style={{
                            background: item.color,
                            boxShadow: `0 0 8px ${item.color}`,
                          }}
                        />
                      </Link>
                    ))}
                  </div>

                  {/* Divider with gradient */}
                  <div className="px-4">
                    <div 
                      className="h-px"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)',
                      }}
                    />
                  </div>

                  {/* Settings Section */}
                  <div className="py-2">
                    {settingsItems.map((item, idx) => (
                      <div key={idx}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            onClick={() => setShowMenu(false)}
                            className="group relative flex items-center gap-3 px-4 py-3 transition-all duration-200 overflow-hidden"
                          >
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              style={{
                                background: `linear-gradient(90deg, ${item.color}15, transparent)`,
                              }}
                            />
                            
                            <div 
                              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-110"
                              style={{
                                background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                                border: `1px solid ${item.color}30`,
                              }}
                            >
                              {item.icon}
                            </div>

                            <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                              {item.label}
                            </span>
                          </Link>
                        ) : (
                          <button
                            onClick={(e) => {
                              if (item.onClick) item.onClick(e as any);
                              else setShowMenu(false);
                            }}
                            className={`group relative w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 overflow-hidden ${
                              item.label === 'Logout' ? 'text-red-400' : ''
                            }`}
                          >
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              style={{
                                background: item.label === 'Logout'
                                  ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.15), transparent)'
                                  : `linear-gradient(90deg, ${item.color}15, transparent)`,
                              }}
                            />
                            
                            <div 
                              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-110"
                              style={{
                                background: item.label === 'Logout'
                                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))'
                                  : `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                                border: item.label === 'Logout'
                                  ? '1px solid rgba(239, 68, 68, 0.3)'
                                  : `1px solid ${item.color}30`,
                              }}
                            >
                              {item.icon}
                            </div>

                            <span className={`text-sm font-semibold transition-colors ${
                              item.label === 'Logout' 
                                ? 'text-red-400 group-hover:text-red-300' 
                                : 'text-white/90 group-hover:text-white'
                            }`}>
                              {item.label}
                            </span>

                            {item.label === 'Logout' && (
                              <div className="ml-auto">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"
                                     style={{ boxShadow: '0 0 8px #ef4444' }} />
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
      </nav>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px currentColor; }
          50% { opacity: 0.7; box-shadow: 0 0 20px currentColor; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
}