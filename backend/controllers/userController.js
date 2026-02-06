import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get user profile with stats
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`[Users] Fetching profile for user: ${userId}`);

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, age, gender, fitness_level, level, total_xp')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log(`[Users] User not found: ${userId}`);
        return res.status(404).json({ message: 'User not found' });
      }
      console.error('[Users] Error fetching user:', userError);
      return res.status(500).json({ 
        message: 'Failed to fetch user data', 
        error: userError.message 
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user stats (6-stat system)
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('strength, speed, endurance, agility, power, recovery')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsError) {
      console.error('[Users] Error fetching stats:', statsError);
      return res.status(500).json({ 
        message: 'Failed to fetch user stats', 
        error: statsError.message 
      });
    }

    const stats = statsData || {
      strength: 0,
      speed: 0,
      endurance: 0,
      agility: 0,
      power: 0,
      recovery: 0
    };

    console.log(`[Users] ✅ Profile fetched for ${user.email}`);

    res.json({
      message: 'User profile retrieved',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        fitness_level: user.fitness_level,
        level: user.level || 1,
        total_xp: user.total_xp || 0
      },
      stats: {
        strength: parseInt(stats.strength) || 0,
        speed: parseInt(stats.speed) || 0,
        endurance: parseInt(stats.endurance) || 0,
        agility: parseInt(stats.agility) || 0,
        power: parseInt(stats.power) || 0,
        recovery: parseInt(stats.recovery) || 0
      }
    });
  } catch (error) {
    console.error('[Users] Error fetching profile:', error.message);
    console.error('[Users] Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch profile', 
      error: error.message 
    });
  }
};

/**
 * Get all user stats
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`[Users] Fetching stats for user: ${userId}`);

    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[Users] Stats not found for user: ${userId}`);
        return res.status(404).json({ message: 'Stats not found' });
      }
      console.error('[Users] Error fetching stats:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch stats', 
        error: error.message 
      });
    }

    if (!stats) {
      return res.status(404).json({ message: 'Stats not found' });
    }

    console.log(`[Users] ✅ Stats fetched for user: ${userId}`);

    res.json({
      message: 'User stats retrieved',
      stats: {
        strength: parseInt(stats.strength) || 0,
        speed: parseInt(stats.speed) || 0,
        endurance: parseInt(stats.endurance) || 0,
        agility: parseInt(stats.agility) || 0,
        power: parseInt(stats.power) || 0,
        recovery: parseInt(stats.recovery) || 0,
        // Include additional stats if they exist
        bench_press: parseInt(stats.bench_press) || 0,
        deadlift: parseInt(stats.deadlift) || 0,
        squat: parseInt(stats.squat) || 0,
        total_lifted: parseInt(stats.total_lifted) || 0,
        distance_run_km: parseFloat(stats.distance_run_km) || 0,
        calories_burned: parseInt(stats.calories_burned) || 0,
        cardio_sessions: parseInt(stats.cardio_sessions) || 0,
        longest_run_km: parseFloat(stats.longest_run_km) || 0,
        flexibility: parseInt(stats.flexibility) || 0,
        bmi: parseFloat(stats.bmi) || 0,
        resting_heart_rate: parseInt(stats.resting_heart_rate) || 0,
        sleep_quality: parseInt(stats.sleep_quality) || 0,
        stress_level: parseInt(stats.stress_level) || 0
      }
    });
  } catch (error) {
    console.error('[Users] Error fetching stats:', error.message);
    console.error('[Users] Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch stats', 
      error: error.message 
    });
  }
};

/**
 * Update user stats
 */
export const updateUserStats = async (req, res) => {
  try {
    const userId = req.userId;
    const statsUpdate = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`[Users] Updating stats for user: ${userId}`);

    // Whitelist of valid stat columns (6-stat system + additional fitness metrics)
    const validStats = [
      'strength', 'speed', 'endurance', 'agility', 'power', 'recovery',
      'bench_press', 'deadlift', 'squat', 'total_lifted',
      'distance_run_km', 'calories_burned', 'cardio_sessions', 'longest_run_km',
      'flexibility', 'bmi', 'resting_heart_rate', 'sleep_quality', 'stress_level'
    ];

    // Filter out invalid fields
    const updateData = {};
    for (const [key, value] of Object.entries(statsUpdate)) {
      if (validStats.includes(key)) {
        updateData[key] = value;
      } else {
        console.warn(`[Users] Ignoring invalid stat field: ${key}`);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid stats to update' });
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Check if stats row exists
    const { data: existingStats, error: checkError } = await supabase
      .from('user_stats')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('[Users] Error checking stats:', checkError);
      return res.status(500).json({ 
        message: 'Failed to check user stats', 
        error: checkError.message 
      });
    }

    let result;
    if (!existingStats) {
      // Create new stats row
      console.log(`[Users] Creating new stats row for user: ${userId}`);
      updateData.user_id = userId;
      updateData.created_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('user_stats')
        .insert(updateData)
        .select()
        .single();

      if (error) {
        console.error('[Users] Error creating stats:', error);
        return res.status(500).json({ 
          message: 'Failed to create user stats', 
          error: error.message 
        });
      }
      result = data;
    } else {
      // Update existing stats row
      const { data, error } = await supabase
        .from('user_stats')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[Users] Error updating stats:', error);
        return res.status(500).json({ 
          message: 'Failed to update user stats', 
          error: error.message 
        });
      }
      result = data;
    }

    console.log(`[Users] ✅ Stats updated for user: ${userId}`);

    res.json({
      message: 'User stats updated successfully',
      stats: result
    });
  } catch (error) {
    console.error('[Users] Error updating stats:', error.message);
    console.error('[Users] Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Failed to update stats', 
      error: error.message 
    });
  }
};

/**
 * Initialize user stats (create if not exists)
 */
export const initializeUserStats = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`[Users] Initializing stats for user: ${userId}`);

    // Check if stats already exist
    const { data: existingStats, error: checkError } = await supabase
      .from('user_stats')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('[Users] Error checking stats:', checkError);
      return res.status(500).json({ 
        message: 'Failed to check user stats', 
        error: checkError.message 
      });
    }

    if (existingStats) {
      console.log(`[Users] Stats already exist for user: ${userId}`);
      
      // Return existing stats
      const { data: stats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('[Users] Error fetching existing stats:', fetchError);
        return res.status(500).json({ 
          message: 'Failed to fetch stats', 
          error: fetchError.message 
        });
      }

      return res.json({
        message: 'User stats already initialized',
        stats: stats,
        created: false
      });
    }

    // Create new stats row with default values
    const { data: newStats, error: createError } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        user_id_ref: userId,
        strength: 0,
        speed: 0,
        endurance: 0,
        agility: 0,
        power: 0,
        recovery: 0,
        bench_press: 0,
        deadlift: 0,
        squat: 0,
        total_lifted: 0,
        distance_run_km: 0,
        calories_burned: 0,
        cardio_sessions: 0,
        longest_run_km: 0,
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
      })
      .select()
      .single();

    if (createError) {
      console.error('[Users] Error creating stats:', createError);
      return res.status(500).json({ 
        message: 'Failed to create user stats', 
        error: createError.message 
      });
    }

    console.log(`[Users] ✅ Stats initialized for user: ${userId}`);

    res.status(201).json({
      message: 'User stats initialized successfully',
      stats: newStats,
      created: true
    });
  } catch (error) {
    console.error('[Users] Error initializing stats:', error.message);
    console.error('[Users] Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Failed to initialize stats', 
      error: error.message 
    });
  }
};