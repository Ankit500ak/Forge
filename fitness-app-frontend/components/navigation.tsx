'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Backpack, Gift, Trophy, Camera, Dumbbell, Settings, LogOut } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/stats', label: 'Stats', icon: BarChart3 },
    { href: '/inventory', label: 'Gear', icon: Backpack },
    { href: '/redeem', label: 'Redeem', icon: Gift },
    { href: '/ranking', label: 'Ranks', icon: Trophy },
    { href: '/camera', label: 'Rep Counter', icon: Camera },
    { href: '/workouts', label: 'Workouts', icon: Dumbbell },
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
        {navItems.map((item) => {
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
      </div>
    </nav>
  )
}
