'use client'

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: string
  color: 'purple' | 'cyan' | 'indigo' | 'red'
  size?: 'sm' | 'md' | 'lg'
}

const colorMap = {
  purple: {
    gradient: 'from-purple-600 to-purple-500',
    border: 'border-purple-400/50',
    glow: 'rgb(168, 85, 247)',
    light: '#c084fc',
  },
  cyan: {
    gradient: 'from-cyan-500 to-cyan-400',
    border: 'border-cyan-400/50',
    glow: 'rgb(34, 211, 238)',
    light: '#22d3ee',
  },
  indigo: {
    gradient: 'from-indigo-600 to-indigo-500',
    border: 'border-indigo-400/50',
    glow: 'rgb(99, 102, 241)',
    light: '#818cf8',
  },
  red: {
    gradient: 'from-red-600 to-red-500',
    border: 'border-red-400/50',
    glow: 'rgb(239, 68, 68)',
    light: '#f87171',
  },
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  color,
  size = 'md',
}: StatCardProps) {
  const colors = colorMap[color]
  const padding = size === 'sm' ? 'p-3' : size === 'lg' ? 'p-6' : 'p-5'
  const iconSize = size === 'sm' ? 'text-3xl' : size === 'lg' ? 'text-5xl' : 'text-4xl'
  const valueSize = size === 'sm' ? 'text-2xl' : size === 'lg' ? 'text-5xl' : 'text-4xl'

  return (
    <div
      className={`relative bg-gradient-to-br ${colors.gradient} border-2 ${colors.border} rounded-2xl ${padding} overflow-hidden group hover:scale-105 hover:border-opacity-100 transition-all duration-300 cursor-pointer`}
      style={{
        boxShadow: `0 0 30px ${colors.glow}40, inset 0 1px 0 ${colors.glow}20`,
      }}
    >
      {/* Animated background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-black/20 group-hover:from-white/25 group-hover:to-black/10 transition-all duration-300" />
      
      {/* Glow effect on hover */}
      <div 
        className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"
        style={{ background: `radial-gradient(circle, ${colors.glow}40 0%, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-col items-center gap-3">
        {icon && (
          <p 
            className={`${iconSize} group-hover:scale-110 transition-transform duration-300 drop-shadow-lg`}
          >
            {icon}
          </p>
        )}
        
        <div className="flex flex-col items-center gap-1">
          <p className={`${valueSize} font-black text-white drop-shadow-lg`}>
            {value}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-white/90">{label}</p>
        </div>
        
        {subtitle && (
          <p className="text-xs text-white/80 font-semibold">{subtitle}</p>
        )}
      </div>

      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
    </div>
  )
}
