interface AchievementBadgeProps {
  title: string
  description: string
  icon: string
  locked?: boolean
  unlockedDate?: string
}

export function AchievementBadge({
  title,
  description,
  icon,
  locked = false,
  unlockedDate,
}: AchievementBadgeProps) {
  return (
    <div
      className={`border rounded-lg p-4 text-center transition-all ${
        locked
          ? 'border-gray-600/30 bg-gray-900/30 opacity-60'
          : 'border-orange-500/50 bg-orange-500/5 shadow-lg shadow-orange-500/20'
      }`}
    >
      <div className={`text-4xl mb-2 ${locked ? 'opacity-50 grayscale' : ''}`}>{icon}</div>
      <h3 className="font-bold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      {unlockedDate && <p className="text-xs text-green-400">Unlocked {unlockedDate}</p>}
      {locked && <p className="text-xs text-gray-500">Locked</p>}
    </div>
  )
}
