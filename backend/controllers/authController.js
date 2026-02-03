import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';
import { generateAndStoreTask } from '../mlTaskGenerator.js';

// Parse connection string to avoid system environment variable interference
const parseConnectionString = () => {
  const url = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/fitnessdb';
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    return {
      user: match[1],
      password: match[2],
      host: match[3],
      port: parseInt(match[4]),
      database: match[5],
      connectionTimeoutMillis: 5000
    };
  }
  return { connectionString: url, connectionTimeoutMillis: 5000 };
};

const pool = new Pool(parseConnectionString());

export const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name,
      // Step 2: Personal Metrics
      age,
      gender,
      height,
      weight,
      targetWeight,
      // Step 3: Fitness Profile
      fitnessLevel,
      goals,
      activityLevel,
      preferredWorkouts,
      workoutFrequency,
      workoutDuration,
      // Step 4: Health & Lifestyle
      medicalConditions,
      injuries,
      dietaryPreferences,
      sleepHours,
      stressLevel,
      smokingStatus,
      // Step 5: Preferences & Wallet
      preferredWorkoutTime,
      gymAccess,
      equipment,
      motivationLevel,
      walletAddress
    } = req.body;

    console.log('Register request received:', { email, name, age, gender, fitnessLevel, walletAddress, password: password ? 'provided' : 'MISSING' });

    // Validate all required fields
    if (!email || !password || !name) {
      console.error('Validation failed - missing required fields:', { email: !!email, password: !!password, name: !!name });
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    let userId;
    try {
      const userResult = await pool.query(
        'INSERT INTO users (email, name, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, email, name',
        [email, name, password_hash]
      );
      userId = userResult.rows[0].id;
      console.log('User created:', { userId, email, name });
    } catch (err) {
      if (err.code === '23505') {
        console.error('Email already registered:', email);
        return res.status(400).json({ message: 'Email already registered. Please login or use a different email.' });
      }
      console.error('User creation error:', err);
      return res.status(500).json({ message: 'Failed to create user profile', error: err.message });
    }

    // Insert fitness profile with all fields
    try {
      await pool.query(
        `INSERT INTO fitness_profiles 
          (user_id, age, gender, height, weight, target_weight, fitness_level, goals, activity_level, 
           preferred_workouts, workout_frequency, workout_duration, medical_conditions, injuries, 
           dietary_preferences, sleep_hours, stress_level, smoking_status, preferred_workout_time, 
           gym_access, equipment, motivation_level, wallet_address, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())`,
        [
          userId,
          age ? parseInt(age) : null,
          gender || null,
          height ? parseFloat(height) : null,
          weight ? parseFloat(weight) : null,
          targetWeight ? parseFloat(targetWeight) : null,
          fitnessLevel || null,
          goals ? (Array.isArray(goals) ? goals : [goals]) : null,
          activityLevel || null,
          preferredWorkouts ? (Array.isArray(preferredWorkouts) ? preferredWorkouts : [preferredWorkouts]) : null,
          workoutFrequency || null,
          workoutDuration || null,
          medicalConditions ? (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions]) : null,
          injuries || null,
          dietaryPreferences ? (Array.isArray(dietaryPreferences) ? dietaryPreferences : [dietaryPreferences]) : null,
          sleepHours || null,
          stressLevel || null,
          smokingStatus || null,
          preferredWorkoutTime || null,
          gymAccess || null,
          equipment ? (Array.isArray(equipment) ? equipment : [equipment]) : null,
          motivationLevel || null,
          walletAddress || null,
        ]
      );
      console.log('Fitness profile created for user:', userId);
    } catch (err) {
      console.error('Fitness profile creation error:', err);
      return res.status(400).json({ message: 'Failed to create fitness profile', error: err.message });
    }

    // Insert initial progression and stats
    try {
      await pool.query(
        `INSERT INTO user_progression 
          (user_id, level, stat_points, xp_today, rank, total_xp, weekly_xp, monthly_xp, experience_points, next_level_percent, joined_date, last_active, created_at)
         VALUES ($1, 1, 0, 0, 'F', 0, 0, 0, 0, 0, NOW(), NOW(), NOW())`,
        [userId]
      );
      await pool.query(
        `INSERT INTO user_stats 
          (user_id, user_id_ref, bench_press, deadlift, squat, total_lifted, strength_goal, distance_run_km, calories_burned, cardio_sessions, longest_run_km, speed, reflex_time, flexibility, bmi, resting_heart_rate, sleep_quality, stress_level, health, base_stats, experience_points, created_at, updated_at)
         VALUES ($1, $1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 10, 0, NOW(), NOW())`,
        [userId]
      );
      console.log('Progression and stats created for user:', userId);
    } catch (err) {
      // Don't block registration if these fail, just log
      console.error('Error creating initial progression/stats:', err);
    }

    // Generate JWT token
    const token = generateToken(userId);
    console.log('Registration successful for:', email);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        email,
        name,
        // Step 2
        age,
        gender,
        height,
        weight,
        targetWeight,
        // Step 3
        fitnessLevel,
        goals,
        activityLevel,
        preferredWorkouts,
        workoutFrequency,
        workoutDuration,
        // Step 4
        medicalConditions,
        injuries,
        dietaryPreferences,
        sleepHours,
        stressLevel,
        smokingStatus,
        // Step 5
        preferredWorkoutTime,
        gymAccess,
        equipment,
        motivationLevel,
        walletAddress,
      },
      generatedTasks: {
        message: 'Tasks will be auto-generated on first login',
        count: 0,
        tasks: []
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user by email
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Fetch fitness profile
    const fitnessResult = await pool.query('SELECT * FROM fitness_profiles WHERE user_id = $1', [user.id]);
    const fitness = fitnessResult.rows[0] || {};

    // Auto-generate tasks if user has none
    try {
      const tasksCheck = await pool.query(
        'SELECT COUNT(*) as count FROM tasks WHERE user_id = $1',
        [user.id]
      );
      
      if (tasksCheck.rows[0].count === 0) {
        console.log(`[Login] Auto-generating 5 tasks for user ${user.id}...`);
        for (let i = 0; i < 5; i++) {
          await generateAndStoreTask(user.id);
        }
        console.log(`[Login] ✅ Generated 5 tasks for user ${user.id}`);
      }
    } catch (genErr) {
      console.error(`[Login] Error auto-generating tasks: ${genErr.message}`);
      // Continue with login even if task generation fails
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        // Step 2
        age: fitness.age,
        gender: fitness.gender,
        height: fitness.height,
        weight: fitness.weight,
        targetWeight: fitness.target_weight,
        // Step 3
        fitnessLevel: fitness.fitness_level,
        goals: fitness.goals,
        activityLevel: fitness.activity_level,
        preferredWorkouts: fitness.preferred_workouts,
        workoutFrequency: fitness.workout_frequency,
        workoutDuration: fitness.workout_duration,
        // Step 4
        medicalConditions: fitness.medical_conditions,
        injuries: fitness.injuries,
        dietaryPreferences: fitness.dietary_preferences,
        sleepHours: fitness.sleep_hours,
        stressLevel: fitness.stress_level,
        smokingStatus: fitness.smoking_status,
        // Step 5
        preferredWorkoutTime: fitness.preferred_workout_time,
        gymAccess: fitness.gym_access,
        equipment: fitness.equipment,
        motivationLevel: fitness.motivation_level,
        walletAddress: fitness.wallet_address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

