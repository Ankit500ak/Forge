import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';
import { generateAndStoreTask } from '../mlTaskGenerator.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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

    console.log('Register request received:', req.body);

    // Validate all required fields
    if (!email || !password || !name) {
      console.error('Validation failed - missing required fields:', { email, password, name });
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    if (password.length < 8) {
      console.error('Validation failed - password too short:', password);
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Password hash not needed; Supabase Auth manages passwords

    // Insert user using Supabase Auth and DB
    let userId;
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });
      if (authError) {
        if (authError.message && authError.message.includes('already registered')) {
          console.error('Email already registered:', email);
          return res.status(400).json({ message: 'Email already registered. Please login or use a different email.' });
        }
        console.error('User creation error:', authError);
        return res.status(500).json({ message: 'Failed to create user profile', error: authError.message });
      }
      userId = authData.user.id;
      // Insert user profile into users table
      const { error: dbError } = await supabase.from('users').insert({
        id: userId,
        email,
        name
      });
      if (dbError) {
        if (dbError.code === '23505' || (dbError.message && dbError.message.includes('duplicate key value'))) {
          console.error('Email already registered:', email);
          return res.status(400).json({ message: 'Email already registered. Please login or use a different email.' });
        }
        console.error('User DB insert error:', dbError);
        return res.status(500).json({ message: 'Failed to create user profile', error: dbError.message });
      }
      console.log('User created:', { userId, email, name });
    } catch (err) {
      console.error('User creation error:', err);
      return res.status(500).json({ message: 'Failed to create user profile', error: err.message });
    }

    // Insert fitness profile with all fields
    try {
      const { error: profileError } = await supabase.from('fitness_profiles').insert({
        user_id: userId,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        fitness_level: fitnessLevel || null,
        goals: goals ? (Array.isArray(goals) ? goals : [goals]) : null,
        activity_level: activityLevel || null,
        preferred_workouts: preferredWorkouts ? (Array.isArray(preferredWorkouts) ? preferredWorkouts : [preferredWorkouts]) : null,
        workout_frequency: workoutFrequency || null,
        workout_duration: workoutDuration || null,
        medical_conditions: medicalConditions ? (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions]) : null,
        injuries: injuries || null,
        dietary_preferences: dietaryPreferences ? (Array.isArray(dietaryPreferences) ? dietaryPreferences : [dietaryPreferences]) : null,
        sleep_hours: sleepHours || null,
        stress_level: stressLevel || null,
        smoking_status: smokingStatus || null,
        preferred_workout_time: preferredWorkoutTime || null,
        gym_access: gymAccess || null,
        equipment: equipment ? (Array.isArray(equipment) ? equipment : [equipment]) : null,
        motivation_level: motivationLevel || null,
        wallet_address: walletAddress || null
      });
      if (profileError) {
        console.error('Fitness profile creation error:', profileError);
        return res.status(400).json({ message: 'Failed to create fitness profile', error: profileError.message });
      }
      console.log('Fitness profile created for user:', userId);
    } catch (err) {
      console.error('Fitness profile creation error:', err);
      return res.status(400).json({ message: 'Failed to create fitness profile', error: err.message });
    }

    // Insert initial progression and stats
    try {
      const { error: progError } = await supabase.from('user_progression').insert({
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
        joined_date: new Date().toISOString(),
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      const { error: statsError } = await supabase.from('user_stats').insert({
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
        speed: 0,
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
      if (progError || statsError) {
        console.error('Error creating initial progression/stats:', progError || statsError);
      } else {
        console.log('Progression and stats created for user:', userId);
      }
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
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.error('Login validation failed - missing fields:', { email, password });
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Login with Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (loginError || !loginData.user) {
      console.error('Login failed:', loginError ? loginError.message : 'No user');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = loginData.user;
    // Fetch fitness profile
    const { data: fitness, error: fitnessError } = await supabase.from('fitness_profiles').select('*').eq('user_id', user.id).single();
    if (fitnessError) {
      console.error('Fitness profile fetch error:', fitnessError.message);
    }

    // (Optional) Auto-generate tasks if user has none (Supabase version not implemented)

    // Generate JWT token
    const token = generateToken(user.id);

    // Null safety for fitness profile
    const safeFitness = fitness || {};

    console.log('Login successful for:', email);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        // Step 2
        age: safeFitness.age,
        gender: safeFitness.gender,
        height: safeFitness.height,
        weight: safeFitness.weight,
        targetWeight: safeFitness.target_weight,
        // Step 3
        fitnessLevel: safeFitness.fitness_level,
        goals: safeFitness.goals,
        activityLevel: safeFitness.activity_level,
        preferredWorkouts: safeFitness.preferred_workouts,
        workoutFrequency: safeFitness.workout_frequency,
        workoutDuration: safeFitness.workout_duration,
        // Step 4
        medicalConditions: safeFitness.medical_conditions,
        injuries: safeFitness.injuries,
        dietaryPreferences: safeFitness.dietary_preferences,
        sleepHours: safeFitness.sleep_hours,
        stressLevel: safeFitness.stress_level,
        smokingStatus: safeFitness.smoking_status,
        // Step 5
        preferredWorkoutTime: safeFitness.preferred_workout_time,
        gymAccess: safeFitness.gym_access,
        equipment: safeFitness.equipment,
        motivationLevel: safeFitness.motivation_level,
        walletAddress: safeFitness.wallet_address,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

