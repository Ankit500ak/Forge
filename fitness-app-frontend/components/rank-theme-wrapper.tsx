'use client'

import { useAuth } from '@/lib/auth-context'
import { RankThemeProvider, type RankType } from '@/lib/rank-theme-context'

export function RankThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const userRank = (user?.rank as RankType) || 'F'

  return (
    <RankThemeProvider userRank={userRank}>
      {children}
    </RankThemeProvider>
  )
}
