interface ProgressBarProps {
  current: number
  max: number
  label?: string
  color?: 'orange' | 'blue' | 'green' | 'yellow' | 'purple'
}

export function ProgressBar({ current, max, label, color = 'orange' }: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100)

  const colorClasses = {
    orange: 'bg-orange-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
  }

  return (
    <div className="w-full">
      {label && <p className="text-sm text-muted-foreground mb-2">{label}</p>}
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
        <div
          className={`${colorClasses[color]} h-full rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {current} / {max}
      </p>
    </div>
  )
}
