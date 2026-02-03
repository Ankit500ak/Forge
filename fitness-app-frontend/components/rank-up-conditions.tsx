"use client"

import React, { useState, useEffect } from 'react'
import apiClient from '@/lib/api-client'

// ============================================================================
// RANK-UP CONDITIONS & THRESHOLDS
// ============================================================================

interface RankUpRequirements {
  rank: string
  nextRank: string
  xpRequired: number
  tasksRequired: number
  streakRequired: number
  statRequirements: {
    strength: number
    speed: number
    endurance: number
    agility: number
    power: number
    recovery: number
  }
  challengeTasks: number
}

// Default theme for rank-up conditions
const DEFAULT_THEME = {
  colors: {
    primary: '#9370db',
    secondary: '#ba55d3',
    gradient: 'from-purple-500 via-violet-400 to-purple-600',
    accentFrom: 'from-purple-400',
    accentTo: 'to-violet-600',
    shadow: 'shadow-purple-500/90',
    border: 'border-purple-400/80',
    bgPattern: 'from-purple-900/50',
    textGlow: 'drop-shadow-[0_0_18px_rgba(147,112,219,1)]',
  },
  effects: {
    particle: '👑',
    glowIntensity: 0.8,
    pulseSpeed: '1.8s',
    rotationSpeed: '10s',
    hasAura: true,
  },
}

const RANK_UP_THRESHOLDS: Record<string, RankUpRequirements> = {
  F: {
    rank: 'F',
    nextRank: 'E',
    xpRequired: 40000,
    tasksRequired: 10,
    streakRequired: 5,
    statRequirements: {
      strength: 10,
      speed: 10,
      endurance: 10,
      agility: 10,
      power: 10,
      recovery: 10,
    },
    challengeTasks: 0,
  },
  E: {
    rank: 'E',
    nextRank: 'D',
    xpRequired: 160000,
    tasksRequired: 30,
    streakRequired: 14,
    statRequirements: {
      strength: 20,
      speed: 20,
      endurance: 20,
      agility: 20,
      power: 20,
      recovery: 20,
    },
    challengeTasks: 0,
  },
  D: {
    rank: 'D',
    nextRank: 'C',
    xpRequired: 400000,
    tasksRequired: 75,
    streakRequired: 30,
    statRequirements: {
      strength: 35,
      speed: 35,
      endurance: 35,
      agility: 35,
      power: 35,
      recovery: 35,
    },
    challengeTasks: 0,
  },
  C: {
    rank: 'C',
    nextRank: 'B',
    xpRequired: 600000,
    tasksRequired: 150,
    streakRequired: 60,
    statRequirements: {
      strength: 30,
      speed: 30,
      endurance: 30,
      agility: 30,
      power: 30,
      recovery: 30,
    },
    challengeTasks: 0,
  },
  B: {
    rank: 'B',
    nextRank: 'A',
    xpRequired: 1200000,
    tasksRequired: 300,
    streakRequired: 90,
    statRequirements: {
      strength: 50,
      speed: 50,
      endurance: 50,
      agility: 50,
      power: 50,
      recovery: 50,
    },
    challengeTasks: 5,
  },
  A: {
    rank: 'A',
    nextRank: 'A+',
    xpRequired: 1800000,
    tasksRequired: 500,
    streakRequired: 120,
    statRequirements: {
      strength: 70,
      speed: 70,
      endurance: 70,
      agility: 70,
      power: 70,
      recovery: 70,
    },
    challengeTasks: 10,
  },
  'A+': {
    rank: 'A+',
    nextRank: 'S',
    xpRequired: 3600000,
    tasksRequired: 750,
    streakRequired: 150,
    statRequirements: {
      strength: 85,
      speed: 85,
      endurance: 85,
      agility: 85,
      power: 85,
      recovery: 85,
    },
    challengeTasks: 25,
  },
  S: {
    rank: 'S',
    nextRank: 'S+',
    xpRequired: 12000000,
    tasksRequired: 1000,
    streakRequired: 180,
    statRequirements: {
      strength: 100,
      speed: 100,
      endurance: 100,
      agility: 100,
      power: 100,
      recovery: 100,
    },
    challengeTasks: 50,
  },
  'S+': {
    rank: 'S+',
    nextRank: 'SS+',
    xpRequired: 25000000,
    tasksRequired: 1500,
    streakRequired: 365,
    statRequirements: {
      strength: 100,
      speed: 100,
      endurance: 100,
      agility: 100,
      power: 100,
      recovery: 100,
    },
    challengeTasks: 100,
  },
}

// ============================================================================
// COMPONENT: RankUpProgressBar
// ============================================================================

interface RankUpProgressBarProps {
  current: number
  required: number
  label: string
  icon: string
  color: string
}

function RankUpProgressBar({ current, required, label, icon, color }: RankUpProgressBarProps) {
  const percentage = Math.min((current / required) * 100, 100)
  const isMet = current >= required

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-bold text-white/80">{label}</span>
        </div>
        <span className={`text-sm font-black ${isMet ? 'text-emerald-400' : 'text-white/60'}`}>
          {current.toLocaleString()} / {required.toLocaleString()}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isMet
              ? 'bg-gradient-to-r from-emerald-500 to-green-400'
              : `bg-gradient-to-r ${color}`
          }`}
          style={{
            width: `${percentage}%`,
            boxShadow: isMet
              ? '0 0 10px rgba(16, 185, 129, 0.5)'
              : `0 0 10px ${color}40`
          }}
        />
      </div>
      {isMet && (
        <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">✓ Requirement Met</div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENT: StatRequirementItem
// ============================================================================

interface StatRequirementItemProps {
  statName: string
  required: number
  current: number
  icon: string
  color: string
}

function StatRequirementItem({ statName, required, current, icon, color }: StatRequirementItemProps) {
  const isMet = current >= required
  const percentage = Math.min((current / required) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-xs font-bold text-white/70">{statName}</span>
        </div>
        <span className={`text-xs font-black ${isMet ? 'text-emerald-400' : 'text-white/50'}`}>
          {current}/{required}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isMet ? 'bg-emerald-500' : color
          }`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENT: RankUpConditions
// ============================================================================

interface RankUpConditionsProps {
  currentRank: string
  totalXP: number
  currentLevel?: number
  globalRank?: number
  stats?: {
    strength: number
    speed: number
    endurance: number
    agility: number
    power: number
    recovery: number
  }
  tasksCompleted?: number
  currentStreak?: number
  theme: any
}

export function RankUpConditions({
  currentRank,
  totalXP,
  currentLevel = 1,
  globalRank = 999999,
  stats = {
    strength: 0,
    speed: 0,
    endurance: 0,
    agility: 0,
    power: 0,
    recovery: 0,
  },
  tasksCompleted = 0,
  currentStreak = 0,
  theme,
}: RankUpConditionsProps) {
  // Use default theme if not provided or missing colors
  const activeTheme = theme?.colors ? theme : DEFAULT_THEME
  
  const requirements = RANK_UP_THRESHOLDS[currentRank]
  
  if (!requirements) {
    return null
  }

  // CUMULATIVE XP thresholds based on RANK_THEMES in game-stats.tsx
  const XP_THRESHOLDS: Record<string, number> = {
    F: 0,
    E: 4000,
    D: 20000,
    C: 60000,
    B: 120000,
    A: 240000,
    'A+': 600000,
    S: 1200000,
    'S+': 2400000,
    'SS+': 5000000,
  }

  // Current XP progress toward next rank
  const currentThreshold = XP_THRESHOLDS[currentRank] || 0
  const nextThreshold = requirements.xpRequired
  const xpInCurrentRank = totalXP - currentThreshold
  const xpNeededForNextRank = nextThreshold - currentThreshold
  const xpProgress = Math.max(0, xpInCurrentRank)
  const xpRemaining = Math.max(0, nextThreshold - totalXP)
  const xpPercentage = Math.min((xpProgress / xpNeededForNextRank) * 100, 100)

  const statIcons: Record<string, string> = {
    strength: '💪',
    speed: '🏃',
    endurance: '❤️',
    agility: '🤸',
    power: '⚡',
    recovery: '🧘',
  }

  const statColors: Record<string, string> = {
    strength: 'from-red-600 to-red-500',
    speed: 'from-blue-600 to-blue-500',
    endurance: 'from-purple-600 to-purple-500',
    agility: 'from-cyan-600 to-cyan-500',
    power: 'from-yellow-600 to-yellow-500',
    recovery: 'from-green-600 to-green-500',
  }

  const allStatsRequirementsMet = Object.entries(requirements.statRequirements).every(
    ([stat, required]) => stats[stat as keyof typeof stats] >= required
  )
  
  // Check if S rank and level 100 (max progression)
  const isMaxRank = currentRank === 'S' && currentLevel >= 100
  
  // For S+/SS+ ranks, check global ranking instead
  const globalRankRequirement = currentRank === 'S+' ? 1000 : currentRank === 'SS+' ? 100 : 999999
  const globalRankMet = globalRank <= globalRankRequirement
  
  const meetsXpRequirement = totalXP >= nextThreshold
  const meetsTaskRequirement = tasksCompleted >= requirements.tasksRequired
  const meetsStreakRequirement = currentStreak >= requirements.streakRequired
  
  const allRequirementsMet = 
    !isMaxRank &&
    meetsXpRequirement &&
    meetsTaskRequirement &&
    meetsStreakRequirement &&
    allStatsRequirementsMet

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 bg-gradient-to-br from-slate-950 via-black to-slate-950 shadow-2xl"
      style={{ borderColor: `${activeTheme.colors.primary}40` }}
    >
      {/* Background effects */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${activeTheme.colors.primary}30 0%, transparent 50%), 
                      radial-gradient(circle at 70% 80%, ${activeTheme.colors.secondary}20 0%, transparent 50%)`,
          animation: 'pulse 6s ease-in-out infinite'
        }}
      />

      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative p-5 sm:p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⬆️</div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {requirements.nextRank} Rank Requirements
              </h3>
              <p className="text-sm text-white/60">
                Progress to become a {requirements.nextRank} rank hunter
              </p>
            </div>
          </div>

          {/* Overall Progress */}
          {isMaxRank ? (
            <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/50">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👑</span>
                <span className="font-black text-orange-300 uppercase tracking-wider">
                  Maximum Level Reached - Level 100 / S Rank
                </span>
              </div>
            </div>
          ) : allRequirementsMet ? (
            <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/50">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <span className="font-black text-emerald-300 uppercase tracking-wider">
                  Ready for Rank-Up!
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* XP Requirement */}
          <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-lg font-black text-white flex items-center gap-2">
              <span>⚡</span> Experience Points
            </h4>
            <RankUpProgressBar
              current={Math.round(xpProgress)}
              required={xpNeededForNextRank}
              label="XP Progress"
              icon="💎"
              color="from-purple-600 to-purple-500"
            />
            <div className="text-xs text-white/50">
              {xpRemaining.toLocaleString()} XP remaining to rank up
            </div>
          </div>

          {/* Tasks Requirement */}
          <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-lg font-black text-white flex items-center gap-2">
              <span>✅</span> Task Completion
            </h4>
            <RankUpProgressBar
              current={tasksCompleted}
              required={requirements.tasksRequired}
              label="Tasks"
              icon="📋"
              color="from-blue-600 to-blue-500"
            />
            <div className="text-xs text-white/50">
              {Math.max(0, requirements.tasksRequired - tasksCompleted).toLocaleString()} tasks remaining
            </div>
          </div>

          {/* Streak Requirement */}
          <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-lg font-black text-white flex items-center gap-2">
              <span>🔥</span> Activity Streak
            </h4>
            <RankUpProgressBar
              current={currentStreak}
              required={requirements.streakRequired}
              label="Consecutive Days"
              icon="📅"
              color="from-orange-600 to-orange-500"
            />
            <div className="text-xs text-white/50">
              {Math.max(0, requirements.streakRequired - currentStreak)} days remaining
            </div>
          </div>

          {/* Challenge Tasks */}
          {requirements.challengeTasks > 0 && (
            <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-lg font-black text-white flex items-center gap-2">
                <span>🏆</span> Challenge Tasks
              </h4>
              <RankUpProgressBar
                current={0}
                required={requirements.challengeTasks}
                label="Expert Tasks"
                icon="⭐"
                color="from-pink-600 to-pink-500"
              />
              <div className="text-xs text-white/50">
                {requirements.challengeTasks} advanced tasks required
              </div>
            </div>
          )}
        </div>

        {/* Stat Requirements */}
        <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-lg font-black text-white flex items-center gap-2">
            <span>📊</span> Stat Development
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(Object.entries(requirements.statRequirements) as [keyof typeof stats, number][]).map(
              ([stat, required]) => (
                <StatRequirementItem
                  key={stat}
                  statName={stat.charAt(0).toUpperCase() + stat.slice(1)}
                  required={required}
                  current={stats[stat] || 0}
                  icon={statIcons[stat]}
                  color={statColors[stat]}
                />
              )
            )}
          </div>
        </div>

        {/* Special Message for S Rank at Level 100 */}
        {isMaxRank && (
          <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌍</span>
              <div className="space-y-2 flex-1">
                <p className="font-black text-cyan-300 uppercase tracking-wider">Global Ranking Unlocked</p>
                <p className="text-sm text-white/70">
                  Congratulations! You've reached the maximum level (100) at S rank. Your further progression is now determined by your position in the global hunter rankings.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-500/30">
                  <div className="text-center">
                    <div className="text-lg font-black text-cyan-300">S+</div>
                    <div className="text-xs text-white/50">Top 1,000 Hunters</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-amber-300">SS+</div>
                    <div className="text-xs text-white/50">Top 100 Hunters</div>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span className="text-sm font-bold">Your Global Rank: <span className="text-cyan-300">{globalRank.toLocaleString()}</span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rank-Up Button */}
        {!isMaxRank && (
          <button
            disabled={!allRequirementsMet}
            className={`w-full py-3 px-6 rounded-xl font-black text-white uppercase tracking-wider transition-all duration-300 ${
              allRequirementsMet
                ? `bg-gradient-to-r ${activeTheme.colors.accentFrom} ${activeTheme.colors.accentTo} hover:scale-105 shadow-lg cursor-pointer`
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
            style={
              allRequirementsMet
                ? {
                    boxShadow: `0 0 30px ${activeTheme.colors.primary}50`
                  }
                : {}
            }
          >
            {allRequirementsMet ? `✨ Rank Up to ${requirements.nextRank}!` : 'Complete Requirements to Rank Up'}
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

export { RANK_UP_THRESHOLDS }
