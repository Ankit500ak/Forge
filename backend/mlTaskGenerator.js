/**
 * ML Task Generator - JavaScript Implementation
 * Loads pickle models, processes user data, generates tasks, and stores in database
 */

import { spawn } from 'child_process';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

// Initialize database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * STEP 1: Load user data from database
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object>} User profile data
 */
async function loadUserProfile(userId) {
  try {
    const query = `
      SELECT 
        id, email, age, height, weight, gender,
        fitness_level, activity_level,
        strength, constitution, dexterity, wisdom, charisma,
        total_xp, level, bmi, sleep_quality, stress_level,
        primary_goal
      FROM users 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      throw new Error(`User ${userId} not found`);
    }
    
    console.log('✅ User profile loaded');
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error loading user profile:', error.message);
    throw error;
  }
}

/**
 * STEP 2: Load ML models from pickle files
 * @returns {Promise<Object>} Loaded model and preprocessor
 */
async function loadMLModels() {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import pickle
import json
from pathlib import Path

try:
    model_path = Path(r'backend/ml_models/fitness_model.pkl')
    preprocessor_path = Path(r'backend/ml_models/feature_preprocessor.pkl')
    
    # Load model
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    # Load preprocessor
    with open(preprocessor_path, 'rb') as f:
        preprocessor = pickle.load(f)
    
    result = {
        'status': 'success',
        'model_type': str(type(model).__name__),
        'model_loaded': True,
        'preprocessor_loaded': True
    }
    
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'status': 'error', 'message': str(e)}))
`;
    
    const python = spawn('python', ['-c', pythonScript]);
    let output = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          if (result.status === 'success') {
            console.log('✅ ML models loaded successfully');
            resolve(result);
          } else {
            reject(new Error(result.message));
          }
        } catch (e) {
          reject(new Error(`Failed to parse model load response: ${output}`));
        }
      } else {
        reject(new Error(`Python process failed with code ${code}`));
      }
    });
  });
}

/**
 * STEP 3: Prepare feature vector from user data
 * @param {Object} userProfile - User profile data
 * @returns {Array} Feature vector (15 dimensions)
 */
function prepareFeatureVector(userProfile) {
  try {
    // Map fitness level and activity level to numeric values
    const fitnessLevelMap = {
      'beginner': 0,
      'intermediate': 1,
      'advanced': 2
    };
    
    const activityLevelMap = {
      'sedentary': 0,
      'low': 1,
      'moderate': 2,
      'high': 3,
      'very_active': 4
    };
    
    const features = [
      userProfile.age || 30,
      userProfile.height || 175,
      userProfile.weight || 75,
      userProfile.fitness_level ? fitnessLevelMap[userProfile.fitness_level.toLowerCase()] || 1 : 1,
      userProfile.activity_level ? activityLevelMap[userProfile.activity_level.toLowerCase()] || 1 : 1,
      userProfile.strength || 50,
      userProfile.constitution || 55,
      userProfile.dexterity || 45,
      userProfile.wisdom || 60,
      userProfile.charisma || 48,
      userProfile.total_xp || 0,
      userProfile.level || 1,
      userProfile.bmi || 24.5,
      userProfile.sleep_quality || 7,
      userProfile.stress_level || 5
    ];
    
    console.log('✅ Feature vector prepared:', features);
    return features;
  } catch (error) {
    console.error('❌ Error preparing feature vector:', error.message);
    throw error;
  }
}

/**
 * STEP 4: Run ML inference using Python subprocess
 * @param {Array} features - Feature vector
 * @returns {Promise<Object>} ML model prediction
 */
async function runMLInference(features) {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import pickle
import numpy as np
import json
from pathlib import Path

try:
    # Load models
    model_path = Path(r'backend/ml_models/fitness_model.pkl')
    preprocessor_path = Path(r'backend/ml_models/feature_preprocessor.pkl')
    
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    with open(preprocessor_path, 'rb') as f:
        preprocessor = pickle.load(f)
    
    # Prepare features
    features = np.array(${JSON.stringify(features)}, dtype=np.float32).reshape(1, -1)
    
    # Scale features
    features_scaled = preprocessor.transform(features)
    
    # Run inference
    prediction = model.predict(features_scaled, verbose=0)
    
    # Extract outputs
    difficulty = int(np.argmax(prediction[0, :3])) + 1
    xp_reward = int(abs(prediction[0, 3]) * 10) if len(prediction[0]) > 3 else 100
    category_idx = int(np.argmax(prediction[0, 4:]) if len(prediction[0]) > 4 else 0)
    
    result = {
        'status': 'success',
        'difficulty': difficulty,
        'xp_reward': xp_reward,
        'category_idx': category_idx,
        'raw_output': prediction[0].tolist()
    }
    
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'status': 'error', 'message': str(e)}))
`;
    
    const python = spawn('python', ['-c', pythonScript]);
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          if (result.status === 'success') {
            console.log('✅ ML inference completed');
            resolve(result);
          } else {
            reject(new Error(result.message));
          }
        } catch (e) {
          reject(new Error(`Failed to parse inference output: ${output}`));
        }
      } else {
        reject(new Error(`ML inference failed: ${errorOutput}`));
      }
    });
  });
}

/**
 * STEP 5: Map inference output to task parameters
 * @param {Object} inference - ML model output
 * @returns {Object} Task parameters
 */
function mapInferenceToTask(inference) {
  try {
    const categories = ['strength', 'cardio', 'flexibility', 'health', 'hiit'];
    const exercises = {
      strength: ['Push-ups', 'Deadlifts', 'Squats', 'Bench Press', 'Pull-ups'],
      cardio: ['Running', 'Cycling', 'Jump Rope', 'Rowing', 'Swimming'],
      flexibility: ['Yoga', 'Stretching', 'Pilates', 'Tai Chi', 'Foam Rolling'],
      health: ['Meditation', 'Nutrition Planning', 'Sleep Tracking', 'Hydration', 'Breathing'],
      hiit: ['Burpees', 'Mountain Climbers', 'Sprints', 'Box Jumps', 'Kettlebell Swings']
    };
    
    const category = categories[inference.category_idx % categories.length];
    const categoryExercises = exercises[category];
    const title = categoryExercises[Math.floor(Math.random() * categoryExercises.length)];
    
    // Calculate stat rewards based on category and difficulty
    const statRewards = {
      strength: category === 'strength' || category === 'hiit' ? Math.floor(inference.xp_reward * 0.3) : 0,
      constitution: category === 'cardio' || category === 'hiit' ? Math.floor(inference.xp_reward * 0.3) : 0,
      dexterity: (category === 'hiit' || category === 'flexibility') ? Math.floor(inference.xp_reward * 0.2) : 0,
      wisdom: category === 'health' ? Math.floor(inference.xp_reward * 0.3) : 0,
      charisma: 0
    };
    
    const task = {
      title,
      category,
      difficulty: inference.difficulty,
      xp_reward: inference.xp_reward,
      duration: (inference.difficulty * 10) + Math.floor(Math.random() * 10),
      stat_rewards: statRewards
    };
    
    console.log('✅ Task mapped from inference:', task);
    return task;
  } catch (error) {
    console.error('❌ Error mapping task:', error.message);
    throw error;
  }
}

/**
 * STEP 6: Store task in database
 * @param {string} userId - User ID
 * @param {Object} task - Task data
 * @returns {Promise<Object>} Stored task with ID and timestamp
 */
async function storeTaskInDatabase(userId, task) {
  try {
    const query = `
      INSERT INTO tasks (
        id, user_id, title, category, difficulty,
        xp_reward, duration, stat_rewards, created_at,
        scheduled_date, completed
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        NOW(),
        CURRENT_DATE,
        false
      )
      RETURNING id, user_id, title, category, difficulty, 
                xp_reward, duration, stat_rewards, created_at, 
                scheduled_date, completed
    `;
    
    const result = await pool.query(query, [
      userId,
      task.title,
      task.category,
      task.difficulty,
      task.xp_reward,
      task.duration,
      JSON.stringify(task.stat_rewards)
    ]);
    
    console.log('✅ Task stored in database');
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error storing task in database:', error.message);
    throw error;
  }
}

/**
 * MAIN FUNCTION: Load user data → Run ML model → Generate task → Store in DB
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Generated and stored task
 */
async function generateAndStoreTask(userId) {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 STARTING ML TASK GENERATION PIPELINE');
    console.log('='.repeat(80) + '\n');
    
    // STEP 1: Load user profile
    console.log('📊 STEP 1: Loading user profile...');
    const userProfile = await loadUserProfile(userId);
    console.log(`   User: ${userProfile.email}, Level: ${userProfile.level}`);
    
    // STEP 2: Load ML models
    console.log('\n🤖 STEP 2: Loading ML models...');
    const models = await loadMLModels();
    console.log(`   Model type: ${models.model_type}`);
    
    // STEP 3: Prepare features
    console.log('\n📝 STEP 3: Preparing feature vector...');
    const features = prepareFeatureVector(userProfile);
    console.log(`   Features: ${features.length} dimensions`);
    
    // STEP 4: Run inference
    console.log('\n⚙️  STEP 4: Running ML inference...');
    const inference = await runMLInference(features);
    console.log(`   Difficulty: ${inference.difficulty}, XP: ${inference.xp_reward}`);
    
    // STEP 5: Map to task
    console.log('\n📋 STEP 5: Mapping to task parameters...');
    const task = mapInferenceToTask(inference);
    console.log(`   Task: ${task.title} (${task.category}) - ${task.difficulty}⭐`);
    
    // STEP 6: Store in database
    console.log('\n💾 STEP 6: Storing task in database...');
    const storedTask = await storeTaskInDatabase(userId, task);
    console.log(`   Stored with ID: ${storedTask.id}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TASK GENERATED AND STORED SUCCESSFULLY');
    console.log('='.repeat(80) + '\n');
    
    return storedTask;
  } catch (error) {
    console.error('\n❌ ERROR IN PIPELINE:', error.message);
    throw error;
  }
}

/**
 * BATCH GENERATE: Generate multiple tasks for a user
 * @param {string} userId - User ID
 * @param {number} count - Number of tasks to generate
 * @returns {Promise<Array>} Array of generated tasks
 */
async function generateBatchTasks(userId, count = 5) {
  try {
    console.log(`\n🔄 Generating ${count} tasks for user ${userId}...`);
    const tasks = [];
    
    for (let i = 0; i < count; i++) {
      console.log(`\n[Task ${i + 1}/${count}]`);
      const task = await generateAndStoreTask(userId);
      tasks.push(task);
      
      // Add delay between generations to avoid overwhelming the system
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\n✅ Batch generation complete! Generated ${tasks.length} tasks`);
    return tasks;
  } catch (error) {
    console.error('❌ Batch generation failed:', error.message);
    throw error;
  }
}

/**
 * QUERY RECENT TASKS: Get the most recent N tasks for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of recent tasks (default 5)
 * @returns {Promise<Array>} Recent tasks
 */
async function getRecentTasks(userId, limit = 5) {
  try {
    const query = `
      SELECT id, title, category, difficulty, xp_reward, 
             duration, stat_rewards, created_at
      FROM tasks
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    console.log(`✅ Retrieved ${result.rows.length} recent tasks`);
    return result.rows;
  } catch (error) {
    console.error('❌ Error querying recent tasks:', error.message);
    throw error;
  }
}

/**
 * DELETE RECENT TASK: Remove the most recently generated task
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deleted task info
 */
async function deleteRecentTask(userId) {
  try {
    const query = `
      DELETE FROM tasks
      WHERE id = (
        SELECT id FROM tasks
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      )
      RETURNING id, title, created_at
    `;
    
    const result = await pool.query(query, [userId]);
    if (result.rows.length > 0) {
      console.log(`✅ Deleted task: ${result.rows[0].title}`);
      return result.rows[0];
    } else {
      console.log('⚠️  No tasks to delete');
      return null;
    }
  } catch (error) {
    console.error('❌ Error deleting task:', error.message);
    throw error;
  }
}

// Export functions
export {
  generateAndStoreTask,
  generateBatchTasks,
  getRecentTasks,
  deleteRecentTask,
  loadUserProfile,
  loadMLModels,
  prepareFeatureVector,
  runMLInference,
  mapInferenceToTask,
  storeTaskInDatabase
};

// Example usage (uncomment to test)
/*
(async () => {
  try {
    // Get first user
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.error('No users found');
      process.exit(1);
    }
    
    const userId = userResult.rows[0].id;
    
    // Generate single task
    const task = await generateAndStoreTask(userId);
    console.log('\nGenerated task:', task);
    
    // Get recent tasks
    const recentTasks = await getRecentTasks(userId, 5);
    console.log('\nRecent tasks:', recentTasks);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
*/
