'use client'

import { useAuth } from '@/lib/auth-context'
import { useAppContext } from '@/lib/app-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navigation from '@/components/navigation'
import apiClient from '@/lib/api-client'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export default function StatsPage() {
  const { user } = useAuth()
  const { stats } = useAppContext()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // State for API data
  const [loading, setLoading] = useState(true)
  const [gameStats, setGameStats] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalTasks, setTotalTasks] = useState(0)

  useEffect(() => {
    setMounted(true)
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Fetch real stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Fetch game stats
        const gameResponse = await apiClient.get('/users/me/game')
        if (gameResponse.data?.stats) {
          setGameStats(gameResponse.data.stats)
        }

        // Fetch user stats
        const userResponse = await apiClient.get('/users/me')
        if (userResponse.data) {
          setUserStats(userResponse.data)
        }

        // Fetch today's tasks to get completion stats
        const tasksResponse = await apiClient.get('/tasks/today')
        if (tasksResponse.data?.tasks) {
          const tasks = tasksResponse.data.tasks
          setTotalTasks(tasks.length)
          setCompletedCount(tasks.filter((t: any) => t.completed).length)
        }

        setLoading(false)
      } catch (err) {
        console.warn('⚠️ Failed to fetch stats:', err)
        setLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  if (!mounted || !user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 border-r-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your stats...</p>
        </div>
      </div>
    )
  }

  // Prepare radar chart data from actual stats
  const radarData = gameStats ? [
    { name: 'Strength', value: Math.min(gameStats.strength || 0, 100) },
    { name: 'Speed', value: Math.min(gameStats.speed || 0, 100) },
    { name: 'Endurance', value: Math.min(gameStats.endurance || 0, 100) },
    { name: 'Agility', value: Math.min(gameStats.agility || 0, 100) },
    { name: 'Recovery', value: Math.min(gameStats.recovery || 0, 100) },
  ] : []

  // Sample category breakdown
  const categoryStats = [
    { name: 'Cardio', value: 35, fill: '#ea580c' },
    { name: 'Strength', value: 30, fill: '#f97316' },
    { name: 'Flexibility', value: 20, fill: '#fb923c' },
    { name: 'Recovery', value: 15, fill: '#fbbf24' },
  ]

  // Sample progress data
  const progressData = [
    { week: 'W1', xp: 450, tasks: 12, completed: 10 },
    { week: 'W2', xp: 520, tasks: 14, completed: 13 },
    { week: 'W3', xp: 480, tasks: 11, completed: 10 },
    { week: 'W4', xp: 650, tasks: 16, completed: 15 },
  ]

  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <main className="overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-card/95 to-card/50 backdrop-blur-sm border-b-2 border-orange-600/50 p-4 z-10">
          <h1 className="text-2xl font-bold text-orange-500">📊 Statistics</h1>
          <p className="text-muted-foreground text-xs mt-1">Your performance metrics and progress</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Key Metrics - Quick Stats */}
          <section className="grid grid-cols-2 gap-3">
            <div className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
              <p className="text-xs text-muted-foreground mb-1">Total XP</p>
              <p className="text-2xl font-bold text-orange-400">{userStats?.total_xp || 0}</p>
              <p className="text-xs text-green-400 mt-1">+{Math.floor((userStats?.total_xp || 0) / 10)} this week</p>
            </div>

            <div className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
              <p className="text-xs text-muted-foreground mb-1">Current Level</p>
              <p className="text-2xl font-bold text-orange-400">{userStats?.level || 1}</p>
              <p className="text-xs text-purple-400 mt-1">⭐ {userStats?.rank || 'Novice'}</p>
            </div>

            <div className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
              <p className="text-xs text-muted-foreground mb-1">Tasks Completed</p>
              <p className="text-2xl font-bold text-orange-400">{completedCount}/{totalTasks}</p>
              <p className="text-xs text-blue-400 mt-1">{completionPercentage}% today</p>
            </div>

            <div className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
              <p className="text-xs text-muted-foreground mb-1">Streak</p>
              <p className="text-2xl font-bold text-orange-400">7 days</p>
              <p className="text-xs text-yellow-400 mt-1">🔥 On fire!</p>
            </div>
          </section>

          {/* Current Attributes Radar */}
          <section className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
            <h2 className="text-base font-bold text-orange-400 mb-3">Character Attributes</h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#3a3a3a" />
                  <PolarAngleAxis dataKey="name" stroke="#aaa" />
                  <PolarRadiusAxis stroke="#666" domain={[0, 100]} />
                  <Radar name="Stats" dataKey="value" stroke="#ea580c" fill="#ea580c" fillOpacity={0.6} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '2px solid #ea580c',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Completing tasks will unlock your attributes...</p>
            )}
          </section>

          {/* Weekly Progress Chart */}
          <section className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
            <h2 className="text-base font-bold text-orange-400 mb-3">Weekly Progress</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={progressData}>
                <CartesianGrid stroke="#3a3a3a" />
                <XAxis stroke="#888" dataKey="week" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #ea580c',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="xp" stroke="#ea580c" name="XP Earned" dot={{ r: 4 }} strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#f97316" name="Tasks Done" dot={{ r: 4 }} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          {/* Category Breakdown */}
          <section className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
            <h2 className="text-base font-bold text-orange-400 mb-3">Activity Breakdown</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #ea580c',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </section>

          {/* Detailed Stats Grid */}
          <section className="grid md:grid-cols-2 gap-3">
            <div className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
              <h3 className="text-base font-bold text-orange-400 mb-3">Physical Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strength</span>
                  <span className="text-orange-400 font-bold">{gameStats?.strength || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed</span>
                  <span className="text-orange-400 font-bold">{gameStats?.speed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endurance</span>
                  <span className="text-orange-400 font-bold">{gameStats?.endurance || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agility</span>
                  <span className="text-orange-400 font-bold">{gameStats?.agility || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recovery</span>
                  <span className="text-orange-400 font-bold">{gameStats?.recovery || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
              <h3 className="text-base font-bold text-orange-400 mb-3">User Profile</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-blue-400 font-bold">{userStats?.name || 'Warrior'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-blue-400 font-bold text-xs">{userStats?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fitness Level</span>
                  <span className="text-purple-400 font-bold capitalize">{userStats?.fitness_level || 'Beginner'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age</span>
                  <span className="text-green-400 font-bold">{userStats?.age || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="text-yellow-400 font-bold text-xs">Mar 2026</span>
                </div>
              </div>
            </div>
          </section>

          {/* Achievement Section */}
          <section className="bg-card border-2 border-orange-600/50 rounded-lg p-4 shadow-lg shadow-orange-600/20">
            <h3 className="text-base font-bold text-orange-400 mb-3">🏆 Achievements</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-background/50 rounded p-3 text-center">
                <p className="text-xl mb-1">🥇</p>
                <p className="text-xs font-bold">First Steps</p>
                <p className="text-xs text-muted-foreground">1 task done</p>
              </div>
              <div className="bg-background/50 rounded p-3 text-center">
                <p className="text-xl mb-1">🔥</p>
                <p className="text-xs font-bold">On Fire</p>
                <p className="text-xs text-muted-foreground">7-day streak</p>
              </div>
              <div className="bg-background/50 rounded p-3 text-center opacity-50">
                <p className="text-xl mb-1">⭐</p>
                <p className="text-xs font-bold">100 XP</p>
                <p className="text-xs text-muted-foreground">Locked</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
