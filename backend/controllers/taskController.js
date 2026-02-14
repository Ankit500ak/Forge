// Debug log for Supabase env vars
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);

import { createClient } from '@supabase/supabase-js';
import { checkLevelUp, getLevelFromXp } from '../utils/level.js';
import { generateAndStoreTask, getRecentTasks } from '../mlTaskGenerator.js';
import { generateSimpleTasks, generateSimpleTaskForUser } from '../simpleTaskGenerator.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate task using ML model
export const generateMLTaskForUser = async (req, res) => {
  const userId = req.userId;

  try {
    console.log(`[ML] Generating task for user ${userId}`);

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Use mlTaskGenerator to generate and store task
    const createdTask = await generateAndStoreTask(userId);

    console.log(`[ML] ✅ Task generated and saved:`, createdTask.id);

    res.status(201).json({
      message: 'ML task generated successfully',
      task: {
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description,
        category: createdTask.category,
        difficulty: createdTask.difficulty,
        xp_reward: createdTask.xp_reward,
        duration: createdTask.duration,
        stat_rewards: createdTask.stat_rewards,
        scheduled_date: createdTask.scheduled_date
      }
    });

  } catch (err) {
    console.error('[ML] Error generating task:', err.message);
    console.error('[ML] Stack trace:', err.stack);
    res.status(500).json({
      message: 'Failed to generate ML task',
      error: err.message
    });
  }
};

// Generate multiple ML tasks
export const generateMLTasksBatch = async (req, res) => {
  const userId = req.userId;
  const { count = 4 } = req.body;

  try {
    console.log(`[ML] Generating ${count} tasks for user ${userId}`);

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (count < 1 || count > 10) {
      return res.status(400).json({ message: 'Count must be between 1 and 10' });
    }

    const generatedTasks = [];
    const errors = [];

    // Generate multiple tasks using mlTaskGenerator
    for (let i = 0; i < count; i++) {
      try {
        console.log(`[ML] Generating task ${i + 1}/${count}...`);
        const task = await generateAndStoreTask(userId);

        generatedTasks.push({
          id: task.id,
          title: task.title,
          description: task.description,
          category: task.category,
          difficulty: task.difficulty,
          xp_reward: task.xp_reward,
          duration: task.duration,
          stat_rewards: task.stat_rewards
        });
      } catch (taskErr) {
        console.error(`[ML] Error generating task ${i + 1}:`, taskErr.message);
        errors.push({ task: i + 1, error: taskErr.message });
        // Continue generating other tasks
      }
    }

    console.log(`[ML] ✅ Generated ${generatedTasks.length}/${count} tasks`);

    res.status(201).json({
      message: `${generatedTasks.length} tasks generated successfully`,
      tasks: generatedTasks,
      count: generatedTasks.length,
      totalRequested: count,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error('[ML] Error generating task batch:', err.message);
    console.error('[ML] Stack trace:', err.stack);
    res.status(500).json({
      message: 'Failed to generate ML tasks',
      error: err.message
    });
  }
};

// Get all tasks for today
export const getTodayTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log(`[getTodayTasks] Fetching tasks for user: ${userId}`);
    console.log(`[getTodayTasks] Today's date: ${today}`);

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // FIRST: Fetch today's tasks to check if generation is needed
    const { data: todayTasks, error: todayTasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('scheduled_date', today);

    if (todayTasksError) {
      console.error('[getTodayTasks] ❌ Error fetching today\'s tasks:');
      console.error('  Message:', todayTasksError.message);
      console.error('  Code:', todayTasksError.code);

      if (todayTasksError.code === '42501') {
        return res.status(500).json({
          message: 'Database access denied (RLS enabled)',
          error: 'RLS_PERMISSION_DENIED',
          details: 'RLS is blocking access to tasks table.',
          table: 'tasks',
          code: todayTasksError.code
        });
      }

      return res.status(500).json({
        message: 'Failed to check today\'s tasks',
        error: todayTasksError.message || 'Unknown error',
        code: todayTasksError.code
      });
    }

    const todayTaskCount = todayTasks?.length || 0;
    console.log(`[getTodayTasks] Today's task count: ${todayTaskCount}`);

    let autoGenerated = false;

    // If user has NO tasks for TODAY, auto-generate 5 tasks
    if (todayTaskCount === 0) {
      console.log(`[getTodayTasks] 🚀 ENTERING AUTO-GENERATION BLOCK FOR TODAY... (0 tasks found for ${today})`);

      try {
        // Get user's fitness level - FIXED: Use proper relationship query or direct field
        let fitnessLevel = 'beginner';

        // Option 1: If fitness_level is directly on users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, fitness_level')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('[getTodayTasks] Error fetching user data:', userError);
          console.log('[getTodayTasks] Using default fitness level: beginner');
        } else if (userData?.fitness_level) {
          fitnessLevel = userData.fitness_level;
        } else {
          // Option 2: If fitness_level is in a separate fitness_profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('fitness_profiles')
            .select('fitness_level')
            .eq('user_id', userId)
            .maybeSingle();

          if (!profileError && profileData?.fitness_level) {
            fitnessLevel = profileData.fitness_level;
          } else {
            console.log('[getTodayTasks] No fitness profile found, using default: beginner');
          }
        }

        console.log(`[getTodayTasks] Fitness level: ${fitnessLevel}`);

        // Only try to generate tasks if PostgreSQL is available
        // On Render, PostgreSQL might not be available for task generation
        try {
          console.log('[getTodayTasks] Attempting to generate tasks...');
          const generatedTasks = await generateSimpleTasks(userId, fitnessLevel, 5);
          console.log(`[getTodayTasks] ✅ Generated ${generatedTasks.length} tasks`);
          autoGenerated = true;
        } catch (postgresErr) {
          // Check if it's a PostgreSQL connection error
          if (postgresErr.code === 'ECONNREFUSED' || postgresErr.message?.includes('ECONNREFUSED')) {
            console.warn(`[getTodayTasks] ⚠️ PostgreSQL not available for task generation (ECONNREFUSED)`);
            console.warn('[getTodayTasks] Continuing without auto-generated tasks');
            // This is okay - user will just have empty task list
          } else {
            console.error('[getTodayTasks] PostgreSQL Error Details:');
            console.error('  Code:', postgresErr.code);
            console.error('  Message:', postgresErr.message);
            console.error('  Detail:', postgresErr.detail);
            console.error('  Hint:', postgresErr.hint);
            console.error('  Full error:', postgresErr);
            throw postgresErr;
          }
        }
      } catch (genErr) {
        console.error(`[getTodayTasks] ❌ Error auto-generating tasks:`, genErr.message);
        console.error('[getTodayTasks] Stack trace:', genErr.stack);
        console.error('[getTodayTasks] Full error object:', genErr);
        // Don't block if generation fails - user will get empty list
      }
    }

    // Now fetch today's tasks with full details (including newly generated ones)
    console.log(`[getTodayTasks] Fetching today's tasks with full details...`);

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id, 
        title, 
        description, 
        category, 
        xp_reward, 
        completed, 
        completed_at,
        scheduled_date,
        difficulty,
        duration,
        stat_rewards
      `)
      .eq('user_id', userId)
      .eq('scheduled_date', today)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('[getTodayTasks] Error fetching tasks:', tasksError);
      return res.status(500).json({
        message: 'Failed to fetch tasks',
        error: tasksError.message
      });
    }

    console.log(`[getTodayTasks] ✅ Found ${tasks?.length || 0} tasks for today`);
    if (autoGenerated) {
      console.log(`[getTodayTasks] 🎉 AUTO-GENERATED ${tasks?.length || 0} NEW TASKS FOR TODAY!`);
    }

    res.json({
      message: 'Today tasks retrieved',
      tasks: tasks || [],
      total: tasks?.length || 0,
      completedCount: tasks?.filter(t => t.completed).length || 0,
      autoGenerated: autoGenerated,
    });
  } catch (err) {
    console.error('[Tasks] Error fetching today tasks:', err);
    console.error('[Tasks] Stack trace:', err.stack);
    res.status(500).json({
      message: 'Failed to fetch tasks',
      error: err.message
    });
  }
};

// Get all tasks for a user
export const getUserTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const { date, status } = req.query; // optional date filter (YYYY-MM-DD) and status filter

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (date) {
      query = query.eq('scheduled_date', date);
    }

    if (status === 'completed') {
      query = query.eq('completed', true);
    } else if (status === 'pending') {
      query = query.eq('completed', false);
    }

    const { data: tasks, error } = await query
      .order('scheduled_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Tasks] Error fetching user tasks:', error);
      return res.status(500).json({
        message: 'Failed to fetch tasks',
        error: error.message
      });
    }

    res.json({
      message: 'User tasks retrieved',
      tasks: tasks || [],
      total: tasks?.length || 0,
      completedCount: tasks?.filter(t => t.completed).length || 0,
      pendingCount: tasks?.filter(t => !t.completed).length || 0,
      autoGenerated: false,
    });
  } catch (err) {
    console.error('[Tasks] Error fetching user tasks:', err);
    console.error('[Tasks] Stack trace:', err.stack);
    res.status(500).json({
      message: 'Failed to fetch tasks',
      error: err.message
    });
  }
};

// Complete a task and add XP
export const completeTask = async (req, res) => {
  const userId = req.userId;
  const { taskId } = req.body;

  try {
    console.log(`[Tasks] Completing task ${taskId} for user ${userId}`);

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate taskId - accept both numeric and UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isNumeric = /^\d+$/.test(String(taskId));
    const isUUID = uuidRegex.test(String(taskId));

    if (!isNumeric && !isUUID) {
      console.error(`[Tasks] Invalid task ID format: ${taskId}`);
      return res.status(400).json({ message: 'Invalid task ID format. Must be a valid ID or UUID.' });
    }

    console.log(`[Tasks] Task ID type: ${isNumeric ? 'numeric' : 'UUID'}`);

    // Try to get task - handle both numeric and UUID IDs
    let task = null;
    let taskError = null;

    if (isUUID) {
      // Direct UUID query
      const result = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();
      task = result.data;
      taskError = result.error;
    } else if (isNumeric) {
      // For numeric IDs, fetch all user tasks and filter in-memory
      console.log(`[Tasks] Attempting to find numeric task ID: ${taskId}`);
      const result = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      if (result.error) {
        taskError = result.error;
      } else if (result.data) {
        // Try to match by ID (converted to string for comparison)
        task = result.data.find(t => String(t.id) === String(taskId));
        if (!task) {
          taskError = { code: 'PGRST116', message: 'Task not found' };
        }
      }
    }

    if (taskError) {
      if (taskError.code === 'PGRST116' || taskError.message?.includes('not found')) {
        console.log(`[Tasks] Task not found: ${taskId}`);
        return res.status(404).json({ message: 'Task not found' });
      }
      console.error('[Tasks] Error fetching task:', taskError);
      return res.status(500).json({
        message: 'Failed to fetch task',
        error: taskError.message
      });
    }

    if (!task) {
      console.log(`[Tasks] Task not found: ${taskId}`);
      return res.status(404).json({ message: 'Task not found' });
    } else {
      // It's not JSON, skip it
      console.warn(`[Tasks] Warning: stat_rewards is not valid JSON: "${task.stat_rewards}"`);
      statRewards = {};
    }
  } else if (typeof task.stat_rewards === 'object' && task.stat_rewards !== null) {
    // Already an object, use as-is
    statRewards = task.stat_rewards;
  }
} catch (parseErr) {
  console.warn(`[Tasks] Warning: Could not parse stat_rewards for task ${task.id}:`, parseErr.message);
  statRewards = {};
}
    }
console.log(`[Tasks] 📊 Stat rewards for "${task.title}":`, statRewards);

// Mark task as completed
const { error: completeError } = await supabase
  .from('tasks')
  .update({
    completed: true,
    completed_at: new Date().toISOString()
  })
  .eq('id', taskId)
  .eq('user_id', userId); // Extra safety check

if (completeError) {
  console.error('[Tasks] Error marking task as completed:', completeError);
  return res.status(500).json({
    message: 'Failed to complete task',
    error: completeError.message
  });
}

// Ensure user_progression and user_stats rows exist
try {
  // Check if progression row exists
  const { data: progCheck, error: progCheckError } = await supabase
    .from('user_progression')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (progCheckError) {
    console.error('[Tasks] Error checking progression:', progCheckError);
    throw new Error(`Failed to check user progression: ${progCheckError.message}`);
  }

  if (!progCheck) {
    console.log(`[Tasks] Creating missing progression row for user ${userId}`);
    const { error: progInsertError } = await supabase
      .from('user_progression')
      .insert({
        user_id: userId,
        level: 1,
        stat_points: 0,
        xp_today: 0,
        rank: 'F',
        total_xp: 0,
        weekly_xp: 0,
        monthly_xp: 0,
        experience_points: 0,
        next_level_percent: 0,
        current_streak: 0,
        longest_streak: 0,
        tasks_completed: 0,
        prestige: 0,
        joined_date: new Date().toISOString(),
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (progInsertError) {
      console.error('[Tasks] Error creating progression:', progInsertError);
      throw new Error(`Failed to create user progression: ${progInsertError.message}`);
    }
  }

  // Check if stats row exists
  const { data: statsCheck, error: statsCheckError } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (statsCheckError) {
    console.error('[Tasks] Error checking stats:', statsCheckError);
    throw new Error(`Failed to check user stats: ${statsCheckError.message}`);
  }

  if (!statsCheck) {
    console.log(`[Tasks] Creating missing stats row for user ${userId}`);
    const { error: statsInsertError } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        user_id_ref: userId,
        bench_press: 0,
        deadlift: 0,
        squat: 0,
        total_lifted: 0,
        strength_goal: 0,
        distance_run_km: 0,
        calories_burned: 0,
        cardio_sessions: 0,
        longest_run_km: 0,
        strength: 0,
        speed: 0,
        endurance: 0,
        agility: 0,
        power: 0,
        recovery: 0,
        reflex_time: 0,
        flexibility: 0,
        bmi: 0,
        resting_heart_rate: 0,
        sleep_quality: 0,
        stress_level: 0,
        health: 10,
        base_stats: 10,
        experience_points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (statsInsertError) {
      console.error('[Tasks] Error creating stats:', statsInsertError);
      throw new Error(`Failed to create user stats: ${statsInsertError.message}`);
    }
  }
} catch (initErr) {
  console.error(`[Tasks] Error initializing user tables:`, initErr.message);
  console.error('[Tasks] Stack trace:', initErr.stack);
  return res.status(500).json({
    message: 'Failed to initialize user data',
    error: initErr.message
  });
}

// Get current progression values
const { data: currentProg, error: currentProgError } = await supabase
  .from('user_progression')
  .select('xp_today, total_xp, weekly_xp, monthly_xp, tasks_completed')
  .eq('user_id', userId)
  .single();

if (currentProgError) {
  console.error('[Tasks] Error fetching current progression:', currentProgError);
  return res.status(500).json({
    message: 'Failed to fetch user progression',
    error: currentProgError.message
  });
}

// Add XP to user progression and increment task counter
try {
  const { error: progUpdateError } = await supabase
    .from('user_progression')
    .update({
      xp_today: (currentProg.xp_today || 0) + xpReward,
      total_xp: (currentProg.total_xp || 0) + xpReward,
      weekly_xp: (currentProg.weekly_xp || 0) + xpReward,
      monthly_xp: (currentProg.monthly_xp || 0) + xpReward,
      tasks_completed: (currentProg.tasks_completed || 0) + 1,
      last_active: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (progUpdateError) {
    console.error('[Tasks] Error updating progression:', progUpdateError);
    throw new Error(`Failed to update user progression: ${progUpdateError.message}`);
  }

  console.log(`[Tasks] ✅ XP updated: +${xpReward} XP`);
} catch (progErr) {
  console.error(`[Tasks] Error updating progression:`, progErr.message);
  console.error('[Tasks] Stack trace:', progErr.stack);
  return res.status(500).json({
    message: 'Failed to update progression',
    error: progErr.message
  });
}

// 👑 UPDATE USER STATS with stat rewards from task
try {
  // Whitelist of valid stat columns (6-stat system)
  const validStats = ['strength', 'speed', 'endurance', 'agility', 'power', 'recovery'];

  const appliedStats = {};
  const updateData = { updated_at: new Date().toISOString() };

  // Only proceed if there are stat rewards
  if (Object.keys(statRewards).length > 0) {
    // Get current stat values
    const { data: currentStats, error: currentStatsError } = await supabase
      .from('user_stats')
      .select(validStats.join(', '))
      .eq('user_id', userId)
      .single();

    if (currentStatsError) {
      console.error('[Tasks] Error fetching current stats:', currentStatsError);
      throw new Error(`Failed to fetch current stats: ${currentStatsError.message}`);
    }

    // Build update object based on stat_rewards (with validation)
    for (const [stat, value] of Object.entries(statRewards)) {
      // Validate column name
      if (!validStats.includes(stat)) {
        console.warn(`[Tasks] Skipping invalid stat column: ${stat}`);
        continue;
      }

      const currentValue = parseInt(currentStats[stat]) || 0;
      const rewardValue = parseInt(value) || 0;

      if (rewardValue !== 0) {
        // Ensure stats don't go below 0
        const newValue = Math.max(0, currentValue + rewardValue);
        updateData[stat] = newValue;
        appliedStats[stat] = rewardValue;
      }
    }

    // Only update if there are stat changes
    if (Object.keys(appliedStats).length > 0) {
      const { error: statsUpdateError } = await supabase
        .from('user_stats')
        .update(updateData)
        .eq('user_id', userId);

      if (statsUpdateError) {
        console.error('[Tasks] Error updating stats:', statsUpdateError);
        throw new Error(`Failed to update stats: ${statsUpdateError.message}`);
      }

      console.log(`[Tasks] ✅ Stat rewards applied to user: ${JSON.stringify(appliedStats)}`);
    }
  }
} catch (statErr) {
  console.error(`[Tasks] Error updating stats:`, statErr.message);
  console.error('[Tasks] Stack trace:', statErr.stack);
  // Don't fail the task completion, just log the error
}

// Get updated progression
const { data: updated, error: updatedError } = await supabase
  .from('user_progression')
  .select('*')
  .eq('user_id', userId)
  .single();

if (updatedError) {
  console.error('[Tasks] Error fetching updated progression:', updatedError);
  // Don't fail, just return the values we know
}

console.log(`[Tasks] ✅ Task completed successfully! Added ${xpReward} XP`);

res.json({
  message: 'Task completed successfully',
  task: {
    id: task.id,
    title: task.title,
    xpGain: xpReward,
    category: task.category,
    statRewards: statRewards
  },
  progression: {
    xp_today: updated?.xp_today || (currentProg.xp_today + xpReward),
    total_xp: updated?.total_xp || (currentProg.total_xp + xpReward),
    weekly_xp: updated?.weekly_xp || (currentProg.weekly_xp + xpReward),
    monthly_xp: updated?.monthly_xp || (currentProg.monthly_xp + xpReward),
    tasks_completed: updated?.tasks_completed || ((currentProg.tasks_completed || 0) + 1)
  }
});
  } catch (err) {
  console.error('[Tasks] Error completing task:', err.message);
  console.error('[Tasks] Stack trace:', err.stack);
  res.status(500).json({
    message: 'Failed to complete task',
    error: err.message
  });
}
};

// Create a new task (admin or user can create for themselves)
export const createTask = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      title,
      description,
      category,
      xpReward,
      scheduledDate,
      difficulty,
      duration,
      statRewards
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!title || !category || !xpReward || !scheduledDate) {
      return res.status(400).json({
        message: 'Title, category, xpReward, and scheduledDate are required'
      });
    }

    // Validate scheduled date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scheduledDate)) {
      return res.status(400).json({
        message: 'scheduledDate must be in YYYY-MM-DD format'
      });
    }

    const insertData = {
      user_id: userId,
      title,
      description: description || null,
      category,
      xp_reward: parseInt(xpReward),
      scheduled_date: scheduledDate,
      difficulty: difficulty || 'medium',
      duration: duration || null,
      stat_rewards: statRewards || null,
      completed: false,
      created_at: new Date().toISOString()
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[Tasks] Error creating task:', error);
      return res.status(500).json({
        message: 'Failed to create task',
        error: error.message
      });
    }

    console.log(`[Tasks] ✅ Task created: ${task.id} - "${task.title}"`);

    res.status(201).json({
      message: 'Task created successfully',
      task: task,
    });
  } catch (err) {
    console.error('[Tasks] Error creating task:', err);
    console.error('[Tasks] Stack trace:', err.stack);
    res.status(500).json({
      message: 'Failed to create task',
      error: err.message
    });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const userId = req.userId;
    const { taskId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    // Validate task belongs to user
    const { data: existingTask, error: checkError } = await supabase
      .from('tasks')
      .select('id, user_id')
      .eq('id', taskId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('[Tasks] Error checking task ownership:', checkError);
      return res.status(500).json({
        message: 'Failed to verify task ownership',
        error: checkError.message
      });
    }

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    // Prepare update data (whitelist allowed fields)
    const allowedUpdates = [
      'title', 'description', 'category', 'xp_reward',
      'scheduled_date', 'difficulty', 'duration', 'stat_rewards'
    ];

    const updateData = {};
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Tasks] Error updating task:', error);
      return res.status(500).json({
        message: 'Failed to update task',
        error: error.message
      });
    }

    console.log(`[Tasks] ✅ Task updated: ${task.id}`);

    res.json({
      message: 'Task updated successfully',
      task: task,
    });
  } catch (err) {
    console.error('[Tasks] Error updating task:', err);
    console.error('[Tasks] Stack trace:', err.stack);
    res.status(500).json({
      message: 'Failed to update task',
      error: err.message
    });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const userId = req.userId;
    const { taskId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Task not found or access denied' });
      }
      console.error('[Tasks] Error deleting task:', error);
      return res.status(500).json({
        message: 'Failed to delete task',
        error: error.message
      });
    }

    console.log(`[Tasks] ✅ Task deleted: ${task.id} - "${task.title}"`);

    res.json({
      message: 'Task deleted successfully',
      task: task,
    });
  } catch (err) {
    console.error('[Tasks] Error deleting task:', err);
    console.error('[Tasks] Stack trace:', err.stack);
    res.status(500).json({
      message: 'Failed to delete task',
      error: err.message
    });
  }
};