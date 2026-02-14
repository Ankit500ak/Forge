'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import apiClient from '@/lib/api-client'

interface CalorieData {
    date: string
    calories: number
    items: number
    protein_g: number
    carbs_g: number
    fat_g: number
}

export function CalorieHistoryChart() {
    const [weeklyData, setWeeklyData] = useState<CalorieData[]>([])
    const [todayStats, setTodayStats] = useState({
        total_calories: 0,
        total_items: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
    })
    const [loading, setLoading] = useState(true)
    const [currentTab, setCurrentTab] = useState<'line' | 'bar'>('line')

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // Fetch weekly trend
                const trendResponse = await apiClient.get('/camera/weekly-trend')
                if (trendResponse.data.data) {
                    // Format dates for display
                    const formattedData = trendResponse.data.data.map((item: any) => ({
                        ...item,
                        date: new Date(item.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                        })
                    }))
                    setWeeklyData(formattedData)
                }

                // Fetch today's stats
                const todayResponse = await apiClient.get('/camera/daily-stats')
                if (todayResponse.data.data) {
                    setTodayStats(todayResponse.data.data)
                }

                console.log('✅ Calorie data loaded')
            } catch (error) {
                console.error('❌ Error loading calorie data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="rounded-2xl border-2 overflow-hidden backdrop-blur-sm p-6 animate-pulse"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderColor: '#ffffff40',
                }}>
                <div className="h-8 bg-slate-700/50 rounded mb-4"></div>
                <div className="h-64 bg-slate-700/30 rounded"></div>
            </div>
        )
    }

    const totalCaloriesThisWeek = weeklyData.reduce((sum, day) => sum + day.calories, 0)
    const avgCaloriesPerDay = Math.round(totalCaloriesThisWeek / Math.max(weeklyData.length, 1))

    return (
        <div className="rounded-2xl border-2 overflow-hidden backdrop-blur-sm p-6"
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderColor: '#ffffff40',
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        📊 Calorie History
                    </h3>
                    <p className="text-xs text-white/60 mt-1">7-day food intake tracking</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentTab('line')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${currentTab === 'line'
                            ? 'bg-purple-600/80 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                            }`}>
                        📈 Trend
                    </button>
                    <button
                        onClick={() => setCurrentTab('bar')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${currentTab === 'bar'
                            ? 'bg-purple-600/80 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                            }`}>
                        📊 Daily
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-black/40 rounded-lg p-3 border border-orange-500/30">
                    <p className="text-xs text-orange-300 font-semibold">Today</p>
                    <p className="text-2xl font-bold text-orange-400">{todayStats.total_calories}</p>
                    <p className="text-xs text-orange-200/60">{todayStats.total_items} items</p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-green-500/30">
                    <p className="text-xs text-green-300 font-semibold">This Week Avg</p>
                    <p className="text-2xl font-bold text-green-400">{avgCaloriesPerDay}</p>
                    <p className="text-xs text-green-200/60">per day</p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-blue-500/30">
                    <p className="text-xs text-blue-300 font-semibold">This Week Total</p>
                    <p className="text-2xl font-bold text-blue-400">{totalCaloriesThisWeek}</p>
                    <p className="text-xs text-blue-200/60">kcal</p>
                </div>
                <div className="bg-black/40 rounded-lg p-3 border border-purple-500/30">
                    <p className="text-xs text-purple-300 font-semibold">Protein Today</p>
                    <p className="text-2xl font-bold text-purple-400">{todayStats.total_protein_g.toFixed(1)}</p>
                    <p className="text-xs text-purple-200/60">grams</p>
                </div>
            </div>

            {/* Chart */}
            {weeklyData.length > 0 ? (
                <div className="h-80 -mx-6 -mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        {currentTab === 'line' ? (
                            <LineChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                                <defs>
                                    <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FF6B9D" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#FF8C42" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#ffffff"
                                    tick={{ fill: '#ffffff', fontSize: 12 }}
                                    axisLine={{ stroke: '#ffffff', opacity: 0.2 }}
                                    tickLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    stroke="#ffffff"
                                    tick={{ fill: '#ffffff', fontSize: 12 }}
                                    axisLine={{ stroke: '#ffffff', opacity: 0.2 }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#ffffff', opacity: 0.2 }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(26, 26, 46, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 107, 157, 0.3)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                    }}
                                    labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                                    formatter={(value: any) => [
                                        `${Math.round(value)} kcal`,
                                        'Calories'
                                    ]}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="line"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="calories"
                                    stroke="#FF6B9D"
                                    strokeWidth={3}
                                    dot={{ fill: '#FF6B9D', r: 5 }}
                                    activeDot={{ r: 7 }}
                                    fill="url(#calorieGradient)"
                                />
                            </LineChart>
                        ) : (
                            <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#7C3AFF" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.7} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#ffffff"
                                    tick={{ fill: '#ffffff', fontSize: 12 }}
                                    axisLine={{ stroke: '#ffffff', opacity: 0.2 }}
                                    tickLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    stroke="#ffffff"
                                    tick={{ fill: '#ffffff', fontSize: 12 }}
                                    axisLine={{ stroke: '#ffffff', opacity: 0.2 }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(26, 26, 46, 0.95)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(124, 58, 255, 0.3)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                    }}
                                    labelStyle={{ color: '#ffffff', fontWeight: 700 }}
                                    formatter={(value: any) => [
                                        `${Math.round(value)} kcal`,
                                        'Calories'
                                    ]}
                                />
                                <Bar dataKey="calories" fill="url(#barGradient)" radius={[10, 10, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-center">
                    <div>
                        <p className="text-3xl mb-2">🍽️</p>
                        <p className="text-white/60">No food intake data yet</p>
                        <p className="text-xs text-white/40 mt-2">Start detecting food with the camera!</p>
                    </div>
                </div>
            )}

            {/* Macro Breakdown */}
            {todayStats.total_calories > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                    <p className="text-sm font-bold text-white mb-3">🥗 Today's Macros</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">●</span>
                                <span className="text-sm text-white/70">Protein</span>
                            </div>
                            <span className="font-bold text-green-400">{todayStats.total_protein_g.toFixed(1)}g</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-blue-400">●</span>
                                <span className="text-sm text-white/70">Carbs</span>
                            </div>
                            <span className="font-bold text-blue-400">{todayStats.total_carbs_g.toFixed(1)}g</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-red-400">●</span>
                                <span className="text-sm text-white/70">Fat</span>
                            </div>
                            <span className="font-bold text-red-400">{todayStats.total_fat_g.toFixed(1)}g</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
