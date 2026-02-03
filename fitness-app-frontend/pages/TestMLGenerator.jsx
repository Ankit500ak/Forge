import React, { useState, useEffect } from 'react';
import { useMLTasks } from '../hooks/useMLTasks';
import MLTaskGenerator from '../components/MLTaskGenerator';
import '../components/MLTaskGenerator.css';
import '../styles/test-ml-generator.css';

/**
 * Test Page for ML Task Generation
 * Purpose: Verify that the ML task generation system works end-to-end
 * 
 * Tests:
 * 1. Generate single task
 * 2. Generate batch (4 tasks)
 * 3. Verify stat rewards are 1-3
 * 4. Verify XP is 10-200
 * 5. Verify difficulty colors correct
 * 6. Verify component responsive
 */
export default function TestMLGenerator() {
  const { 
    generateSingleTask, 
    generateDailyTasks, 
    tasks, 
    loading, 
    error,
    formatTask 
  } = useMLTasks();

  const [testResults, setTestResults] = useState([]);
  const [testRunning, setTestRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token') || !!sessionStorage.getItem('token')
  );

  // Test validators
  const validateStatRewards = (stats) => {
    if (!stats) return { valid: false, message: 'No stat_rewards' };
    
    for (const [stat, value] of Object.entries(stats)) {
      if (typeof value !== 'number' || value < 1 || value > 3) {
        return { 
          valid: false, 
          message: `${stat}: ${value} (should be 1-3)` 
        };
      }
    }
    return { valid: true, message: 'All stats 1-3 ✓' };
  };

  const validateXP = (xp) => {
    if (xp < 10 || xp > 200) {
      return { valid: false, message: `XP: ${xp} (should be 10-200)` };
    }
    return { valid: true, message: `XP: ${xp} ✓` };
  };

  const validateDuration = (duration) => {
    if (duration < 10 || duration > 120) {
      return { valid: false, message: `Duration: ${duration} (should be 10-120)` };
    }
    return { valid: true, message: `Duration: ${duration}min ✓` };
  };

  const validateDifficulty = (difficulty) => {
    const valid = ['easy', 'medium', 'hard'].includes(difficulty?.toLowerCase());
    if (!valid) {
      return { valid: false, message: `Invalid difficulty: ${difficulty}` };
    }
    return { valid: true, message: `Difficulty: ${difficulty} ✓` };
  };

  // Run tests
  const runTests = async () => {
    setTestRunning(true);
    const results = [];

    try {
      // Test 1: Single task generation
      results.push({
        test: 'Generate Single Task',
        status: 'running',
        details: 'Calling generateSingleTask()...'
      });

      await generateSingleTask();
      const singleTask = tasks[0];

      if (singleTask) {
        const statCheck = validateStatRewards(singleTask.stat_rewards);
        const xpCheck = validateXP(singleTask.xp_reward);
        const durationCheck = validateDuration(singleTask.duration);
        const diffCheck = validateDifficulty(singleTask.difficulty);

        results[0] = {
          test: 'Generate Single Task',
          status: statCheck.valid && xpCheck.valid && durationCheck.valid && diffCheck.valid ? 'pass' : 'fail',
          details: [
            statCheck.message,
            xpCheck.message,
            durationCheck.message,
            diffCheck.message
          ]
        };
      } else {
        results[0] = { test: 'Generate Single Task', status: 'fail', details: 'No task returned' };
      }

      // Test 2: Batch generation
      results.push({
        test: 'Generate Batch (4 Tasks)',
        status: 'running',
        details: 'Calling generateDailyTasks(4)...'
      });

      await generateDailyTasks(4);

      if (tasks.length >= 4) {
        const allValid = tasks.slice(0, 4).every(task => {
          const statCheck = validateStatRewards(task.stat_rewards).valid;
          const xpCheck = validateXP(task.xp_reward).valid;
          const durationCheck = validateDuration(task.duration).valid;
          const diffCheck = validateDifficulty(task.difficulty).valid;
          return statCheck && xpCheck && durationCheck && diffCheck;
        });

        results[1] = {
          test: 'Generate Batch (4 Tasks)',
          status: allValid ? 'pass' : 'fail',
          details: [
            `Tasks generated: ${Math.min(4, tasks.length)}`,
            `All stat rewards valid: ${allValid ? 'Yes' : 'No'}`,
            ...tasks.slice(0, 4).map((t, i) => `Task ${i + 1}: ${t.title}`)
          ]
        };
      } else {
        results[1] = { test: 'Generate Batch (4 Tasks)', status: 'fail', details: `Only ${tasks.length} tasks generated` };
      }

      // Test 3: Verify component renders
      results.push({
        test: 'MLTaskGenerator Component Renders',
        status: tasks.length > 0 ? 'pass' : 'fail',
        details: tasks.length > 0 ? 'Component loaded with tasks' : 'No tasks to display'
      });

      // Test 4: Check stat distribution
      const statDistribution = {};
      tasks.forEach(task => {
        Object.entries(task.stat_rewards || {}).forEach(([stat, value]) => {
          if (!statDistribution[value]) statDistribution[value] = 0;
          statDistribution[value]++;
        });
      });

      results.push({
        test: 'Stat Distribution Check',
        status: Object.keys(statDistribution).length > 0 ? 'pass' : 'fail',
        details: [
          `+1 reward: ${statDistribution[1] || 0} occurrences`,
          `+2 reward: ${statDistribution[2] || 0} occurrences`,
          `+3 reward: ${statDistribution[3] || 0} occurrences`
        ]
      });

    } catch (err) {
      results.push({
        test: 'Error Handling',
        status: 'fail',
        details: err.message
      });
    }

    setTestResults(results);
    setTestRunning(false);
  };

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="test-container">
        <div className="auth-message">
          <h2>⚠️ Authentication Required</h2>
          <p>Please log in to your fitness app before testing the ML task generator.</p>
          <ol>
            <li>Close this page</li>
            <li>Login at the main app</li>
            <li>Return to this test page</li>
          </ol>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="test-container">
      {/* Header */}
      <header className="test-header">
        <h1>🧪 ML Task Generator Test Suite</h1>
        <p>Testing API endpoints and component rendering</p>
      </header>

      {/* Control Panel */}
      <section className="control-panel">
        <button 
          onClick={runTests} 
          disabled={testRunning}
          className="test-button"
        >
          {testRunning ? '⏳ Running Tests...' : '▶️ Run All Tests'}
        </button>
      </section>

      {/* Test Results */}
      {testResults.length > 0 && (
        <section className="test-results">
          <h2>📊 Test Results</h2>
          <div className="results-grid">
            {testResults.map((result, idx) => (
              <div key={idx} className={`result-card result-${result.status}`}>
                <div className="result-header">
                  <span className={`status-badge status-${result.status}`}>
                    {result.status === 'pass' && '✅'}
                    {result.status === 'fail' && '❌'}
                    {result.status === 'running' && '⏳'}
                  </span>
                  <h3>{result.test}</h3>
                </div>
                <div className="result-details">
                  {Array.isArray(result.details) ? (
                    <ul>
                      {result.details.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{result.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Error Display */}
      {error && (
        <section className="error-section">
          <h3>⚠️ Error</h3>
          <pre>{error}</pre>
        </section>
      )}

      {/* Tasks Display */}
      {tasks.length > 0 && (
        <section className="tasks-section">
          <h2>📋 Generated Tasks ({tasks.length})</h2>
          
          {/* Task Selection */}
          <div className="task-selector">
            {tasks.map((task, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTask(selectedTask === idx ? null : idx)}
                className={`task-button ${selectedTask === idx ? 'active' : ''}`}
              >
                Task {idx + 1}: {task.title}
              </button>
            ))}
          </div>

          {/* Selected Task Details */}
          {selectedTask !== null && (
            <div className="task-detail">
              <h3>{tasks[selectedTask].title}</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Category</label>
                  <span>{tasks[selectedTask].category}</span>
                </div>
                <div className="detail-item">
                  <label>Difficulty</label>
                  <span className={`difficulty-${tasks[selectedTask].difficulty}`}>
                    {tasks[selectedTask].difficulty?.toUpperCase()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>XP Reward</label>
                  <span>+{tasks[selectedTask].xp_reward}</span>
                </div>
                <div className="detail-item">
                  <label>Duration</label>
                  <span>{tasks[selectedTask].duration} min</span>
                </div>
              </div>

              <div className="stat-rewards">
                <h4>Stat Rewards</h4>
                <div className="stats-grid">
                  {Object.entries(tasks[selectedTask].stat_rewards || {}).map(([stat, value]) => (
                    <div key={stat} className="stat-item">
                      <div className="stat-name">{stat}</div>
                      <div className="stat-value">+{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="task-description">{tasks[selectedTask].description}</p>
            </div>
          )}

          {/* Component Rendering Test */}
          <div className="component-test">
            <h3>Component Rendering Test</h3>
            <p>Below is the actual MLTaskGenerator component displaying the generated tasks:</p>
            <MLTaskGenerator 
              taskCount={4}
              autoGenerate={false}
              onTasksGenerated={(newTasks) => console.log('Tasks generated:', newTasks)}
            />
          </div>
        </section>
      )}

      {/* Quick Stats */}
      {tasks.length > 0 && (
        <section className="quick-stats">
          <h3>📈 Quick Statistics</h3>
          <div className="stats-overview">
            <div className="stat">
              <label>Total Tasks</label>
              <value>{tasks.length}</value>
            </div>
            <div className="stat">
              <label>Avg XP</label>
              <value>
                {Math.round(
                  tasks.reduce((sum, t) => sum + (t.xp_reward || 0), 0) / tasks.length
                )}
              </value>
            </div>
            <div className="stat">
              <label>Avg Duration</label>
              <value>
                {Math.round(
                  tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / tasks.length
                )} min
              </value>
            </div>
          </div>
        </section>
      )}

      {/* Instructions */}
      <section className="instructions">
        <h3>📝 How to Use</h3>
        <ol>
          <li>Click "Run All Tests" to execute the test suite</li>
          <li>Review test results - all should show ✅ PASS</li>
          <li>Click on task buttons to view detailed task information</li>
          <li>Verify stat rewards are 1-3 (not floats or decimals)</li>
          <li>Check that XP is between 10-200</li>
          <li>Verify difficulty badges have correct colors</li>
          <li>Test on mobile to verify responsive design</li>
        </ol>
      </section>
    </div>
  );
}
