import { createClient } from '@supabase/supabase-js';
import { generateToken } from '../middleware/auth.js';

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
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    // Ensure we're using service role privileges
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-node'
      }
    }
  }
);

/**
 * Helper: Create or ensure user profile exists
 * @param {string} userId - User ID from auth
 * @param {string} email - User email
 * @param {string} name - User name (optional)
 * @returns {Promise<object>} User profile
 */
const ensureUserProfile = async (userId, email, name = null) => {
  try {
    // Try to get existing user by ID
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('[Auth] Error fetching user profile:', fetchError);
      throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
    }

    // If user exists with this ID, return it
    if (existingUser) {
      console.log('[Auth] ✅ User profile found:', userId);
      return existingUser;
    }

    // Check if a user exists with this email but different ID
    const { data: emailUser, error: emailFetchError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('email', email)
      .maybeSingle();

    if (emailFetchError) {
      console.error('[Auth] Error checking email:', emailFetchError);
      throw new Error(`Failed to check email: ${emailFetchError.message}`);
    }

    if (emailUser) {
      // User exists with this email but different ID
      // This shouldn't happen in normal flow, but handle it gracefully
      console.warn('[Auth] ⚠️ User exists with email but different ID');
      console.warn('[Auth] Expected ID:', userId, 'Found ID:', emailUser.id);
      
      // Return the existing user by email
      // The auth system and DB are out of sync - this is a data issue
      return emailUser;
    }

    // User doesn't exist, create it
    console.log('[Auth] Creating user profile for:', userId);
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email,
        name: name || email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, name, created_at')
      .single();

    if (createError) {
      console.error('[Auth] Error creating user profile:', createError);
      
      // Handle race condition - user might have been created by another request
      if (createError.code === '23505') {
        // Duplicate key - try to fetch by ID first
        const { data: retryUser } = await supabase
          .from('users')
          .select('id, email, name, created_at')
          .eq('id', userId)
          .maybeSingle();
        
        if (retryUser) {
          console.log('[Auth] ✅ User profile found on retry (by ID):', userId);
          return retryUser;
        }

        // If not found by ID, try by email
        const { data: retryEmailUser } = await supabase
          .from('users')
          .select('id, email, name, created_at')
          .eq('email', email)
          .maybeSingle();
        
        if (retryEmailUser) {
          console.log('[Auth] ✅ User profile found on retry (by email):', email);
          return retryEmailUser;
        }
      }
      
      throw new Error(`Failed to create user profile: ${createError.message}`);
    }

    console.log('[Auth] ✅ User profile created:', userId);
    return newUser;
  } catch (error) {
    console.error('[Auth] Error in ensureUserProfile:', error);
    throw error;
  }
};

/**
 * Helper: Initialize user game data (progression and stats)
 * @param {string} userId - User ID
 */
const initializeUserGameData = async (userId) => {
  try {
    console.log('[Auth] Initializing game data for user:', userId);

    // Check if progression already exists
    const { data: existingProg } = await supabase
      .from('user_progression')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingProg) {
      // Insert with only essential fields to avoid column mismatch errors
      const { error: progError } = await supabase
        .from('user_progression')
        .insert({
          user_id: userId,
          level: 1,
          total_xp: 0,
          experience_points: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (progError && progError.code !== '23505') {
        console.error('[Auth] ⚠️ Error creating progression:', progError);
      } else if (!progError) {
        console.log('[Auth] ✅ Progression created');
      }
    }

    // Check if stats already exist
    const { data: existingStats } = await supabase
      .from('user_stats')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingStats) {
      // Insert with only essential fields
      const { error: statsError } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (statsError && statsError.code !== '23505') {
        console.error('[Auth] ⚠️ Error creating stats:', statsError);
      } else if (!statsError) {
        console.log('[Auth] ✅ Stats created');
      }
    }
  } catch (error) {
    // Don't throw - game data initialization is not critical
    console.error('[Auth] ⚠️ Error initializing game data (non-critical):', error);
  }
};

/**
 * Helper: Get or create fitness profile
 * @param {string} userId - User ID
 * @param {object} fitnessData - Fitness profile data (optional)
 * @returns {Promise<object>} Fitness profile
 */
const getFitnessProfile = async (userId, fitnessData = null) => {
  try {
    // Try to get existing fitness profile
    const { data: fitness, error: fetchError } = await supabase
      .from('fitness_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('[Auth] Error fetching fitness profile:', fetchError);
      return null; // Non-critical, return null
    }

    if (fitness) {
      return fitness;
    }

    // Create fitness profile if data provided
    if (fitnessData) {
      console.log('[Auth] Creating fitness profile for user:', userId);
      
      const { data: newFitness, error: createError } = await supabase
        .from('fitness_profiles')
        .insert({
          user_id: userId,
          age: fitnessData.age ? parseInt(fitnessData.age) : null,
          gender: fitnessData.gender || null,
          height: fitnessData.height ? parseFloat(fitnessData.height) : null,
          weight: fitnessData.weight ? parseFloat(fitnessData.weight) : null,
          target_weight: fitnessData.targetWeight ? parseFloat(fitnessData.targetWeight) : null,
          fitness_level: fitnessData.fitnessLevel || 'beginner',
          goals: fitnessData.goals ? (Array.isArray(fitnessData.goals) ? fitnessData.goals : [fitnessData.goals]) : [],
          activity_level: fitnessData.activityLevel || null,
          preferred_workouts: fitnessData.preferredWorkouts ? (Array.isArray(fitnessData.preferredWorkouts) ? fitnessData.preferredWorkouts : [fitnessData.preferredWorkouts]) : [],
          workout_frequency: fitnessData.workoutFrequency || null,
          workout_duration: fitnessData.workoutDuration || null,
          medical_conditions: fitnessData.medicalConditions ? (Array.isArray(fitnessData.medicalConditions) ? fitnessData.medicalConditions : [fitnessData.medicalConditions]) : [],
          injuries: fitnessData.injuries || null,
          dietary_preferences: fitnessData.dietaryPreferences ? (Array.isArray(fitnessData.dietaryPreferences) ? fitnessData.dietaryPreferences : [fitnessData.dietaryPreferences]) : [],
          sleep_hours: fitnessData.sleepHours ? parseInt(fitnessData.sleepHours) : null,
          stress_level: fitnessData.stressLevel || null,
          smoking_status: fitnessData.smokingStatus || null,
          preferred_workout_time: fitnessData.preferredWorkoutTime || null,
          gym_access: fitnessData.gymAccess !== undefined ? fitnessData.gymAccess : null,
          equipment: fitnessData.equipment ? (Array.isArray(fitnessData.equipment) ? fitnessData.equipment : [fitnessData.equipment]) : [],
          motivation_level: fitnessData.motivationLevel || null,
          wallet_address: fitnessData.walletAddress || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (createError && createError.code !== '23505') {
        console.error('[Auth] ⚠️ Error creating fitness profile:', createError);
        return null;
      }

      console.log('[Auth] ✅ Fitness profile created');
      return newFitness;
    }

    return null;
  } catch (error) {
    console.error('[Auth] Error in getFitnessProfile:', error);
    return null; // Non-critical
  }
};

/**
 * Helper: Format user response with fitness data
 * @param {object} user - User profile
 * @param {object} fitness - Fitness profile (optional)
 * @returns {object} Formatted user object
 */
const formatUserResponse = (user, fitness = null) => {
  const safeFitness = fitness || {};
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    // Step 2: Personal Metrics
    age: safeFitness.age || null,
    gender: safeFitness.gender || null,
    height: safeFitness.height || null,
    weight: safeFitness.weight || null,
    targetWeight: safeFitness.target_weight || null,
    // Step 3: Fitness Profile
    fitnessLevel: safeFitness.fitness_level || 'beginner',
    goals: safeFitness.goals || [],
    activityLevel: safeFitness.activity_level || null,
    preferredWorkouts: safeFitness.preferred_workouts || [],
    workoutFrequency: safeFitness.workout_frequency || null,
    workoutDuration: safeFitness.workout_duration || null,
    // Step 4: Health & Lifestyle
    medicalConditions: safeFitness.medical_conditions || [],
    injuries: safeFitness.injuries || null,
    dietaryPreferences: safeFitness.dietary_preferences || [],
    sleepHours: safeFitness.sleep_hours || null,
    stressLevel: safeFitness.stress_level || null,
    smokingStatus: safeFitness.smoking_status || null,
    // Step 5: Preferences & Wallet
    preferredWorkoutTime: safeFitness.preferred_workout_time || null,
    gymAccess: safeFitness.gym_access || null,
    equipment: safeFitness.equipment || [],
    motivationLevel: safeFitness.motivation_level || null,
    walletAddress: safeFitness.wallet_address || null,
  };
};

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, ...fitnessData } = req.body;
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

    // Validate password strength
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

    // Register user with Supabase Auth
    console.log('[Auth] Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name
      }
    });

    if (authError) {
      console.error('[Auth] Auth user creation error:', authError);
      
      // Handle specific auth errors
      if (authError.message?.includes('already registered') || 
          authError.message?.includes('duplicate') ||
          authError.message?.includes('already exists')) {
        return res.status(400).json({ 
          message: 'Email already registered. Please login or use a different email.' 
        });
      }
      
      if (authError.message?.includes('password')) {
        return res.status(400).json({ 
          message: authError.message 
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to create user account', 
        error: authError.message 
      });
    }

    if (!authData?.user) {
      console.error('[Auth] No user returned from auth creation');
      return res.status(500).json({ 
        message: 'Failed to create user account' 
      });
    }

    const userId = authData.user.id;
    console.log('[Auth] Auth user created:', userId);

    let user;
    try {
      // Create user profile
      user = await ensureUserProfile(userId, email, name);
    } catch (profileError) {
      console.error('[Auth] Failed to create user profile:', profileError);
      
      // Clean up auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(userId);
        console.log('[Auth] Cleaned up auth user after profile creation failure');
      } catch (cleanupErr) {
        console.error('[Auth] Failed to cleanup auth user:', cleanupErr);
      }
      
      return res.status(500).json({ 
        message: 'Failed to create user profile', 
        error: profileError.message 
      });
    }

    // Create fitness profile (non-blocking)
    const fitness = await getFitnessProfile(userId, fitnessData);

    // Initialize game data (non-blocking)
    await initializeUserGameData(userId);

    // Generate JWT token
    const token = generateToken(userId);
    console.log('[Auth] ✅ Registration successful for:', email);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: formatUserResponse(user, fitness)
    });
  } catch (error) {
    console.error('[Auth] Unexpected registration error:', error);
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
      
      if (loginError.message?.includes('Email not confirmed')) {
        return res.status(401).json({ message: 'Please confirm your email address' });
      }
      
      return res.status(401).json({ 
        message: 'Authentication failed', 
        error: loginError.message 
      });
    }

    if (!loginData?.user) {
      console.error('[Auth] No user returned from login');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const authUser = loginData.user;
    console.log('[Auth] User authenticated:', authUser.id);

    // Check if user profile exists (DO NOT auto-create)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('id', authUser.id)
      .maybeSingle();

    if (userError) {
      console.error('[Auth] Error fetching user profile:', userError);
      return res.status(500).json({ 
        message: 'Failed to fetch user profile', 
        error: userError.message 
      });
    }

    // If user profile doesn't exist, redirect to registration
    if (!user) {
      console.warn('[Auth] ⚠️ User authenticated but profile not found:', authUser.id);
      console.warn('[Auth] Redirecting to registration...');
      
      return res.status(403).json({ 
        message: 'Profile not found. Please complete registration.',
        error: 'ProfileNotFound',
        requiresRegistration: true,
        email: authUser.email
      });
    }

    console.log('[Auth] ✅ User profile found:', user.id);

    // Get fitness profile (non-blocking, returns null if not found)
    const fitness = await getFitnessProfile(user.id);

    // Generate JWT token
    const token = generateToken(user.id);
    console.log('[Auth] ✅ Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: formatUserResponse(user, fitness)
    });
  } catch (error) {
    console.error('[Auth] Unexpected login error:', error);
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
    
    // Note: With JWT, logout is handled client-side by removing the token
    // But we can still invalidate the Supabase session if needed
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        await supabase.auth.signOut();
        console.log('[Auth] Supabase session invalidated');
      } catch (signOutErr) {
        console.error('[Auth] Error signing out from Supabase:', signOutErr);
        // Continue anyway - client-side token removal is sufficient
      }
    }

    console.log('[Auth] ✅ Logout successful');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Don't fail logout - it's primarily client-side
    res.json({ message: 'Logout successful' });
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
      .maybeSingle();

    if (userError) {
      console.error('[Auth] Error fetching user:', userError);
      return res.status(500).json({ 
        message: 'Failed to fetch user', 
        error: userError.message 
      });
    }

    if (!user) {
      console.error('[Auth] User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch fitness profile (non-blocking)
    const fitness = await getFitnessProfile(userId);

    res.json({
      message: 'User profile retrieved',
      user: formatUserResponse(user, fitness)
    });
  } catch (error) {
    console.error('[Auth] Get current user error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch user', 
      error: error.message 
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { name, ...fitnessData } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('[Auth] Update profile request for user:', userId);

    // Update basic user profile
    if (name) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          name, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[Auth] Error updating user:', updateError);
        return res.status(500).json({ 
          message: 'Failed to update profile', 
          error: updateError.message 
        });
      }
    }

    // Update fitness profile if data provided
    if (Object.keys(fitnessData).length > 0) {
      // Check if fitness profile exists
      const { data: existingFitness } = await supabase
        .from('fitness_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      const fitnessUpdate = {
        ...(fitnessData.age && { age: parseInt(fitnessData.age) }),
        ...(fitnessData.gender && { gender: fitnessData.gender }),
        ...(fitnessData.height && { height: parseFloat(fitnessData.height) }),
        ...(fitnessData.weight && { weight: parseFloat(fitnessData.weight) }),
        ...(fitnessData.targetWeight && { target_weight: parseFloat(fitnessData.targetWeight) }),
        ...(fitnessData.fitnessLevel && { fitness_level: fitnessData.fitnessLevel }),
        ...(fitnessData.goals && { goals: Array.isArray(fitnessData.goals) ? fitnessData.goals : [fitnessData.goals] }),
        ...(fitnessData.activityLevel && { activity_level: fitnessData.activityLevel }),
        ...(fitnessData.preferredWorkouts && { preferred_workouts: Array.isArray(fitnessData.preferredWorkouts) ? fitnessData.preferredWorkouts : [fitnessData.preferredWorkouts] }),
        ...(fitnessData.workoutFrequency && { workout_frequency: fitnessData.workoutFrequency }),
        ...(fitnessData.workoutDuration && { workout_duration: fitnessData.workoutDuration }),
        ...(fitnessData.medicalConditions && { medical_conditions: Array.isArray(fitnessData.medicalConditions) ? fitnessData.medicalConditions : [fitnessData.medicalConditions] }),
        ...(fitnessData.injuries && { injuries: fitnessData.injuries }),
        ...(fitnessData.dietaryPreferences && { dietary_preferences: Array.isArray(fitnessData.dietaryPreferences) ? fitnessData.dietaryPreferences : [fitnessData.dietaryPreferences] }),
        ...(fitnessData.sleepHours && { sleep_hours: parseInt(fitnessData.sleepHours) }),
        ...(fitnessData.stressLevel && { stress_level: fitnessData.stressLevel }),
        ...(fitnessData.smokingStatus && { smoking_status: fitnessData.smokingStatus }),
        ...(fitnessData.preferredWorkoutTime && { preferred_workout_time: fitnessData.preferredWorkoutTime }),
        ...(fitnessData.gymAccess !== undefined && { gym_access: fitnessData.gymAccess }),
        ...(fitnessData.equipment && { equipment: Array.isArray(fitnessData.equipment) ? fitnessData.equipment : [fitnessData.equipment] }),
        ...(fitnessData.motivationLevel && { motivation_level: fitnessData.motivationLevel }),
        ...(fitnessData.walletAddress && { wallet_address: fitnessData.walletAddress }),
        updated_at: new Date().toISOString()
      };

      if (existingFitness) {
        // Update existing fitness profile
        const { error: fitnessError } = await supabase
          .from('fitness_profiles')
          .update(fitnessUpdate)
          .eq('user_id', userId);

        if (fitnessError) {
          console.error('[Auth] Error updating fitness profile:', fitnessError);
          // Don't fail the whole request
        }
      } else {
        // Create new fitness profile
        const { error: fitnessError } = await supabase
          .from('fitness_profiles')
          .insert({
            user_id: userId,
            ...fitnessUpdate,
            created_at: new Date().toISOString()
          });

        if (fitnessError && fitnessError.code !== '23505') {
          console.error('[Auth] Error creating fitness profile:', fitnessError);
          // Don't fail the whole request
        }
      }
    }

    // Fetch updated user data
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('id', userId)
      .maybeSingle();

    const fitness = await getFitnessProfile(userId);

    console.log('[Auth] ✅ Profile updated for user:', userId);

    res.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(user, fitness)
    });
  } catch (error) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile', 
      error: error.message 
    });
  }
};

/**
 * Delete user account
 */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('[Auth] Delete account request for user:', userId);

    // Delete user from auth system
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('[Auth] Error deleting auth user:', authDeleteError);
      return res.status(500).json({ 
        message: 'Failed to delete account', 
        error: authDeleteError.message 
      });
    }

    // Delete user profile (cascade should handle related data)
    const { error: dbDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbDeleteError) {
      console.error('[Auth] Error deleting user profile:', dbDeleteError);
      // Auth user already deleted, so just log the error
    }

    console.log('[Auth] ✅ Account deleted for user:', userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('[Auth] Delete account error:', error);
    res.status(500).json({ 
      message: 'Failed to delete account', 
      error: error.message 
    });
  }
};