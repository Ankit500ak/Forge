interface StatCardProps {
  label: string
  value: string | number
  icon: string
  trend?: number
  color?: 'orange' | 'blue' | 'green' | 'purple'
}

function StatCard({ label, value, icon, trend, color = 'orange' }: StatCardProps) {
  const colorClasses = {
    orange: 'border-orange-500/50 bg-orange-500/5',
    blue: 'border-blue-500/50 bg-blue-500/5',
    green: 'border-green-500/50 bg-green-500/5',
    purple: 'border-purple-500/50 bg-purple-500/5',
  }

  return (
    <div
      className={`border ${colorClasses[color]} rounded-lg p-4 backdrop-blur-sm hover:shadow-lg hover:shadow-orange-500/20 transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

export { StatCard }
export default StatCard
