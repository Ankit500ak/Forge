'use client'

import React, { createContext, useContext, useMemo } from 'react'

export type RankType = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface RankTheme {
  rank: RankType
  name: string
  primary: {
    light: string
    main: string
    dark: string
  }
  accent: {
    light: string
    main: string
    dark: string
  }
  gradient: string
  shadowColor: string
  borderColor: string
  badgeGradient: string
  glowEffect: string
  emoji: string
  description: string
}

export const rankThemes: Record<RankType, RankTheme> = {
  S: {
    rank: 'S',
    name: 'Supreme',
    primary: { light: 'from-purple-400', main: 'from-purple-600', dark: 'to-purple-700' },
    accent: { light: 'purple-400', main: 'purple-500', dark: 'purple-600' },
    gradient: 'from-purple-600 via-purple-500 to-purple-400',
    shadowColor: 'shadow-purple-500/50',
    borderColor: 'border-purple-500/50',
    badgeGradient: 'from-purple-600 to-purple-700',
    glowEffect: 'glow-purple',
    emoji: '👑',
    description: 'Supreme Elite',
  },
  A: {
    rank: 'A',
    name: 'Elite',
    primary: { light: 'from-blue-400', main: 'from-blue-600', dark: 'to-blue-700' },
    accent: { light: 'blue-400', main: 'blue-500', dark: 'blue-600' },
    gradient: 'from-blue-600 via-blue-500 to-blue-400',
    shadowColor: 'shadow-blue-500/50',
    borderColor: 'border-blue-500/50',
    badgeGradient: 'from-blue-600 to-blue-700',
    glowEffect: 'glow-blue',
    emoji: '🏆',
    description: 'Elite Warrior',
  },
  B: {
    rank: 'B',
    name: 'Champion',
    primary: { light: 'from-cyan-400', main: 'from-cyan-600', dark: 'to-cyan-700' },
    accent: { light: 'cyan-400', main: 'cyan-500', dark: 'cyan-600' },
    gradient: 'from-cyan-600 via-cyan-500 to-cyan-400',
    shadowColor: 'shadow-cyan-500/50',
    borderColor: 'border-cyan-500/50',
    badgeGradient: 'from-cyan-600 to-cyan-700',
    glowEffect: 'glow-cyan',
    emoji: '⭐',
    description: 'Champion Athlete',
  },
  C: {
    rank: 'C',
    name: 'Expert',
    primary: { light: 'from-green-400', main: 'from-green-600', dark: 'to-green-700' },
    accent: { light: 'green-400', main: 'green-500', dark: 'green-600' },
    gradient: 'from-green-600 via-green-500 to-green-400',
    shadowColor: 'shadow-green-500/50',
    borderColor: 'border-green-500/50',
    badgeGradient: 'from-green-600 to-green-700',
    glowEffect: 'glow-green',
    emoji: '💪',
    description: 'Expert Trainer',
  },
  D: {
    rank: 'D',
    name: 'Master',
    primary: { light: 'from-yellow-400', main: 'from-yellow-600', dark: 'to-yellow-700' },
    accent: { light: 'yellow-400', main: 'yellow-500', dark: 'yellow-600' },
    gradient: 'from-yellow-600 via-yellow-500 to-yellow-400',
    shadowColor: 'shadow-yellow-500/50',
    borderColor: 'border-yellow-500/50',
    badgeGradient: 'from-yellow-600 to-yellow-700',
    glowEffect: 'glow-yellow',
    emoji: '🔥',
    description: 'Master Fitness',
  },
  E: {
    rank: 'E',
    name: 'Veteran',
    primary: { light: 'from-orange-400', main: 'from-orange-600', dark: 'to-orange-700' },
    accent: { light: 'orange-400', main: 'orange-500', dark: 'orange-600' },
    gradient: 'from-orange-600 via-orange-500 to-orange-400',
    shadowColor: 'shadow-orange-500/50',
    borderColor: 'border-orange-500/50',
    badgeGradient: 'from-orange-600 to-orange-700',
    glowEffect: 'glow-orange',
    emoji: '⚔️',
    description: 'Veteran Fighter',
  },
  F: {
    rank: 'F',
    name: 'Novice',
    primary: { light: 'from-slate-400', main: 'from-slate-600', dark: 'to-slate-700' },
    accent: { light: 'slate-400', main: 'slate-500', dark: 'slate-600' },
    gradient: 'from-slate-600 via-slate-500 to-slate-400',
    shadowColor: 'shadow-slate-500/50',
    borderColor: 'border-slate-500/50',
    badgeGradient: 'from-slate-600 to-slate-700',
    glowEffect: 'glow-slate',
    emoji: '🌱',
    description: 'Novice Journey',
  },
}

interface RankThemeContextType {
  currentRank: RankType
  theme: RankTheme
  getAccentColor: (shade?: 'light' | 'main' | 'dark') => string
  getPrimaryColor: (shade?: 'light' | 'main' | 'dark') => string
}

const RankThemeContext = createContext<RankThemeContextType | undefined>(undefined)

export function RankThemeProvider({
  children,
  userRank,
}: {
  children: React.ReactNode
  userRank: RankType
}) {
  const value = useMemo(() => {
    const theme = rankThemes[userRank]
    return {
      currentRank: userRank,
      theme,
      getAccentColor: (shade: 'light' | 'main' | 'dark' = 'main') => {
        return theme.accent[shade]
      },
      getPrimaryColor: (shade: 'light' | 'main' | 'dark' = 'main') => {
        return theme.primary[shade]
      },
    }
  }, [userRank])

  return (
    <RankThemeContext.Provider value={value}>
      {children}
    </RankThemeContext.Provider>
  )
}

export function useRankTheme() {
  const context = useContext(RankThemeContext)
  if (!context) {
    throw new Error('useRankTheme must be used within RankThemeProvider')
  }
  return context
}
