import React, { useEffect, useState } from 'react';
import { useMLTasks } from '../hooks/useMLTasks';
import './MLTaskGenerator.css';

/**
 * Component for generating and displaying ML-generated fitness tasks
 */
export default function MLTaskGenerator({ onTasksGenerated, autoGenerate = false, taskCount = 4 }) {
  const { loading, error, tasks, generateDailyTasks, formatTask, setError } = useMLTasks();
  const [displayTasks, setDisplayTasks] = useState([]);

  // Auto-generate tasks on mount if requested
  useEffect(() => {
    if (autoGenerate) {
      handleGenerateTasks();
    }
  }, [autoGenerate]);

  // Update display tasks when tasks change
  useEffect(() => {
    const formatted = tasks.map(task => formatTask(task));
    setDisplayTasks(formatted);
    
    if (onTasksGenerated) {
      onTasksGenerated(formatted);
    }
  }, [tasks, formatTask, onTasksGenerated]);

  const handleGenerateTasks = async () => {
    try {
      await generateDailyTasks(taskCount);
    } catch (err) {
      console.error('Error generating tasks:', err);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'difficulty-easy';
      case 'medium':
        return 'difficulty-medium';
      case 'hard':
        return 'difficulty-hard';
      default:
        return '';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      strength: '💪',
      cardio: '🏃',
      flexibility: '🧘',
      health: '❤️',
      hiit: '⚡'
    };
    return icons[category?.toLowerCase()] || '🎯';
  };

  return (
    <div className="ml-task-generator">
      <div className="generator-header">
        <h2>🤖 AI Task Generator</h2>
        <p>Generate personalized fitness tasks powered by machine learning</p>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ Error: {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="generator-controls">
        <button
          onClick={handleGenerateTasks}
          disabled={loading}
          className="btn-generate"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generating Tasks...
            </>
          ) : (
            <>
              🚀 Generate {taskCount} Tasks
            </>
          )}
        </button>
      </div>

      {displayTasks.length > 0 && (
        <div className="tasks-container">
          <div className="tasks-header">
            <h3>📋 Generated Tasks ({displayTasks.length})</h3>
            <p className="tasks-subtitle">Complete these personalized exercises to earn XP and stat rewards</p>
          </div>

          <div className="tasks-grid">
            {displayTasks.map((task, index) => (
              <div key={task.id || index} className="task-card">
                <div className="task-card-header">
                  <div className="task-title-section">
                    <span className="category-icon">
                      {getCategoryIcon(task.category)}
                    </span>
                    <div>
                      <h4 className="task-title">{task.title}</h4>
                      <p className="task-category">{task.formatted.category}</p>
                    </div>
                  </div>
                  <div className={`difficulty-badge ${getDifficultyColor(task.difficulty)}`}>
                    {task.formatted.difficulty}
                  </div>
                </div>

                <p className="task-description">{task.description}</p>

                <div className="task-details">
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">⏱️ {task.duration} min</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">XP Reward:</span>
                    <span className="detail-value">✨ +{task.xp_reward} XP</span>
                  </div>
                </div>

                <div className="stat-rewards">
                  <p className="stat-label">Stat Rewards:</p>
                  <div className="stats-list">
                    {Object.entries(task.stat_rewards || {}).map(([stat, value]) => (
                      <div key={stat} className="stat-item">
                        <span className="stat-name">{stat}</span>
                        <span className="stat-value">+{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="task-actions">
                  <button className="btn-start">Start Task</button>
                  <button className="btn-skip">Skip</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && displayTasks.length === 0 && (
        <div className="empty-state">
          <p>👋 Click the button above to generate your personalized tasks</p>
          <p className="empty-subtitle">Our AI will create tasks based on your fitness level and goals</p>
        </div>
      )}
    </div>
  );
}
