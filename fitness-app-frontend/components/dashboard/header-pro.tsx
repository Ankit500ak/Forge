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
      
    </>
  )
}