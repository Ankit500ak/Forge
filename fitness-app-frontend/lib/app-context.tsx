'use client'

import React, { createContext, useContext, useState } from 'react'

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<UserStats>({
    strength: {
      benchPress: 185,
      deadlift: 315,
      squat: 275,
      totalLifted: 156420,
      goal: 200000,
    },
    cardio: {
      distanceRun: 45.2,
      caloriesBurned: 28500,
      sessions: 24,
      longestRun: 8.5,
      goal: 500,
    },
    agility: {
      speed: 12.5,
      reflexTime: 220,
      flexibility: 72,
      goal: 100,
    },
    health: {
      bmi: 22.5,
      restingHeartRate: 62,
      sleepQuality: 85,
      stressLevel: 35,
      goal: 90,
    },
    xpGained: 15000,
    weeklyXp: 3400,
    monthlyXp: 12500,
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
