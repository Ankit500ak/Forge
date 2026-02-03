'use client'

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface StatPentagonChartProps {
  level: number
  stats: { name: string; value: number }[]
  maxValue?: number
  color?: string
}

export function StatPentagonChart({ level, stats, maxValue = 100, color = '#ea580c' }: StatPentagonChartProps) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Level Badge */}
      <div className="absolute top-2 left-2 bg-orange-600/80 border-2 border-orange-400 rounded-lg px-3 py-1 font-bold text-white text-sm shadow-lg">
        Lv.{level}
      </div>

      {/* Pentagon Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={stats} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <PolarGrid stroke="#4a4a4a" />
          <PolarAngleAxis dataKey="name" stroke="#888" tick={{ fontSize: 11, fill: '#ccc' }} />
          <PolarRadiusAxis stroke="#666" domain={[0, maxValue]} />
          <Radar name="Stats" dataKey="value" stroke={color} fill={color} fillOpacity={0.7} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
