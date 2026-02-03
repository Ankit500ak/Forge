'use client'

interface ProgressionLevel {
  level: number
  title: string
  stats: { name: string; value: number }[]
  milestone?: string
  unlocked: boolean
}

interface ProgressionGridProps {
  levels: ProgressionLevel[]
}

export function ProgressionGrid({ levels }: ProgressionGridProps) {
  return (
    <div className="space-y-8">
      {/* Top Section - Levels 1-7 */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 z-0" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 relative z-10 pt-8">
          {levels.slice(0, 7).map((level, idx) => (
            <div key={idx} className="flex flex-col items-center">
              {/* Top bar */}
              <div className="w-full h-1 bg-orange-600 mb-4 rounded" />
              {/* Pentagon card */}
              <div
                className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center relative ${
                  level.unlocked
                    ? 'border-orange-500 bg-orange-600/20 shadow-lg shadow-orange-500/50'
                    : 'border-gray-600 bg-gray-900/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">Lv.{level.level}</div>
                  <div className="text-xs text-orange-300 mt-1">{level.title}</div>
                </div>
              </div>
              {/* Milestone */}
              {level.milestone && (
                <div className="text-xs text-center text-orange-300 mt-2 font-medium">{level.milestone}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Middle Section - Levels 8-12 */}
      {levels.length > 7 && (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 z-0" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10 pt-8">
            {levels.slice(7, 12).map((level, idx) => (
              <div key={idx + 7} className="flex flex-col items-center">
                <div className="w-full h-1 bg-orange-600 mb-4 rounded" />
                <div
                  className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center relative ${
                    level.unlocked
                      ? 'border-orange-500 bg-orange-600/20 shadow-lg shadow-orange-500/50'
                      : 'border-gray-600 bg-gray-900/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">Lv.{level.level}</div>
                    <div className="text-xs text-orange-300 mt-1">{level.title}</div>
                  </div>
                </div>
                {level.milestone && (
                  <div className="text-xs text-center text-orange-300 mt-2 font-medium">{level.milestone}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Section - Final Levels */}
      {levels.length > 12 && (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 z-0" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10 pt-8">
            {levels.slice(12).map((level, idx) => (
              <div key={idx + 12} className="flex flex-col items-center">
                <div className="w-full h-1 bg-orange-600 mb-4 rounded" />
                <div
                  className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center relative ${
                    level.unlocked
                      ? 'border-orange-500 bg-orange-600/20 shadow-lg shadow-orange-500/50'
                      : 'border-gray-600 bg-gray-900/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">Lv.{level.level}</div>
                    <div className="text-xs text-orange-300 mt-1">{level.title}</div>
                  </div>
                </div>
                {level.milestone && (
                  <div className="text-xs text-center text-orange-300 mt-2 font-medium">{level.milestone}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
