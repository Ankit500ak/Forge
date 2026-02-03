'use client'

import React, { useEffect, useState } from 'react'
import { useMLTasks } from '@/hooks/useMLTasks'
import { taskApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * ML Task Generator Component
 * Demonstrates how to use ML task generation in the frontend
 */
export function MLTaskGenerator() {
  const { generateSingleTask, generateDailyTasks, loading, error, success } = useMLTasks()
  const [generatedTasks, setGeneratedTasks] = useState([])

  // Handle single task generation
  const handleGenerateSingle = async () => {
    try {
      const task = await generateSingleTask()
      setGeneratedTasks((prev) => [task, ...prev])
    } catch (err) {
      console.error('Failed to generate task:', err)
    }
  }

  // Handle batch task generation
  const handleGenerateBatch = async () => {
    try {
      const tasks = await generateDailyTasks(4)
      setGeneratedTasks((prev) => [...tasks, ...prev])
    } catch (err) {
      console.error('Failed to generate batch:', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>🤖 ML Task Generator</CardTitle>
          <CardDescription>
            Generate personalized fitness tasks using AI
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleGenerateSingle}
          disabled={loading}
          variant="default"
        >
          {loading ? 'Generating...' : '➕ Generate 1 Task'}
        </Button>

        <Button
          onClick={handleGenerateBatch}
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Generating...' : '⚡ Generate 4 Tasks'}
        </Button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-red-100 text-red-800 border border-red-300">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-100 text-green-800 border border-green-300">
          {success}
        </div>
      )}

      {/* Generated Tasks Display */}
      {generatedTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Generated Tasks ({generatedTasks.length})</h3>
          <div className="space-y-2">
            {generatedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Task Card Component
 * Displays individual task details
 */
function TaskCard({ task }) {
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(task.completed || false)

  const handleComplete = async () => {
    try {
      setCompleting(true)
      const response = await taskApi.completeTask(task.id)
      setCompleted(true)
      console.log('✅ Task completed! XP gained:', response.xpGain)
    } catch (err) {
      console.error('Error completing task:', err)
    } finally {
      setCompleting(false)
    }
  }

  const categoryColors = {
    strength: 'bg-red-100 text-red-800',
    cardio: 'bg-orange-100 text-orange-800',
    flexibility: 'bg-purple-100 text-purple-800',
    health: 'bg-green-100 text-green-800',
    hiit: 'bg-blue-100 text-blue-800',
  }

  const categoryColor = categoryColors[task.category] || 'bg-gray-100 text-gray-800'

  const difficultyStars = {
    1: '⭐',
    2: '⭐⭐',
    3: '⭐⭐⭐',
  }

  return (
    <Card className={completed ? 'opacity-50' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          {/* Task Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-lg">{task.title}</h4>
              {completed && <span className="text-lg">✅</span>}
            </div>

            <p className="text-sm text-gray-600">{task.description}</p>

            <div className="flex flex-wrap gap-2">
              {/* Category Badge */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColor}`}>
                {task.category}
              </span>

              {/* Difficulty */}
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                {difficultyStars[task.difficulty]}
              </span>

              {/* Duration */}
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                ⏱️ {task.duration}min
              </span>

              {/* XP Reward */}
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🔥 {task.xp_reward} XP
              </span>
            </div>

            {/* Stat Rewards */}
            {task.stat_rewards && Object.keys(task.stat_rewards).length > 0 && (
              <div className="mt-2 text-sm">
                <span className="font-semibold text-gray-700">Stat Rewards:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(task.stat_rewards).map(([stat, value]) => (
                    value > 0 && (
                      <span key={stat} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
                        {stat}: +{value}
                      </span>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            disabled={completing || completed}
            variant={completed ? 'secondary' : 'default'}
            size="sm"
          >
            {completing ? 'Completing...' : completed ? 'Completed' : 'Complete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default MLTaskGenerator
