'use client'

interface HeaderSectionProps {
  userName: string
  rank: string
  level: number
  statPoints: number
  xpToday: number
  totalXp: number
}

interface RankColors {
  bg: string
  text: string
  border: string
}

interface RankColorsMap {
  [key: string]: RankColors
}

export function HeaderSection({ userName, rank, level, statPoints, xpToday, totalXp }: HeaderSectionProps) {
  const getRankColor = (rankKey: string): RankColors => {
    const colors: RankColorsMap = {
      S: { bg: 'from-purple-600 to-purple-700', text: 'text-purple-300', border: 'border-purple-500/50' },
      A: { bg: 'from-blue-600 to-blue-700', text: 'text-blue-300', border: 'border-blue-500/50' },
      B: { bg: 'from-cyan-600 to-cyan-700', text: 'text-cyan-300', border: 'border-cyan-500/50' },
      C: { bg: 'from-indigo-600 to-indigo-700', text: 'text-indigo-300', border: 'border-indigo-500/50' },
    }
    return colors[rankKey] || colors['C']
  }

  const rankColor = getRankColor(rank)

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-b from-card via-card/80 to-transparent border-b-2 border-purple-500/30 p-4 space-y-4 backdrop-blur-sm">
      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 text-balance">
          {userName}
        </h1>
        <p className="text-muted-foreground text-xs mt-2 font-semibold tracking-widest uppercase">⚔️ HUNTER SYSTEM ACTIVATED</p>
      </div>

      {/* Status Badges - Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Rank Badge */}
        <div
          className={`relative bg-gradient-to-br ${rankColor.bg} rounded-sm p-3 sm:p-4 border-2 ${rankColor.border} shadow-[0_0_15px] shadow-purple-600/30`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-sm" />
          <div className="text-center relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">{rank}</div>
            <p className="text-xs text-white/80 font-bold uppercase tracking-wider">Rank</p>
          </div>
        </div>

        {/* Level Badge */}
        <div className="relative bg-gradient-to-br from-purple-600 to-purple-700 rounded-sm p-3 sm:p-4 border-2 border-purple-500/50 shadow-[0_0_15px] shadow-purple-600/30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-sm" />
          <div className="text-center relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">{level}</div>
            <p className="text-xs text-white/80 font-bold uppercase tracking-wider">Level</p>
          </div>
        </div>

        {/* Stat Points Badge */}
        <div className="relative bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-sm p-3 sm:p-4 border-2 border-cyan-500/50 shadow-[0_0_15px] shadow-cyan-600/30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-sm" />
          <div className="text-center relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">{statPoints}</div>
            <p className="text-xs text-white/80 font-bold uppercase tracking-wider">Points</p>
          </div>
        </div>

        {/* XP Gained Today */}
        <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-sm p-3 sm:p-4 border-2 border-indigo-500/50 shadow-[0_0_15px] shadow-indigo-600/30">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-sm" />
          <div className="text-center relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-white mb-1">+{xpToday}</div>
            <p className="text-xs text-white/80 font-bold uppercase tracking-wider">Today</p>
          </div>
        </div>
      </div>

      {/* Total XP Display */}
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border-2 border-purple-500/40 rounded-sm p-3 sm:p-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total XP Earned</p>
            <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {(totalXp / 1000).toFixed(1)}k XP
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Achievement</p>
            <p className="text-sm sm:text-base text-purple-300 font-black">LEGENDARY</p>
          </div>
        </div>
      </div>
    </div>
  )
}
