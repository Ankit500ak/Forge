'use client'

import { useAuth } from '@/lib/auth-context'
import { useAppContext } from '@/lib/app-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'
import { ProgressionGrid } from '@/components/progression-grid'
import apiClient from '@/lib/api-client'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function StatsPage() {
  const { user } = useAuth()
  const { stats } = useAppContext()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Fetch real stats from API
  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const response = await apiClient.get('/users/me/game')
        if (response.data?.stats) {
          const dbStats = response.data.stats
          setCurrentStats([
            { name: 'Strength', value: Math.round(dbStats.strength || 0) },
            { name: 'Speed', value: Math.round(dbStats.speed || 0) },
            { name: 'Endurance', value: Math.round(dbStats.endurance || 0) },
            { name: 'Agility', value: Math.round(dbStats.agility || 0) },
            { name: 'Recovery', value: Math.round(dbStats.recovery || 0) },
          ])
          console.log('✅ Loaded real stats for radar chart:', dbStats)
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch stats:', err)
      }
    }
    
    if (user) {
      fetchRealStats()
    }
  }, [user])

  if (!mounted || !user) {
    return null
  }

  // Character progression levels with stat data
  const progressionLevels = [
    {
      level: 1,
      title: 'Novice',
      stats: [
        { name: 'STR', value: 10 },
        { name: 'AGI', value: 10 },
        { name: 'END', value: 10 },
        { name: 'VIT', value: 10 },
        { name: 'INT', value: 10 },
      ],
      unlocked: true,
    },
    {
      level: 5,
      title: 'Apprentice',
      stats: [
        { name: 'STR', value: 25 },
        { name: 'AGI', value: 22 },
        { name: 'END', value: 28 },
        { name: 'VIT', value: 26 },
        { name: 'INT', value: 24 },
      ],
      unlocked: true,
      milestone: 'First Breakthrough',
    },
    {
      level: 10,
      title: 'Warrior',
      stats: [
        { name: 'STR', value: 45 },
        { name: 'AGI', value: 38 },
        { name: 'END', value: 52 },
        { name: 'VIT', value: 48 },
        { name: 'INT', value: 35 },
      ],
      unlocked: true,
      milestone: 'Class Evolution',
    },
    {
      level: 15,
      title: 'Knight',
      stats: [
        { name: 'STR', value: 62 },
        { name: 'AGI', value: 48 },
        { name: 'END', value: 68 },
        { name: 'VIT', value: 70 },
        { name: 'INT', value: 42 },
      ],
      unlocked: true,
    },
    {
      level: 20,
      title: 'Champion',
      stats: [
        { name: 'STR', value: 75 },
        { name: 'AGI', value: 62 },
        { name: 'END', value: 78 },
        { name: 'VIT', value: 80 },
        { name: 'INT', value: 55 },
      ],
      unlocked: true,
      milestone: 'Mythic Rank Unlocked',
    },
    {
      level: 25,
      title: 'Legend',
      stats: [
        { name: 'STR', value: 88 },
        { name: 'AGI', value: 78 },
        { name: 'END', value: 90 },
        { name: 'VIT', value: 92 },
        { name: 'INT', value: 75 },
      ],
      unlocked: false,
    },
    {
      level: 30,
      title: 'Transcendent',
      stats: [
        { name: 'STR', value: 100 },
        { name: 'AGI', value: 95 },
        { name: 'END', value: 100 },
        { name: 'VIT', value: 100 },
        { name: 'INT', value: 95 },
      ],
      unlocked: false,
    },
  ]

  // Monthly progression data
  const progressionData = [
    { month: 'Jan', strength: 70, cardio: 75, agility: 65, health: 80 },
    { month: 'Feb', strength: 72, cardio: 77, agility: 67, health: 82 },
    { month: 'Mar', strength: 74, cardio: 79, agility: 68, health: 83 },
    { month: 'Apr', strength: 76, cardio: 80, agility: 70, health: 85 },
    { month: 'May', strength: 77, cardio: 81, agility: 71, health: 86 },
    { month: 'Jun', strength: 78, cardio: 82, agility: 72, health: 88 },
  ]

  // Current stats radar - using real stats from database scaled to 0-100
  const [currentStats, setCurrentStats] = useState([
    { name: 'Strength', value: 0 },
    { name: 'Speed', value: 0 },
    { name: 'Endurance', value: 0 },
    { name: 'Agility', value: 0 },
    { name: 'Recovery', value: 0 },
  ])

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <main className="overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-card/95 to-card/50 backdrop-blur-sm border-b-2 border-orange-600/50 p-4 z-10">
          <h1 className="text-2xl font-bold text-orange-500">Character Progression</h1>
          <p className="text-muted-foreground text-xs mt-1">Track your journey through levels</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Current Stats Showcase */}
          <section className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
            <h2 className="text-base font-bold text-orange-400 mb-3">Current Attributes</h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={currentStats}>
                <PolarGrid stroke="#3a3a3a" />
                <PolarAngleAxis dataKey="name" stroke="#aaa" />
                <PolarRadiusAxis stroke="#666" domain={[0, 100]} />
                <Radar name="Level" dataKey="value" stroke="#ea580c" fill="#ea580c" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </section>

          {/* Character Progression Timeline */}
          <section className="bg-card border-2 border-orange-600/50 rounded-lg p-6 shadow-lg shadow-orange-600/20">
            <h2 className="text-2xl font-bold text-orange-400 mb-8">Progression Path</h2>
            <ProgressionGrid levels={progressionLevels} />
          </section>

          {/* Stats Growth Over Time */}
          <section className="bg-card border-2 border-orange-600/50 rounded-lg p-6 shadow-lg shadow-orange-600/20">
            <h2 className="text-2xl font-bold text-orange-400 mb-6">6-Month Growth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressionData}>
                <CartesianGrid stroke="#3a3a3a" />
                <XAxis stroke="#888" dataKey="month" />
                <YAxis stroke="#888" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #ea580c',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="strength" stroke="#ea580c" dot={{ r: 4 }} strokeWidth={2} />
                <Line type="monotone" dataKey="cardio" stroke="#f97316" dot={{ r: 4 }} strokeWidth={2} />
                <Line type="monotone" dataKey="agility" stroke="#fb923c" dot={{ r: 4 }} strokeWidth={2} />
                <Line type="monotone" dataKey="health" stroke="#fbbf24" dot={{ r: 4 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          {/* Detailed Stats */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border-2 border-orange-600/50 rounded-lg p-6 shadow-lg shadow-orange-600/20">
              <h3 className="text-xl font-bold text-orange-400 mb-4">Strength Training</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Bench Press: {stats.strength.benchPress} lbs</span>
                    <span className="text-orange-400">Goal: 250 lbs</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 rounded-full"
                      style={{ width: `${(stats.strength.benchPress / 250) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Deadlift: {stats.strength.deadlift} lbs</span>
                    <span className="text-orange-400">Goal: 400 lbs</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 rounded-full"
                      style={{ width: `${(stats.strength.deadlift / 400) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Squat: {stats.strength.squat} lbs</span>
                    <span className="text-orange-400">Goal: 350 lbs</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-600 to-orange-400 h-2 rounded-full"
                      style={{ width: `${(stats.strength.squat / 350) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-orange-600/50 rounded-lg p-6 shadow-lg shadow-orange-600/20">
              <h3 className="text-xl font-bold text-orange-400 mb-4">Health Metrics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-600 pb-2">
                  <span>BMI</span>
                  <span className="text-orange-400 font-bold">{stats.health.bmi}</span>
                </div>
                <div className="flex justify-between border-b border-gray-600 pb-2">
                  <span>Resting Heart Rate</span>
                  <span className="text-orange-400 font-bold">{stats.health.restingHeartRate} bpm</span>
                </div>
                <div className="flex justify-between border-b border-gray-600 pb-2">
                  <span>Sleep Quality</span>
                  <span className="text-orange-400 font-bold">{stats.health.sleepQuality}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Stress Level</span>
                  <span className="text-orange-400 font-bold">{stats.health.stressLevel}%</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
