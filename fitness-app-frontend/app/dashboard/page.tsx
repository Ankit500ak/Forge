'use client'

import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/lib/protected-route'
import { useAppContext } from '@/lib/app-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Navigation from '@/components/navigation'
import { useRankTheme } from '@/lib/rank-theme-context'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { SectionCard } from '@/components/dashboard/section-card'
import { QuestsSection } from '@/components/dashboard/quests-section'
import { NextLevelSection } from '@/components/dashboard/next-level-section'
import { EnhancedHeaderV2 } from '@/components/dashboard/enhanced-header-v2'
import GameStats from '@/components/game-stats'
import PowerAnalysisSection from '@/components/dashboard/power-analysis-section'  
import MovementTrackingChart from '@/components/dashboard/movementtrackingchart'
import apiClient from '@/lib/api-client'

function DashboardContent() {
  const { user, logout } = useAuth()
  const { stats } = useAppContext()
  const { theme } = useRankTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  type TodayTask = {
    id: number
    name: string
    icon: string
    duration: string
    completed: boolean
    xp: number
    category: string
    details: string
    stat_rewards: Record<string, number>
  }

  // Helper function to transform tasks safely - inside component
  const transformTask = (task: any, index: number): TodayTask => {
    let id = task.id;
    if (typeof id === 'string') {
      id = parseInt(id, 10);
    }
    // Use combination of index and task name for unique fallback
    if (isNaN(id)) {
      id = index + 1; // Add 1 to avoid id: 0
    }
    return {
      id: Number(`${index}${id}`), // Create composite unique ID
      name: task.title,
      icon: '⚔️',
      duration: '20 min',
      completed: task.completed,
      xp: task.xp_reward,
      category: task.category,
      details: task.description || 'Complete this task to earn XP',
      stat_rewards: task.stat_rewards || {},
    };
  }

  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [progression, setProgression] = useState<any>(null)
  const [progressionStats, setProgressionStats] = useState({
    strength: 0,
    speed: 0,
    endurance: 0,
    agility: 0,
    power: 0,
    recovery: 0,
  })
  const [tasksCompleted, setTasksCompleted] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const levelProgress = (stats.weeklyXp / 4000) * 100
  const [xpGainedToday, setXpGainedToday] = useState(450)
  const [lastXpResetDate, setLastXpResetDate] = useState(new Date().toDateString())

  // Reset daily XP and fetch new tasks at midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const today = now.toDateString();
      if (lastXpResetDate !== today) {
        setXpGainedToday(0);
        setLastXpResetDate(today);
        if (user?.id) {
          apiClient.get('/api/tasks/today').then(response => {
            const transformedTasks = response.data.tasks.map((task: any, index: number) => transformTask(task, index));
            setTodayTasks(transformedTasks);
          });
        }
      }
    }, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [lastXpResetDate, user?.id])

  const weeklyData = [
    { day: 'Mon', calories: 450, steps: 8200, water: 6, distance: 6.5, heartRate: 72, active: 45 },
    { day: 'Tue', calories: 520, steps: 9100, water: 7, distance: 7.2, heartRate: 70, active: 52 },
    { day: 'Wed', calories: 380, steps: 7500, water: 5, distance: 6.0, heartRate: 74, active: 38 },
    { day: 'Thu', calories: 600, steps: 10200, water: 8, distance: 8.1, heartRate: 68, active: 58 },
    { day: 'Fri', calories: 550, steps: 9800, water: 7, distance: 7.8, heartRate: 71, active: 55 },
    { day: 'Sat', calories: 720, steps: 12400, water: 8, distance: 9.9, heartRate: 69, active: 68 },
    { day: 'Sun', calories: 480, steps: 8900, water: 6, distance: 7.1, heartRate: 73, active: 48 },
  ]

  const radarData = [
    { stat: 'Strength', value: 78, fullMark: 100 },
    { stat: 'Cardio', value: 82, fullMark: 100 },
    { stat: 'Agility', value: 72, fullMark: 100 },
    { stat: 'Health', value: 88, fullMark: 100 },
    { stat: 'Endurance', value: 80, fullMark: 100 },
    { stat: 'Flexibility', value: 75, fullMark: 100 },
  ]

  const fitnessMetrics = [
    { label: 'Steps Today', value: '8,245', goal: '10,000', icon: '👟', progress: 82, color: 'from-purple-500 to-purple-600' },
    { label: 'Calories Burned', value: '520', goal: '700', icon: '🔥', progress: 74, color: 'from-red-500 to-red-600' },
    { label: 'Water Intake', value: '6', goal: '8', icon: '💧', unit: 'cups', progress: 75, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Workout Streak', value: '12', goal: '30', icon: '⚡', unit: 'days', progress: 40, color: 'from-indigo-500 to-indigo-600' },
  ]

  useEffect(() => {
    setMounted(true)
    
    // Fetch progression data for rank-up conditions
    const fetchProgressionData = async () => {
      try {
        const response = await apiClient.get('/api/users/me/game')
        const data = response.data?.progression || null
        if (data) {
          setProgression(data)
        }
        
        // Fetch stats
        try {
          const profileRes = await apiClient.get('/users/profile')
          if (profileRes.data?.stats) {
            setProgressionStats({
              strength: parseInt(profileRes.data.stats.strength) || 0,
              speed: parseInt(profileRes.data.stats.speed) || 0,
              endurance: parseInt(profileRes.data.stats.endurance) || 0,
              agility: parseInt(profileRes.data.stats.agility) || 0,
              power: parseInt(profileRes.data.stats.power) || 0,
              recovery: parseInt(profileRes.data.stats.recovery) || 0,
            })
          }
        } catch (e) {
          // ignore
        }
        
        // Fetch tasks info
        try {
          const tasksRes = await apiClient.get('/tasks')
          if (tasksRes.data?.tasks) {
            const completedCount = tasksRes.data.tasks.filter((t: any) => t.completed_at).length
            setTasksCompleted(completedCount)
          }
        } catch (e) {
          // ignore
        }
        
        // Fetch current streak
        try {
          const userRes = await apiClient.get('/users/me')
          setCurrentStreak(userRes.data?.user?.current_streak || 0)
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.error('Failed to fetch progression data:', err)
      }
    }
    
    fetchProgressionData()
  }, [])

  // Fetch today's tasks
  useEffect(() => {
    const fetchTodayTasks = async () => {
      if (!user?.id) return
      
      try {
        setTasksLoading(true)
        const response = await apiClient.get('/api/tasks/today')
        const transformedTasks = response.data.tasks.map((task: any, index: number) => transformTask(task, index))
        
        console.log('Transformed tasks:', transformedTasks)
        setTodayTasks(transformedTasks)
        
        if (transformedTasks.length === 0) {
          if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(() => {
              fetchTodayTasks()
            }, 30000)
          }
        } else {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
        setTodayTasks([])
      } finally {
        setTasksLoading(false)
      }
    }

    fetchTodayTasks()
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [user?.id])

  if (!mounted || !user) {
    return null
  }

  // Handles marking a task as complete and updates state accordingly
  const handleTaskComplete = async (xpGain: number, newProgression: any) => {
    setTasksCompleted(prev => prev + 1);
    setXpGainedToday(prev => prev + xpGain);
    setProgression(newProgression);

    try {
      const response = await apiClient.get('/api/tasks/today')
      const transformedTasks = response.data.tasks.map((task: any, index: number) => transformTask(task, index))
      setTodayTasks(transformedTasks)
      
      if (transformedTasks.length === 0 && !pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          const res = await apiClient.get('/api/tasks/today')
          const tasks = res.data.tasks.map((task: any, index: number) => transformTask(task, index))
          setTodayTasks(tasks)
          if (tasks.length > 0 && pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
        }, 30000)
      }
    } catch (error) {
      console.error('Failed to refetch tasks:', error)
    }
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'S': { bg: 'from-purple-600 to-purple-700', text: 'text-purple-300', border: 'border-purple-500/50' },
      'A': { bg: 'from-blue-600 to-blue-700', text: 'text-blue-300', border: 'border-blue-500/50' },
      'B': { bg: 'from-cyan-600 to-cyan-700', text: 'text-cyan-300', border: 'border-cyan-500/50' },
      'C': { bg: 'from-green-600 to-green-700', text: 'text-green-300', border: 'border-green-500/50' },
      'D': { bg: 'from-yellow-600 to-yellow-700', text: 'text-yellow-300', border: 'border-yellow-500/50' },
      'E': { bg: 'from-orange-600 to-orange-700', text: 'text-orange-300', border: 'border-orange-500/50' },
      'F': { bg: 'from-slate-600 to-slate-700', text: 'text-slate-300', border: 'border-slate-500/50' },
    }
    return colors[rank] || colors['F']
  }

  const rankColor = getRankColor(user?.rank ?? 'F')
  const totalXPGained = stats?.xpGained ?? 0

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />

      <main className="overflow-y-auto">
        {/* Header Section */}
        <EnhancedHeaderV2
          userName={user?.name ?? 'Hunter'}
          rank={user?.rank ?? 'F'}
          level={user?.level ?? 1}
          statPoints={user?.statPoints ?? 0}
          xpToday={xpGainedToday}
          totalXp={totalXPGained}
        />

        {/* Game Stats fetched from backend */}
        <div className="mt-4">
          <GameStats key={user?.id || 'default'} />
        </div>

        {/* Main Content */}
        <div className="p-4 space-y-4">
          {/* Level Progress Section */}
          <NextLevelSection currentXP={stats.weeklyXp} goalXP={4000} percentage={levelProgress} />

          {/* Quests Section */}
          {tasksLoading ? (
            <div className="text-center text-white/60 p-8">
              Loading tasks...
            </div>
          ) : Array.isArray(todayTasks) && todayTasks.length > 0 ? (
            <QuestsSection
              quests={todayTasks}
              onTaskComplete={handleTaskComplete}
            />
          ) : (
            <div className="text-center text-white/60 p-8">
              No tasks for today
            </div>
          )}

        

          {/* Calorie Log Chart */}
          <SectionCard 
            title="Calorie Log" 
            icon="🔥" 
            subtitle="Daily energy expenditure"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={weeklyData} 
                margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#FF8E53" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#ffffff" 
                  opacity={0.15}
                  vertical={false}
                />
                
                <XAxis 
                  dataKey="day" 
                  stroke="#ffffff" 
                  tick={{ fill: '#ffffff', fontSize: 13, fontWeight: 500 }}
                  axisLine={{ stroke: '#ffffff', opacity: 0.2 }}
                  tickLine={false}
                />
                
                <YAxis 
                  stroke="#ffffff" 
                  tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#ffffff', opacity: 0.2 }}
                  tickLine={false}
                  width={50}
                />
                
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 46, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
                  labelStyle={{ 
                    color: '#ffffff', 
                    fontWeight: 700,
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}
                  itemStyle={{
                    color: '#FF6B6B',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                  formatter={(value: any) => [`${value.toLocaleString()} kcal`, 'Calories Burned']}
                />
                
                <Bar 
                  dataKey="calories" 
                  fill="url(#calorieGradient)"
                  radius={[10, 10, 0, 0]}
                  maxBarSize={60}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Power Analysis Radar */}
          <PowerAnalysisSection/>

          {/* Movement Tracking Chart */}
          <div
            className="-mt-2 -my-2"
            style={{ marginTop: '12px', marginBottom: '24px', paddingTop: 0, paddingBottom: 0 }}
          >
            <MovementTrackingChart weeklyData={undefined}/>
          </div>
                  

          {/* AI Coach & Insights Section */}
          <div
            className="rounded-2xl border-2 overflow-hidden backdrop-blur-sm p-5 sm:p-6"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderColor: '#ffffff40',
              boxShadow: '0 0 30px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg sm:text-xl font-black text-white">AI Coach</h3>
              <span className="text-2xl">🤖</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* AI Suggestions */}
              <div
                className="p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  borderColor: '#ffffff40',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Suggestion</p>
                    <p className="text-sm font-semibold text-white">Try HIIT Training</p>
                    <p className="text-xs text-white/60 mt-2">Boost your cardio score by adding 15-min HIIT sessions</p>
                  </div>
                </div>
              </div>

              {/* Daily Tips */}
              <div
                className="p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(34, 211, 238, 0.15)',
                  borderColor: '#ffffff40',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">⭐</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Tip</p>
                    <p className="text-sm font-semibold text-white">Hydration Matters</p>
                    <p className="text-xs text-white/60 mt-2">Drink water 15 mins before workout for better performance</p>
                  </div>
                </div>
              </div>

              {/* What to do Next */}
              <div
                className="p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  borderColor: '#ffffff40',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">🎯</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Next Steps</p>
                    <p className="text-sm font-semibold text-white">Complete Core Workout</p>
                    <p className="text-xs text-white/60 mt-2">20 mins • Targets: Abs, Back • +100 XP</p>
                  </div>
                </div>
              </div>

              {/* AI Performance Review */}
              <div
                className="p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderColor: '#ffffff40',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">📊</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">Review</p>
                    <p className="text-sm font-semibold text-white">Great Consistency!</p>
                    <p className="text-xs text-white/60 mt-2">You're 12% ahead of your weekly goal. Keep it up! 🔥</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Motivation Section */}
            <div
              className="mt-5 p-4 rounded-xl border"
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                borderColor: '#ffffff40',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              }}
            >
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🚀</span> Personalized Insight
              </p>
              <p className="text-sm text-white leading-relaxed">
                You're crushing it this week! Your streak is amazing. Focus on adding more flexibility exercises to reach your S-rank goal. You're 8 points away!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
