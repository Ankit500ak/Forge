import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

/**
 * Authentication middleware
 * Validates JWT token and verifies user exists in database
 */
export const authenticate = async (req, res, next) => {
  try {
    console.log('[Auth Middleware] Starting authentication...');
    
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('[Auth Middleware] ❌ No authorization header provided');
      return res.status(401).json({ 
        message: 'No token provided',
        error: 'MissingToken' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('[Auth Middleware] ❌ Token missing from authorization header');
      return res.status(401).json({ 
        message: 'No token provided',
        error: 'MissingToken' 
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[Auth Middleware] ✅ Token verified successfully');
    } catch (verifyErr) {
      console.error('[Auth Middleware] ❌ Token verification failed:', verifyErr.message);
      
      // Provide specific error messages for different JWT errors
      if (verifyErr.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired', 
          error: 'TokenExpiredError',
          expiredAt: verifyErr.expiredAt 
        });
      } else if (verifyErr.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token', 
          error: 'JsonWebTokenError' 
        });
      } else if (verifyErr.name === 'NotBeforeError') {
        return res.status(401).json({ 
          message: 'Token not active', 
          error: 'NotBeforeError',
          notBefore: verifyErr.date
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid token', 
        error: verifyErr.message 
      });
    }
    
    const userId = decoded.userId;

    if (!userId) {
      console.error('[Auth Middleware] ❌ No userId in token payload');
      return res.status(401).json({ 
        message: 'Invalid token payload',
        error: 'MissingUserId' 
      });
    }

    console.log(`[Auth Middleware] Verifying user exists in database: ${userId}`);

    // Verify user exists in the database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('[Auth Middleware] ❌ Database error checking user:', userError.message);
      return res.status(500).json({ 
        message: 'Database error', 
        error: userError.message 
      });
    }

    if (!user) {
      console.error('[Auth Middleware] ❌ User not found in database:', userId);
      return res.status(401).json({ 
        message: 'User not found. Please complete registration.',
        error: 'UserNotFound',
        requiresRegistration: true
      });
    }

    // Check if user account is active
    if (user.is_active === false) {
      console.error('[Auth Middleware] ❌ User account is inactive:', userId);
      return res.status(403).json({ 
        message: 'Account is inactive. Please contact support.',
        error: 'AccountInactive' 
      });
    }

    console.log(`[Auth Middleware] ✅ User authenticated successfully: ${userId}`);

    // Attach user info to request object for downstream use
    req.userId = userId;
    req.user = { 
      id: userId,
      email: user.email,
      role: user.role 
    };
    
    next();
  } catch (error) {
    console.error('[Auth Middleware] ❌ Unexpected authentication error:', error.message);
    console.error('[Auth Middleware] Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Authentication error', 
      error: error.message 
    });
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't block if token is missing/invalid
 * Useful for routes that work for both authenticated and anonymous users
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    console.log('[Optional Auth] Starting optional authentication...');
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('[Optional Auth] No token provided, continuing as anonymous');
      req.userId = null;
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('[Optional Auth] Token missing, continuing as anonymous');
      req.userId = null;
      req.user = null;
      return next();
    }

    // Try to verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      if (userId) {
        // Verify user exists
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, role, is_active')
          .eq('id', userId)
          .maybeSingle();

        if (!error && user && user.is_active !== false) {
          req.userId = userId;
          req.user = { 
            id: userId,
            email: user.email,
            role: user.role 
          };
          console.log(`[Optional Auth] ✅ User authenticated: ${userId}`);
        } else {
          console.log('[Optional Auth] User not found or inactive, continuing as anonymous');
          req.userId = null;
          req.user = null;
        }
      }
    } catch (err) {
      console.log('[Optional Auth] Token validation failed, continuing as anonymous:', err.message);
      req.userId = null;
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('[Optional Auth] ❌ Error in optional authentication:', error.message);
    // Don't block the request
    req.userId = null;
    req.user = null;
    next();
  }
};

/**
 * Admin authentication middleware
 * Requires user to be authenticated AND have admin role
 */
export const authenticateAdmin = async (req, res, next) => {
  try {
    console.log('[Admin Auth] Starting admin authentication...');
    
    // First, run standard authentication
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user is admin
    const userId = req.userId;

    if (!userId) {
      console.log('[Admin Auth] ❌ No authenticated user');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'Unauthenticated' 
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Admin Auth] ❌ Error checking admin status:', error.message);
      return res.status(500).json({ 
        message: 'Failed to verify admin status', 
        error: error.message 
      });
    }

    if (!user || user.role !== 'admin') {
      console.log(`[Admin Auth] ⛔ Admin access denied for user: ${userId} (role: ${user?.role || 'unknown'})`);
      return res.status(403).json({ 
        message: 'Admin access required',
        error: 'Forbidden' 
      });
    }

    console.log(`[Admin Auth] ✅ Admin authenticated: ${userId} (${user.email})`);
    next();
  } catch (error) {
    console.error('[Admin Auth] ❌ Error in admin authentication:', error.message);
    res.status(500).json({ 
      message: 'Authentication error', 
      error: error.message 
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user profile is complete
 * Returns object with completion status and missing fields
 */
async function checkProfileCompletion(userId) {
  const missingFields = [];
  let isComplete = true;

  try {
    // Check if user_stats exists
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('[Profile Check] Error checking user_stats:', statsError);
    }
    
    if (!stats) {
      missingFields.push('user_stats');
      isComplete = false;
    }

    // Check if user_progression exists
    const { data: progression, error: progressionError } = await supabase
      .from('user_progression')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (progressionError && progressionError.code !== 'PGRST116') {
      console.error('[Profile Check] Error checking user_progression:', progressionError);
    }
    
    if (!progression) {
      missingFields.push('user_progression');
      isComplete = false;
    }

    // Check if fitness_profiles exists
    const { data: fitness, error: fitnessError } = await supabase
      .from('fitness_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fitnessError && fitnessError.code !== 'PGRST116' && fitnessError.code !== '42501') {
      console.error('[Profile Check] Error checking fitness_profiles:', fitnessError);
    }
    
    if (!fitness) {
      missingFields.push('fitness_profiles');
      isComplete = false;
    }

    return {
      isComplete,
      missingFields
    };
  } catch (error) {
    console.error('[Profile Check] Unexpected error:', error);
    return {
      isComplete: false,
      missingFields: ['unknown'],
      error: error.message
    };
  }
}

/**
 * Initialize all required user records
 */
async function initializeUserRecords(userId, additionalData = {}) {
  const results = {
    stats: null,
    progression: null,
    fitness: null,
    errors: []
  };

  try {
    // Initialize user_stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        strength: 0,
        speed: 0,
        endurance: 0,
        agility: 0,
        power: 0,
        recovery: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (statsError) {
      console.error('[Initialize] Error creating user_stats:', statsError);
      results.errors.push({ table: 'user_stats', error: statsError.message });
    } else {
      results.stats = stats;
      console.log('[Initialize] ✅ user_stats created');
    }

    // Initialize user_progression
    const { data: progression, error: progressionError } = await supabase
      .from('user_progression')
      .upsert({
        user_id: userId,
        level: 1,
        total_xp: 0,
        current_xp: 0,
        xp_to_next_level: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (progressionError) {
      console.error('[Initialize] Error creating user_progression:', progressionError);
      results.errors.push({ table: 'user_progression', error: progressionError.message });
    } else {
      results.progression = progression;
      console.log('[Initialize] ✅ user_progression created');
    }

    // Initialize fitness_profiles with all additional data
    const fitnessProfileData = {
      user_id: userId,
      fitness_level: additionalData.fitnessLevel || additionalData.fitness_level || 'beginner',
      // Personal metrics
      height: additionalData.height || null,
      weight: additionalData.weight || null,
      target_weight: additionalData.targetWeight || null,
      // Fitness profile
      goals: additionalData.goals || [],
      activity_level: additionalData.activityLevel || null,
      preferred_workouts: additionalData.preferredWorkouts || [],
      workout_frequency: additionalData.workoutFrequency || null,
      workout_duration: additionalData.workoutDuration || null,
      // Health & lifestyle
      medical_conditions: additionalData.medicalConditions || [],
      injuries: additionalData.injuries || null,
      dietary_preferences: additionalData.dietaryPreferences || [],
      sleep_hours: additionalData.sleepHours || null,
      stress_level: additionalData.stressLevel || null,
      smoking_status: additionalData.smokingStatus || null,
      // Preferences
      preferred_workout_time: additionalData.preferredWorkoutTime || null,
      gym_access: additionalData.gymAccess || null,
      equipment: additionalData.equipment || [],
      motivation_level: additionalData.motivationLevel || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: fitness, error: fitnessError } = await supabase
      .from('fitness_profiles')
      .upsert(fitnessProfileData, { onConflict: 'user_id' })
      .select()
      .single();

    if (fitnessError) {
      console.error('[Initialize] Error creating fitness_profiles:', fitnessError);
      results.errors.push({ table: 'fitness_profiles', error: fitnessError.message });
    } else {
      results.fitness = fitness;
      console.log('[Initialize] ✅ fitness_profiles created with additional data');
    }

    return results;
  } catch (error) {
    console.error('[Initialize] Unexpected error:', error);
    results.errors.push({ table: 'general', error: error.message });
    return results;
  }
}

// ============================================================================
// AUTHENTICATION CONTROLLER FUNCTIONS
// ============================================================================

/**
 * Register a new user
 * POST /api/auth/register
 * Body: { email, password, name, age, gender, fitness_level, ... }
 */
export const register = async (req, res) => {
  const { 
    email, 
    password, 
    name, 
    age, 
    gender, 
    fitness_level,
    // Additional personal metrics
    height,
    weight,
    targetWeight,
    // Fitness profile
    goals,
    activityLevel,
    preferredWorkouts,
    workoutFrequency,
    workoutDuration,
    // Health & lifestyle
    medicalConditions,
    injuries,
    dietaryPreferences,
    sleepHours,
    stressLevel,
    smokingStatus,
    // Preferences & wallet
    preferredWorkoutTime,
    gymAccess,
    equipment,
    motivationLevel,
    walletAddress
  } = req.body;
  
  console.log('[Register] Registration attempt for email:', email);
  console.log('[Register] Additional data received:', {
    age, 
    gender, 
    height, 
    weight, 
    fitnessLevel: fitness_level,
    goals: goals?.length || 0,
    preferredWorkouts: preferredWorkouts?.length || 0,
    walletAddress: walletAddress ? 'provided' : 'not provided'
  });
  
  // Validate input
  if (!email || !password) {
    console.log('[Register] ❌ Missing required fields');
    return res.status(400).json({ 
      message: 'Email and password are required.',
      error: 'MissingFields' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('[Register] ❌ Invalid email format:', email);
    return res.status(400).json({ 
      message: 'Invalid email format.',
      error: 'InvalidEmail' 
    });
  }

  // Validate password strength
  if (password.length < 6) {
    console.log('[Register] ❌ Password too short');
    return res.status(400).json({ 
      message: 'Password must be at least 6 characters long.',
      error: 'WeakPassword' 
    });
  }

  try {
    // Check if user already exists
    console.log('[Register] Checking if user already exists...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      console.log('[Register] ❌ User already exists:', email);
      return res.status(409).json({ 
        message: 'An account with this email already exists.',
        error: 'UserExists' 
      });
    }

    // Create user in Supabase Auth
    console.log('[Register] Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null
        }
      }
    });

    if (authError) {
      console.error('[Register] ❌ Supabase Auth signup error:', authError.message);
      
      // Handle specific Supabase errors
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ 
          message: 'An account with this email already exists.',
          error: 'UserExists' 
        });
      }
      
      return res.status(400).json({ 
        message: 'Registration failed', 
        error: authError.message 
      });
    }

    if (!authData.user) {
      console.error('[Register] ❌ No user returned from Supabase Auth');
      return res.status(400).json({ 
        message: 'Registration failed - no user created',
        error: 'RegistrationFailed' 
      });
    }

    console.log('[Register] ✅ User created in Supabase Auth:', authData.user.id);

    // Create user profile in your users table with all available data
    console.log('[Register] Creating user profile in database...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: authData.user.email.toLowerCase(),
          name: name || null,
          age: age || null,
          gender: gender || null,
          fitness_level: fitness_level || 'beginner',
          wallet_address: walletAddress || null,
          role: 'user',
          is_active: true,
          level: 1,
          total_xp: 0,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('[Register] ❌ Error creating user profile:', userError.message);
      
      // Attempt to clean up auth user if profile creation failed
      try {
        console.log('[Register] Attempting to clean up auth user...');
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('[Register] ✅ Cleanup successful');
      } catch (cleanupErr) {
        console.error('[Register] ❌ Cleanup failed:', cleanupErr.message);
      }
      
      return res.status(500).json({ 
        message: 'Registration failed while creating user profile', 
        error: userError.message 
      });
    }

    console.log(`[Register] ✅ User profile created successfully: ${authData.user.id}`);

    // Prepare additional data for fitness_profiles
    const additionalData = {
      fitnessLevel: fitness_level,
      height,
      weight,
      targetWeight,
      goals,
      activityLevel,
      preferredWorkouts,
      workoutFrequency,
      workoutDuration,
      medicalConditions,
      injuries,
      dietaryPreferences,
      sleepHours,
      stressLevel,
      smokingStatus,
      preferredWorkoutTime,
      gymAccess,
      equipment,
      motivationLevel
    };

    // Initialize all required records with additional data
    console.log('[Register] Initializing user records...');
    const initResults = await initializeUserRecords(authData.user.id, additionalData);

    if (initResults.errors.length > 0) {
      console.warn('[Register] ⚠️ Some records failed to initialize:', initResults.errors);
    } else {
      console.log('[Register] ✅ All user records initialized successfully');
    }

    // Generate custom JWT token
    const token = generateToken(authData.user.id);

    console.log(`[Register] 🎉 Registration complete for: ${email}`);

    // Return success with user info and session
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name || null,
        age: age || null,
        gender: gender || null,
        fitness_level: fitness_level || 'beginner',
        wallet_address: walletAddress || null,
        role: 'user',
        level: 1,
        total_xp: 0
      },
      token,
      access_token: authData.session?.access_token || null,
      profileComplete: initResults.errors.length === 0,
      requiresEmailVerification: !authData.session
    });

  } catch (err) {
    console.error('[Register] ❌ Unexpected registration error:', err.message);
    console.error('[Register] Stack trace:', err.stack);
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: err.message 
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  
  console.log('[Login] Login attempt for email:', email);
  
  // Validate input
  if (!email || !password) {
    console.log('[Login] ❌ Missing required fields');
    return res.status(400).json({ 
      message: 'Email and password are required.',
      error: 'MissingFields' 
    });
  }

  try {
    // Attempt Supabase authentication
    console.log('[Login] Authenticating with Supabase...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('[Login] ❌ Authentication failed:', error.message);
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({ 
          message: 'Invalid email or password', 
          error: 'InvalidCredentials' 
        });
      }
      
      if (error.message.includes('Email not confirmed')) {
        return res.status(401).json({ 
          message: 'Please verify your email before logging in', 
          error: 'EmailNotConfirmed' 
        });
      }
      
      return res.status(401).json({ 
        message: 'Login failed', 
        error: error.message 
      });
    }

    if (!data.user) {
      console.error('[Login] ❌ No user data returned');
      return res.status(401).json({ 
        message: 'Login failed',
        error: 'NoUserData' 
      });
    }

    console.log('[Login] ✅ Supabase authentication successful:', data.user.id);

    // Fetch user profile from database
    console.log('[Login] Fetching user profile by auth ID:', data.user.id);
    
    // Use service role client for direct access (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    let { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, age, gender, fitness_level, role, is_active, level, total_xp')
      .eq('id', data.user.id)
      .maybeSingle();

    console.log('[Login] Query result - userProfile:', userProfile ? 'FOUND' : 'NOT_FOUND', 'profileError:', profileError?.message);

    // Fallback: if user not found by ID, try by email
    if (!userProfile && data.user.email) {
      console.log('[Login] ⚠️ User not found by ID, trying by email:', data.user.email);
      const { data: emailProfile, error: emailError } = await supabaseAdmin
        .from('users')
        .select('id, email, name, age, gender, fitness_level, role, is_active, level, total_xp')
        .eq('email', data.user.email.toLowerCase())
        .maybeSingle();
      
      console.log('[Login] Email lookup result - emailProfile:', emailProfile ? 'FOUND' : 'NOT_FOUND', 'emailError:', emailError?.message);
      
      if (emailProfile) {
        console.log('[Login] ✅ User found by email, using profile from database...');
        userProfile = emailProfile;
        profileError = null;
      } else {
        profileError = emailError;
      }
    }

    if (profileError) {
      console.error('[Login] ❌ Error fetching user profile:', profileError.message);
      return res.status(500).json({ 
        message: 'Failed to fetch user profile', 
        error: profileError.message 
      });
    }

    if (!userProfile) {
      console.error('[Login] ❌ User profile not found for auth ID:', data.user.id, 'or email:', data.user.email);
      return res.status(401).json({ 
        message: 'User profile not found. Please complete registration.',
        error: 'ProfileNotFound',
        requiresRegistration: true
      });
    }

    console.log('[Login] ✅ User profile found:', userProfile.id, userProfile.email);

    // Check if account is active
    if (userProfile.is_active === false) {
      console.error('[Login] ❌ Account is inactive:', userProfile.id);
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact support.',
        error: 'AccountInactive' 
      });
    }

    console.log('[Login] ✅ User profile validated');

    // Initialize user records if they don't exist
    console.log('[Login] 🔄 Initializing user records for user:', userProfile.id);
    try {
      const initResults = await initializeUserRecords(userProfile.id, {
        fitnessLevel: userProfile.fitness_level || 'beginner'
      });
      
      console.log('[Login] Init results:', {
        stats: initResults.stats ? 'created' : 'skipped',
        progression: initResults.progression ? 'created' : 'skipped',
        fitness: initResults.fitness ? 'created' : 'skipped',
        errors: initResults.errors.length
      });
      
      if (initResults.errors.length > 0) {
        console.warn('[Login] ⚠️ Some records failed to initialize:');
        initResults.errors.forEach(err => {
          console.warn(`  - ${err.table}: ${err.error}`);
        });
      } else {
        console.log('[Login] ✅ All user records initialized successfully');
      }
    } catch (initErr) {
      console.error('[Login] ❌ Error during initialization:', initErr.message);
      console.error('[Login] Stack:', initErr.stack);
      // Don't block login even if initialization fails
    }

    // Generate custom JWT token using DATABASE user ID (not auth ID)
    // This is critical - the token must contain the user ID from the database, not from Supabase Auth
    const token = generateToken(userProfile.id);

    console.log(`[Login] 🎉 Login successful for: ${email}`);

    // Return token and user info
    res.json({
      message: 'Login successful',
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        age: userProfile.age,
        gender: userProfile.gender,
        fitness_level: userProfile.fitness_level,
        role: userProfile.role,
        level: userProfile.level || 1,
        total_xp: userProfile.total_xp || 0
      },
      token,
      access_token: data.session?.access_token || null,
      profileComplete: true
    });

  } catch (err) {
    console.error('[Login] ❌ Unexpected login error:', err.message);
    console.error('[Login] Stack trace:', err.stack);
    res.status(500).json({ 
      message: 'Server error during login', 
      error: err.message 
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 * Headers: Authorization: Bearer <token>
 */
export const logout = async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log('[Logout] Logout request for user:', userId || 'anonymous');
    
    if (userId) {
      console.log(`[Logout] ✅ User logged out: ${userId}`);
    }
    
    res.json({ 
      message: 'Logout successful',
      success: true 
    });
  } catch (err) {
    console.error('[Logout] ❌ Logout error:', err.message);
    res.status(500).json({ 
      message: 'Server error during logout', 
      error: err.message 
    });
  }
};

/**
 * Get current user profile with completion status
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    
    console.log('[Get Current User] Fetching profile for:', userId);

    if (!userId) {
      console.log('[Get Current User] ❌ No authenticated user');
      return res.status(401).json({ 
        message: 'Not authenticated',
        error: 'Unauthenticated' 
      });
    }

    // Fetch user profile
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, age, gender, fitness_level, role, is_active, level, total_xp, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Get Current User] ❌ Database error:', error.message);
      return res.status(500).json({ 
        message: 'Failed to fetch user profile', 
        error: error.message 
      });
    }

    if (!user) {
      console.error('[Get Current User] ❌ User not found:', userId);
      return res.status(404).json({ 
        message: 'User not found',
        error: 'UserNotFound',
        requiresRegistration: true
      });
    }

    // Check profile completion
    const profileCheck = await checkProfileCompletion(userId);

    console.log('[Get Current User] ✅ Profile fetched successfully');

    res.json({
      message: 'User profile fetched successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        fitness_level: user.fitness_level,
        role: user.role,
        isActive: user.is_active,
        level: user.level || 1,
        total_xp: user.total_xp || 0,
        createdAt: user.created_at
      },
      profileComplete: profileCheck.isComplete,
      missingFields: profileCheck.missingFields
    });

  } catch (err) {
    console.error('[Get Current User] ❌ Unexpected error:', err.message);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * Complete user profile (for users who need to finish setup)
 * POST /api/auth/complete-profile
 * Headers: Authorization: Bearer <token>
 * Body: { name?, age?, gender?, fitness_level? }
 */
export const completeProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, age, gender, fitness_level } = req.body;

    console.log('[Complete Profile] Profile completion request for:', userId);

    if (!userId) {
      return res.status(401).json({ 
        message: 'Not authenticated',
        error: 'Unauthenticated' 
      });
    }

    // Update user profile
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (age !== undefined) updates.age = age;
    if (gender !== undefined) updates.gender = gender;
    if (fitness_level !== undefined) updates.fitness_level = fitness_level;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        console.error('[Complete Profile] ❌ Error updating profile:', updateError);
        return res.status(500).json({ 
          message: 'Failed to update profile', 
          error: updateError.message 
        });
      }
    }

    // Initialize missing records
    const initResults = await initializeUserRecords(userId);

    if (initResults.errors.length > 0) {
      console.error('[Complete Profile] ❌ Failed to initialize some records:', initResults.errors);
      return res.status(500).json({ 
        message: 'Profile update incomplete', 
        error: 'Failed to initialize some records',
        errors: initResults.errors
      });
    }

    console.log('[Complete Profile] ✅ Profile completed successfully');

    res.json({
      message: 'Profile completed successfully',
      success: true
    });

  } catch (err) {
    console.error('[Complete Profile] ❌ Unexpected error:', err.message);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * Refresh JWT token
 * POST /api/auth/refresh
 * Body: { token } or Headers: Authorization: Bearer <token>
 */
export const refresh = async (req, res) => {
  try {
    console.log('[Refresh Token] Token refresh request');
    
    const token = req.body.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('[Refresh Token] ❌ No token provided');
      return res.status(400).json({ 
        message: 'Token is required',
        error: 'MissingToken' 
      });
    }

    const newToken = await refreshToken(token);
    
    console.log('[Refresh Token] ✅ Token refreshed successfully');

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (err) {
    console.error('[Refresh Token] ❌ Token refresh failed:', err.message);
    
    if (err.message.includes('User not found')) {
      return res.status(401).json({ 
        message: 'User not found',
        error: 'UserNotFound',
        requiresLogin: true
      });
    }
    
    res.status(401).json({ 
      message: 'Token refresh failed', 
      error: err.message,
      requiresLogin: true
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 * Body: { email }
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  console.log('[Forgot Password] Password reset request for:', email);

  if (!email) {
    console.log('[Forgot Password] ❌ Missing email');
    return res.status(400).json({ 
      message: 'Email is required',
      error: 'MissingEmail' 
    });
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      console.error('[Forgot Password] ❌ Error sending reset email:', error.message);
    } else {
      console.log('[Forgot Password] ✅ Reset email sent (if user exists)');
    }

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      success: true
    });

  } catch (err) {
    console.error('[Forgot Password] ❌ Unexpected error:', err.message);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * Change password (for authenticated users)
 * POST /api/auth/change-password
 * Headers: Authorization: Bearer <token>
 * Body: { currentPassword, newPassword }
 */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;
  
  console.log('[Change Password] Password change request for user:', userId);

  if (!currentPassword || !newPassword) {
    console.log('[Change Password] ❌ Missing required fields');
    return res.status(400).json({ 
      message: 'Current password and new password are required',
      error: 'MissingFields' 
    });
  }

  if (newPassword.length < 6) {
    console.log('[Change Password] ❌ New password too short');
    return res.status(400).json({ 
      message: 'New password must be at least 6 characters long',
      error: 'WeakPassword' 
    });
  }

  if (currentPassword === newPassword) {
    console.log('[Change Password] ❌ New password same as current');
    return res.status(400).json({ 
      message: 'New password must be different from current password',
      error: 'SamePassword' 
    });
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      console.error('[Change Password] ❌ User not found');
      return res.status(404).json({ 
        message: 'User not found',
        error: 'UserNotFound' 
      });
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      console.error('[Change Password] ❌ Current password incorrect');
      return res.status(401).json({ 
        message: 'Current password is incorrect',
        error: 'InvalidCurrentPassword' 
      });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('[Change Password] ❌ Password update failed:', updateError.message);
      return res.status(400).json({ 
        message: 'Password change failed', 
        error: updateError.message 
      });
    }

    console.log('[Change Password] ✅ Password changed successfully');

    res.json({
      message: 'Password changed successfully',
      success: true
    });

  } catch (err) {
    console.error('[Change Password] ❌ Unexpected error:', err.message);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const generateToken = (userId, options = {}) => {
  if (!userId) {
    throw new Error('userId is required to generate token');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const expiresIn = options.expiresIn || process.env.JWT_EXPIRE || '7d';
  
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    ...(options.additionalClaims || {})
  };

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      ...(options.jwtOptions || {})
    });

    console.log(`[Generate Token] ✅ Token generated for user: ${userId}, expires in: ${expiresIn}`);
    return token;
  } catch (error) {
    console.error('[Generate Token] ❌ Error generating token:', error.message);
    throw new Error(`Failed to generate token: ${error.message}`);
  }
};

export const verifyToken = (token) => {
  if (!token) {
    throw new Error('Token is required');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('[Verify Token] ❌ Token verification failed:', error.message);
    throw error;
  }
};

export const decodeToken = (token) => {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded;
  } catch (error) {
    console.error('[Decode Token] ❌ Token decode failed:', error.message);
    throw error;
  }
};

export const refreshToken = async (oldToken) => {
  if (!oldToken) {
    throw new Error('Token is required for refresh');
  }

  try {
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, {
      ignoreExpiration: true
    });

    const userId = decoded.userId;

    if (!userId) {
      throw new Error('Invalid token payload');
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!user) {
      throw new Error('User not found');
    }

    if (user.is_active === false) {
      throw new Error('Account is inactive');
    }

    const newToken = generateToken(userId);
    console.log(`[Refresh Token] ✅ Token refreshed for user: ${userId}`);
    
    return newToken;
  } catch (error) {
    console.error('[Refresh Token] ❌ Error refreshing token:', error.message);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
};

export const validateAuthConfig = () => {
  const errors = [];

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is not configured');
  }

  if (!process.env.SUPABASE_URL) {
    errors.push('SUPABASE_URL is not configured');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  if (errors.length > 0) {
    console.error('[Auth Config] ❌ Configuration errors:', errors.join(', '));
    throw new Error(`Authentication configuration errors: ${errors.join(', ')}`);
  }

  console.log('[Auth Config] ✅ Authentication configuration validated');
  return true;
};

/**
 * Initialize user records (progression, stats, fitness profile)
 * POST /api/auth/initialize
 * Headers: Authorization: Bearer <token>
 * Used to ensure all required records exist for a user
 */
export const initializeUserData = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ 
        message: 'Not authenticated',
        error: 'Unauthenticated' 
      });
    }

    console.log('[Initialize] Initializing user data for:', userId);

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('fitness_level')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        message: 'User not found',
        error: 'UserNotFound' 
      });
    }

    // Initialize with user's fitness level
    const results = await initializeUserRecords(userId, {
      fitnessLevel: user.fitness_level || 'beginner'
    });

    console.log('[Initialize] ✅ User data initialized');

    res.json({
      message: 'User data initialized successfully',
      initialized: results
    });

  } catch (err) {
    console.error('[Initialize] ❌ Error initializing user data:', err.message);
    res.status(500).json({ 
      message: 'Failed to initialize user data', 
      error: err.message 
    });
  }
};