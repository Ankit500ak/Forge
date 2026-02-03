'use client'

import { WelcomeSection } from './welcome-section-compact'

interface EnhancedHeaderV2Props {
  userName: string
  rank: string
  level: number
  xpToday: number
  totalXp: number
  statPoints: number
}

export function EnhancedHeaderV2({ userName, rank }: EnhancedHeaderV2Props) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <WelcomeSection userName={userName} rank={rank} />
    </div>
  )
}
