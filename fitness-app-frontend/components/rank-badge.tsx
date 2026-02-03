function RankBadge({ rank, size = 'md' }: { rank: string; size?: 'sm' | 'md' | 'lg' }) {
  const rankColors: Record<string, { bg: string; text: string; emoji: string }> = {
    F: { bg: 'bg-gray-700', text: 'text-gray-300', emoji: '🔥' },
    E: { bg: 'bg-blue-900', text: 'text-blue-300', emoji: '❄️' },
    D: { bg: 'bg-purple-900', text: 'text-purple-300', emoji: '⚡' },
    C: { bg: 'bg-green-900', text: 'text-green-300', emoji: '🌿' },
    B: { bg: 'bg-yellow-900', text: 'text-yellow-300', emoji: '✨' },
    A: { bg: 'bg-orange-600', text: 'text-orange-100', emoji: '🔥' },
    S: { bg: 'bg-red-700', text: 'text-red-100', emoji: '💫' },
  }

  const rankColor = rankColors[rank] || rankColors.F

  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-3xl',
  }

  return (
    <div
      className={`${sizeClasses[size]} ${rankColor.bg} ${rankColor.text} rounded-lg flex items-center justify-center font-bold border-2 border-orange-500/50 shadow-lg`}
    >
      <div className="text-center">
        <div className="text-2xl">{rankColor.emoji}</div>
        <div>{rank}</div>
      </div>
    </div>
  )
}

export { RankBadge }
export default RankBadge
