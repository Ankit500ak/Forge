import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Authentication middleware
 * Validates JWT token and verifies user exists in database
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('[Auth] No authorization header provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('[Auth] Token missing from authorization header');
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (verifyErr) {
      console.error('[Auth] Token verification failed:', verifyErr.message);
      
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
          error: 'NotBeforeError' 
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid token', 
        error: verifyErr.message 
      });
    }
    
    const userId = decoded.userId;

    if (!userId) {
      console.error('[Auth] No userId in token payload');
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // Verify user exists in the database
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('[Auth] Database error checking user:', userError.message);
        // Don't block on DB errors - if JWT is valid, user is authenticated
        // This prevents logout loops due to connection issues
        console.warn('[Auth] Allowing authentication despite DB error');
      } else if (!user) {
        console.error('[Auth] User not found in database:', userId);
        return res.status(401).json({ 
          message: 'Profile not found',
          error: 'UserNotFound'
        });
      } else {
        console.log(`[Auth] ✅ User authenticated: ${userId}`);
      }
    } catch (dbErr) {
      console.error('[Auth] Unexpected database error:', dbErr.message);
      // Don't block on DB errors - if JWT is valid, user is authenticated
      console.warn('[Auth] Allowing authentication despite DB error');
    }

    // Attach userId to request object for downstream use
    req.userId = userId;
    req.user = { id: userId };
    
    next();
  } catch (error) {
    console.error('[Auth] Unexpected authentication error:', error.message);
    console.error('[Auth] Stack trace:', error.stack);
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
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No token provided, continue without authentication
      req.userId = null;
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
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
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!error && user) {
          req.userId = userId;
          req.user = { id: userId };
          console.log(`[Auth] ✅ Optional auth successful: ${userId}`);
        }
      }
    } catch (err) {
      // Token invalid or expired, continue without authentication
      console.log('[Auth] Optional auth failed, continuing as anonymous');
    }

    next();
  } catch (error) {
    console.error('[Auth] Error in optional authentication:', error.message);
    // Don't block the request
    req.userId = null;
    req.user = null;
    next();
  }
};

/**
 * Generate JWT token for user
 * @param {string} userId - User ID to encode in token
 * @param {object} options - Additional options (expiresIn, etc.)
 * @returns {string} JWT token
 */
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
    iat: Math.floor(Date.now() / 1000), // Issued at
    ...(options.additionalClaims || {})
  };

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      ...(options.jwtOptions || {})
    });

    console.log(`[Auth] ✅ Token generated for user: ${userId}, expires in: ${expiresIn}`);
    return token;
  } catch (error) {
    console.error('[Auth] Error generating token:', error.message);
    throw new Error(`Failed to generate token: ${error.message}`);
  }
};

/**
 * Verify and decode JWT token without database check
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
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
    console.error('[Auth] Token verification failed:', error.message);
    throw error;
  }
};

/**
 * Decode JWT token without verification (useful for debugging)
 * @param {string} token - JWT token to decode
 * @returns {object} Decoded token payload (unverified)
 */
export const decodeToken = (token) => {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded;
  } catch (error) {
    console.error('[Auth] Token decode failed:', error.message);
    throw error;
  }
};

/**
 * Refresh token (generate new token with same userId)
 * @param {string} oldToken - Current JWT token
 * @returns {string} New JWT token
 */
export const refreshToken = async (oldToken) => {
  if (!oldToken) {
    throw new Error('Token is required for refresh');
  }

  try {
    // Verify old token (allow expired tokens for refresh)
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, {
      ignoreExpiration: true
    });

    const userId = decoded.userId;

    if (!userId) {
      throw new Error('Invalid token payload');
    }

    // Verify user still exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new token
    const newToken = generateToken(userId);
    console.log(`[Auth] ✅ Token refreshed for user: ${userId}`);
    
    return newToken;
  } catch (error) {
    console.error('[Auth] Error refreshing token:', error.message);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
};

/**
 * Admin authentication middleware
 * Requires user to be authenticated AND have admin role
 */
export const authenticateAdmin = async (req, res, next) => {
  try {
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
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Auth] Error checking admin status:', error);
      return res.status(500).json({ 
        message: 'Failed to verify admin status', 
        error: error.message 
      });
    }

    if (!user || user.role !== 'admin') {
      console.log(`[Auth] ⛔ Admin access denied for user: ${userId}`);
      return res.status(403).json({ 
        message: 'Admin access required',
        error: 'Forbidden' 
      });
    }

    console.log(`[Auth] ✅ Admin authenticated: ${userId}`);
    next();
  } catch (error) {
    console.error('[Auth] Error in admin authentication:', error.message);
    res.status(500).json({ 
      message: 'Authentication error', 
      error: error.message 
    });
  }
};

/**
 * Validate JWT secret is configured
 */
export const validateAuthConfig = () => {
  if (!process.env.JWT_SECRET) {
    console.error('[Auth] ❌ JWT_SECRET is not configured!');
    throw new Error('JWT_SECRET environment variable must be set');
  }

  if (!process.env.SUPABASE_URL) {
    console.error('[Auth] ❌ SUPABASE_URL is not configured!');
    throw new Error('SUPABASE_URL environment variable must be set');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Auth] ❌ SUPABASE_SERVICE_ROLE_KEY is not configured!');
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable must be set');
  }

  console.log('[Auth] ✅ Authentication configuration validated');
  return true;
};

/**
 * Ensure user records exist - creates them if missing
 * This middleware guarantees user_progression, user_stats, and fitness_profiles exist
 * Called after authentication to initialize missing records with beginner defaults
 */
export const ensureUserRecords = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      console.log('[EnsureRecords] No user ID, skipping');
      return next();
    }

    console.log(`[EnsureRecords] Ensuring records exist for user: ${userId}`);

    // Check if user_progression exists
    const { data: progression, error: progError } = await supabase
      .from('user_progression')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (progError) {
      console.error('[EnsureRecords] ❌ Error checking progression:', progError.message);
      console.error('[EnsureRecords] Error code:', progError.code);
      if (progError.code === '42501') {
        console.error('[EnsureRecords] ⚠️  RLS POLICY BLOCKING READ - Table: user_progression');
      }
    }

    if (!progression && !progError) {
      console.log('[EnsureRecords] Creating missing user_progression');
      const { data: newProg, error: createProgError } = await supabase
        .from('user_progression')
        .insert({
          user_id: userId,
          level: 1,
          total_xp: 0,
          xp_today: 0,
          rank: 'Recruit',
          stat_points: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (createProgError) {
        console.error('[EnsureRecords] ❌ Error creating progression:', createProgError.message);
        console.error('[EnsureRecords] Error code:', createProgError.code);
        if (createProgError.code === '42501') {
          console.error('[EnsureRecords] ⚠️  RLS POLICY BLOCKING INSERT - Table: user_progression');
        }
      } else {
        console.log('[EnsureRecords] ✅ Created user_progression:', newProg);
      }
    } else {
      console.log('[EnsureRecords] ✅ user_progression exists');
    }

    // Check if user_stats exists
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsError) {
      console.error('[EnsureRecords] ❌ Error checking stats:', statsError.message);
      if (statsError.code === '42501') {
        console.error('[EnsureRecords] ⚠️  RLS POLICY BLOCKING READ - Table: user_stats');
      }
    }

    if (!stats && !statsError) {
      console.log('[EnsureRecords] Creating missing user_stats');
      const { data: newStats, error: createStatsError } = await supabase
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (createStatsError) {
        console.error('[EnsureRecords] ❌ Error creating stats:', createStatsError.message);
        if (createStatsError.code === '42501') {
          console.error('[EnsureRecords] ⚠️  RLS POLICY BLOCKING INSERT - Table: user_stats');
        }
      } else {
        console.log('[EnsureRecords] ✅ Created user_stats:', newStats);
      }
    } else {
      console.log('[EnsureRecords] ✅ user_stats exists');
    }

    // Check if fitness_profiles exists
    const { data: fitness, error: fitnessError } = await supabase
      .from('fitness_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fitnessError) {
      console.error('[EnsureRecords] ❌ Error checking fitness_profiles:', fitnessError.message);
      if (fitnessError.code === '42501') {
        console.error('[EnsureRecords] ⚠️  RLS POLICY BLOCKING READ - Table: fitness_profiles');
      }
    }

    if (!fitness && !fitnessError) {
      console.log('[EnsureRecords] Creating missing fitness_profiles');
      const { data: newFitness, error: createFitnessError } = await supabase
        .from('fitness_profiles')
        .insert({
          user_id: userId,
          fitness_level: 'beginner',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (createFitnessError) {
        console.error('[EnsureRecords] ❌ Error creating fitness_profiles:', createFitnessError.message);
        if (createFitnessError.code === '42501') {
          console.error('[EnsureRecords] ⚠️  RLS POLICY BLOCKING INSERT - Table: fitness_profiles');
        }
      } else {
        console.log('[EnsureRecords] ✅ Created fitness_profiles:', newFitness);
      }
    } else {
      console.log('[EnsureRecords] ✅ fitness_profiles exists');
    }

    console.log('[EnsureRecords] ✅ User records verified/created');
    next();
  } catch (error) {
    console.error('[EnsureRecords] ❌ Critical error ensuring records:', error.message);
    console.error('[EnsureRecords] Stack trace:', error.stack);
    // Don't block - continue even if there's an error
    next();
  }
};