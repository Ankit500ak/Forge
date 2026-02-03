import { rankThemes, type RankType } from '@/lib/rank-theme-context'

export function getThemeForRank(rank: RankType) {
  return rankThemes[rank]
}

export function getGradientClasses(rank: RankType, type: 'gradient' | 'badge' | 'glow' = 'gradient') {
  const theme = rankThemes[rank]
  
  switch (type) {
    case 'badge':
      return `bg-gradient-to-br ${theme.badgeGradient}`
    case 'glow':
      return `shadow-lg shadow-${theme.accent.main}/50`
    case 'gradient':
    default:
      return `bg-gradient-to-r ${theme.gradient}`
  }
}

export function getBorderColor(rank: RankType) {
  return rankThemes[rank].borderColor
}

export function getAccentColor(rank: RankType, shade: 'light' | 'main' | 'dark' = 'main') {
  return rankThemes[rank].accent[shade]
}

export function getPrimaryColor(rank: RankType, shade: 'light' | 'main' | 'dark' = 'main') {
  return rankThemes[rank].primary[shade]
}

export function getRankEmoji(rank: RankType) {
  return rankThemes[rank].emoji
}

export function getRankDescription(rank: RankType) {
  return rankThemes[rank].description
}
