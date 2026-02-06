import { createClient } from '@supabase/supabase-js';
import { generateToken } from '../middleware/auth.js';
import { generateSimpleTasks } from '../simpleTaskGenerator.js';

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Use SERVICE_ROLE_KEY for server-side operations (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Register a new user
 */
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

    console.log('[Auth] Register request received for email:', email);

    // Validate required fields
    if (!email || !password || !name) {
      console.error('[Auth] Validation failed - missing required fields');
      return res.status(400).json({ 
        message: 'Email, password, and name are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[Auth] Invalid email format:', email);
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 8) {
      console.error('[Auth] Password too short');
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters' 
      });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('[Auth] Error checking existing user:', checkError);
      return res.status(500).json({ 
        message: 'Failed to verify user', 
        error: checkError.message 
      });
    }

    if (existingUser) {
      console.error('[Auth] Email already registered:', email);
      return res.status(400).json({ 
        message: 'Email already registered. Please login or use a different email.' 
      });
    }

    let userId;
    let authUser = null;

    try {
      // Register user with Supabase Auth
      console.log('[Auth] Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for simplicity
        user_metadata: {
          name: name
        }
      });

      if (authError) {
        console.error('[Auth] Auth user creation error:', authError);
        
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('duplicate') ||
            authError.message?.includes('already exists')) {
          return res.status(400).json({ 
            message: 'Email already registered. Please login or use a different email.' 
          });
        }
        
        return res.status(500).json({ 
          message: 'Failed to create user account', 
          error: authError.message 
        });
      }

      if (!authData.user) {
        console.error('[Auth] No user returned from auth creation');
        return res.status(500).json({ 
          message: 'Failed to create user account' 
        });
      }

      authUser = authData.user;
      userId = authUser.id;
      console.log('[Auth] Auth user created:', userId);

      // Insert user profile into users table
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('[Auth] User DB insert error:', dbError);
        
        // If DB insert fails, try to clean up auth user
        try {
          await supabase.auth.admin.deleteUser(userId);
          console.log('[Auth] Cleaned up auth user after DB error');
        } catch (cleanupErr) {
          console.error('[Auth] Failed to cleanup auth user:', cleanupErr);
        }

        if (dbError.code === '23505' || dbError.message?.includes('duplicate')) {
          return res.status(400).json({ 
            message: 'Email already registered. Please login or use a different email.' 
          });
        }

        return res.status(500).json({ 
          message: 'Failed to create user profile', 
          error: dbError.message 
        });
      }

      console.log('[Auth] ✅ User profile created:', { userId, email, name });

    } catch (userErr) {
      console.error('[Auth] User creation error:', userErr);
      console.error('[Auth] Stack trace:', userErr.stack);
      return res.status(500).json({ 
        message: 'Failed to create user account', 
        error: userErr.message 
      });
    }

    // Insert fitness profile with all fields
    try {
      console.log('[Auth] Creating fitness profile...');
      
      const { error: profileError } = await supabase
        .from('fitness_profiles')
        .insert({
          user_id: userId,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          target_weight: targetWeight ? parseFloat(targetWeight) : null,
          fitness_level: fitnessLevel || 'beginner',
          goals: goals ? (Array.isArray(goals) ? goals : [goals]) : [],
          activity_level: activityLevel || null,
          preferred_workouts: preferredWorkouts ? (Array.isArray(preferredWorkouts) ? preferredWorkouts : [preferredWorkouts]) : [],
          workout_frequency: workoutFrequency || null,
          workout_duration: workoutDuration || null,
          medical_conditions: medicalConditions ? (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions]) : [],
          injuries: injuries || null,
          dietary_preferences: dietaryPreferences ? (Array.isArray(dietaryPreferences) ? dietaryPreferences : [dietaryPreferences]) : [],
          sleep_hours: sleepHours ? parseInt(sleepHours) : null,
          stress_level: stressLevel || null,
          smoking_status: smokingStatus || null,
          preferred_workout_time: preferredWorkoutTime || null,
          gym_access: gymAccess !== undefined ? gymAccess : null,
          equipment: equipment ? (Array.isArray(equipment) ? equipment : [equipment]) : [],
          motivation_level: motivationLevel || null,
          wallet_address: walletAddress || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('[Auth] Fitness profile creation error:', profileError);
        // Don't fail registration if fitness profile fails
        console.warn('[Auth] Continuing registration without fitness profile');
      } else {
        console.log('[Auth] ✅ Fitness profile created for user:', userId);
      }
    } catch (profileErr) {
      console.error('[Auth] Fitness profile creation error:', profileErr);
      console.error('[Auth] Stack trace:', profileErr.stack);
      // Don't fail registration if fitness profile fails
    }

    // Insert initial progression and stats
    try {
      console.log('[Auth] Creating progression and stats...');
      
      const { error: progError } = await supabase
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

      const { error: statsError } = await supabase
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

      if (progError) {
        console.error('[Auth] ⚠️ Error creating progression:', progError);
      } else {
        console.log('[Auth] ✅ Progression created');
      }

      if (statsError) {
        console.error('[Auth] ⚠️ Error creating stats:', statsError);
      } else {
        console.log('[Auth] ✅ Stats created');
      }
    } catch (initErr) {
      console.error('[Auth] Error creating initial progression/stats:', initErr);
      console.error('[Auth] Stack trace:', initErr.stack);
      // Don't block registration if these fail
    }

    // Generate JWT token
    const token = generateToken(userId);
    console.log('[Auth] ✅ Registration successful for:', email);

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
        fitnessLevel: fitnessLevel || 'beginner',
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
      }
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    console.error('[Auth] Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
};

/**
 * Login existing user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[Auth] Login request received for email:', email);

    // Validate input
    if (!email || !password) {
      console.error('[Auth] Login validation failed - missing fields');
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Authenticate with Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      console.error('[Auth] Login failed:', loginError.message);
      
      if (loginError.message?.includes('Invalid login credentials')) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      return res.status(401).json({ 
        message: 'Authentication failed', 
        error: loginError.message 
      });
    }

    if (!loginData.user) {
      console.error('[Auth] No user returned from login');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const authUser = loginData.user;
    console.log('[Auth] User authenticated:', authUser.id);

    // Fetch user profile from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('id', authUser.id)
      .single();

    if (userError) {
      console.error('[Auth] Error fetching user profile:', userError);
      return res.status(500).json({ 
        message: 'Failed to fetch user profile', 
        error: userError.message 
      });
    }

    if (!user) {
      console.error('[Auth] User profile not found for auth user:', authUser.id);
      return res.status(404).json({ message: 'User profile not found' });
    }

    // Fetch fitness profile
    const { data: fitness, error: fitnessError } = await supabase
      .from('fitness_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fitnessError) {
      console.error('[Auth] Fitness profile fetch error:', fitnessError.message);
      // Continue without fitness profile
    }

    // Null safety for fitness profile
    const safeFitness = fitness || {};

    // Generate JWT token
    const token = generateToken(user.id);

    console.log('[Auth] ✅ Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        // Step 2
        age: safeFitness.age || null,
        gender: safeFitness.gender || null,
        height: safeFitness.height || null,
        weight: safeFitness.weight || null,
        targetWeight: safeFitness.target_weight || null,
        // Step 3
        fitnessLevel: safeFitness.fitness_level || 'beginner',
        goals: safeFitness.goals || [],
        activityLevel: safeFitness.activity_level || null,
        preferredWorkouts: safeFitness.preferred_workouts || [],
        workoutFrequency: safeFitness.workout_frequency || null,
        workoutDuration: safeFitness.workout_duration || null,
        // Step 4
        medicalConditions: safeFitness.medical_conditions || [],
        injuries: safeFitness.injuries || null,
        dietaryPreferences: safeFitness.dietary_preferences || [],
        sleepHours: safeFitness.sleep_hours || null,
        stressLevel: safeFitness.stress_level || null,
        smokingStatus: safeFitness.smoking_status || null,
        // Step 5
        preferredWorkoutTime: safeFitness.preferred_workout_time || null,
        gymAccess: safeFitness.gym_access || null,
        equipment: safeFitness.equipment || [],
        motivationLevel: safeFitness.motivation_level || null,
        walletAddress: safeFitness.wallet_address || null,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    console.error('[Auth] Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Login failed', 
      error: error.message 
    });
  }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    console.log('[Auth] Logout request received');
    
    // If you want to invalidate the Supabase session
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.error('[Auth] Error signing out:', signOutErr);
        // Continue anyway
      }
    }

    console.log('[Auth] ✅ Logout successful');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({ 
      message: 'Logout failed', 
      error: error.message 
    });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('[Auth] Fetching current user:', userId);

    // Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[Auth] Error fetching user:', userError);
      return res.status(500).json({ 
        message: 'Failed to fetch user', 
        error: userError.message 
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch fitness profile
    const { data: fitness, error: fitnessError } = await supabase
      .from('fitness_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fitnessError) {
      console.error('[Auth] Error fetching fitness profile:', fitnessError);
    }

    const safeFitness = fitness || {};

    res.json({
      message: 'User profile retrieved',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        fitnessLevel: safeFitness.fitness_level || 'beginner',
        goals: safeFitness.goals || [],
        // Add other fields as needed
      }
    });
  } catch (error) {
    console.error('[Auth] Get current user error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user', 
      error: error.message 
    });
  }
};