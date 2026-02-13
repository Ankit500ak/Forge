'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import apiClient from './api-client'

export interface InventoryItem {
  id: string
  name: string
  description: string
  icon: string
  category: 'equipment' | 'achievement'
  value: number
  acquired: boolean
  acquiredDate?: string
}

export interface UserStats {
  strength: {
    benchPress: number
    deadlift: number
    squat: number
    totalLifted: number
    goal: number
  }
  cardio: {
    distanceRun: number
    caloriesBurned: number
    sessions: number
    longestRun: number
    goal: number
  }
  agility: {
    speed: number // mph
    reflexTime: number // ms
    flexibility: number // 0-100
    goal: number
  }
  health: {
    bmi: number
    restingHeartRate: number
    sleepQuality: number // 0-100
    stressLevel: number // 0-100
    goal: number
  }
  xpGained: number
  weeklyXp: number
  monthlyXp: number
}

interface AppContextType {
  stats: UserStats
  inventory: InventoryItem[]
  addStatPoints: (points: number, activity: string) => void
  unlockItem: (itemId: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Helper to map database stats (0-100 scale) to app format
function mapDatabaseStatsToAppFormat(dbStats: any): UserStats {
  const strength = dbStats?.strength ?? 0
  const speed = dbStats?.speed ?? 0
  const endurance = dbStats?.endurance ?? 0
  const power = dbStats?.power ?? 0
  const recovery = dbStats?.recovery ?? 0

  return {
    strength: {
      benchPress: Math.round(strength * 2.5), // Scale 0-100 to realistic bench press
      deadlift: Math.round(strength * 3.5),
      squat: Math.round(strength * 3),
      totalLifted: Math.round(strength * 1564.2), // Scaled realistic total
      goal: 200000,
    },
    cardio: {
      distanceRun: (endurance * 0.5), // Scale to miles
      caloriesBurned: Math.round(endurance * 285), // Scaled calories
      sessions: Math.round((endurance + speed) / 2), // Average of two stats
      longestRun: (endurance * 0.085), // Scale to miles
      goal: 500,
    },
    agility: {
      speed: 5 + (speed * 0.065), // Base 5 mph + scaled speed
      reflexTime: 300 - (speed * 2), // Lower is better, so inverse
      flexibility: (strength + power) / 2, // Mix of stats
      goal: 100,
    },
    health: {
      bmi: 25 - (power * 0.1), // Lower is healthier
      restingHeartRate: 70 - (recovery * 0.5), // Recovery affects heart rate
      sleepQuality: recovery + (endurance * 0.2), // Recovery + endurance
      stressLevel: 100 - (recovery * 1.2), // Recovery reduces stress
      goal: 90,
    },
    xpGained: 0,
    weeklyXp: 0,
    monthlyXp: 0,
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<UserStats>({
    strength: {
      benchPress: 0,
      deadlift: 0,
      squat: 0,
      totalLifted: 0,
      goal: 200000,
    },
    cardio: {
      distanceRun: 0,
      caloriesBurned: 0,
      sessions: 0,
      longestRun: 0,
      goal: 500,
    },
    agility: {
      speed: 5,
      reflexTime: 300,
      flexibility: 0,
      goal: 100,
    },
    health: {
      bmi: 25,
      restingHeartRate: 70,
      sleepQuality: 0,
      stressLevel: 100,
      goal: 90,
    },
    xpGained: 0,
    weeklyXp: 0,
    monthlyXp: 0,
  })

  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Iron Gauntlets',
      description: 'Legendary lifting gloves. +15% grip strength',
      icon: '🥊',
      category: 'equipment',
      value: 500,
      acquired: true,
      acquiredDate: '2024-06-15',
    },
    {
      id: '2',
      name: 'Warrior\'s Headband',
      description: 'Increases focus and endurance. +10% stamina',
      icon: '🎖️',
      category: 'equipment',
      value: 450,
      acquired: true,
      acquiredDate: '2024-06-10',
    },
    {
      id: '3',
      name: 'Titan\'s Belt',
      description: 'Back support and power. +20% lifting power',
      icon: '⚙️',
      category: 'equipment',
      value: 750,
      acquired: false,
    },
    {
      id: '4',
      name: 'First Step',
      description: 'Complete your first workout',
      icon: '🏆',
      category: 'achievement',
      value: 0,
      acquired: true,
      acquiredDate: '2024-05-20',
    },
    {
      id: '5',
      name: 'Century Lifter',
      description: 'Complete 100 workouts',
      icon: '⭐',
      category: 'achievement',
      value: 0,
      acquired: true,
      acquiredDate: '2024-08-12',
    },
    {
      id: '6',
      name: 'Elite Boots',
      description: 'Run with incredible speed. +25% cardio efficiency',
      icon: '👟',
      category: 'equipment',
      value: 600,
      acquired: false,
    },
  ])

  // Fetch real stats from API on mount
  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const response = await apiClient.get('/users/me/game')
        if (response.data?.stats) {
          const realStats = mapDatabaseStatsToAppFormat(response.data.stats)
          setStats(realStats)
          console.log('✅ Loaded real stats from database:', response.data.stats)
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch real stats, using defaults:', err)
      }
    }
    fetchRealStats()
  }, [])

  const addStatPoints = (points: number, activity: string) => {
    console.log(`Added ${points} points for ${activity}`)
  }

  const unlockItem = (itemId: string) => {
    setInventory(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, acquired: true, acquiredDate: new Date().toISOString() }
          : item
      )
    )
  }

  return (
    <AppContext.Provider value={{ stats, inventory, addStatPoints, unlockItem }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}
