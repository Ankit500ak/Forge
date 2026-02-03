import { useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';

/**
 * Hook for generating ML-powered fitness tasks
 * Communicates with backend ML task generation endpoints
 */
export const useMLTasks = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [success, setSuccess] = useState(null);

  /**
   * Generate a single ML-powered task
   * @returns {Promise<Task>} Generated task object
   */
  const generateSingleTask = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log('[useMLTasks] Generating single task...');
      const response = await apiClient.post('/tasks/generate-ml');
      
      const task = response.data.task;
      
      setSuccess(`✅ Task generated: ${task.title}`);
      console.log('[useMLTasks] Task generated:', task);
      
      return task;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate task';
      console.error('[useMLTasks] Error generating single task:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate multiple ML-powered tasks
   * @param {number} count Number of tasks to generate (1-10)
   * @returns {Promise<Task[]>} Array of generated tasks
   */
  const generateDailyTasks = useCallback(async (count = 4) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (count < 1 || count > 10) {
        throw new Error('Count must be between 1 and 10');
      }

      console.log(`[useMLTasks] Generating ${count} tasks...`);
      const response = await apiClient.post('/tasks/generate-ml-batch', { count });
      
      const generatedTasks = response.data.tasks;
      
      setTasks(generatedTasks);
      setSuccess(`✅ Generated ${generatedTasks.length} tasks`);
      console.log('[useMLTasks] Batch generated:', generatedTasks);
      
      return generatedTasks;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate tasks';
      console.error('[useMLTasks] Error generating batch:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Format task for display in UI
   * @param {Task} task Raw task object from API
   * @returns {FormattedTask} Formatted task for display
   */
  const formatTask = useCallback((task) => {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      difficulty: task.difficulty,
      xp_reward: task.xp_reward,
      duration: task.duration,
      stat_rewards: task.stat_rewards || {},
      formatted: {
        category: (task.category || '').charAt(0).toUpperCase() + (task.category || '').slice(1),
        difficulty: `⭐ ${task.difficulty}`,
        stats: Object.entries(task.stat_rewards || {})
          .map(([stat, value]) => `${stat}: +${value}`)
          .join(' | '),
        duration: `⏱️ ${task.duration}min`,
        xp: `🔥 ${task.xp_reward} XP`
      }
    };
  }, []);

  /**
   * Clear errors and success messages
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    loading,
    error,
    success,
    tasks,
    generateSingleTask,
    generateDailyTasks,
    formatTask,
    clearMessages,
    setTasks,
    setError,
    setSuccess
  };
};

