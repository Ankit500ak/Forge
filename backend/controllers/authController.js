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
        message: 'User not found. Please register or contact support.',
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
// AUTHENTICATION CONTROLLER FUNCTIONS
// ============================================================================

/**
 * Register a new user
 * POST /api/auth/register
 * Body: { email, password, name? }
 */
export const register = async (req, res) => {
  const { email, password, name } = req.body;
  
  console.log('[Register] Registration attempt for email:', email);
  
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

    // Create user profile in your users table
    console.log('[Register] Creating user profile in database...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email: authData.user.email.toLowerCase(),
          name: name || null,
          role: 'user', // default role
          is_active: true,
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
        role: 'user'
      },
      token,
      access_token: authData.session?.access_token || null,
      requiresEmailVerification: !authData.session // true if email confirmation required
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
    console.log('[Login] Fetching user profile...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role, is_active')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[Login] ❌ Error fetching user profile:', profileError.message);
      return res.status(500).json({ 
        message: 'Failed to fetch user profile', 
        error: profileError.message 
      });
    }

    if (!userProfile) {
      console.error('[Login] ❌ User profile not found for:', data.user.id);
      return res.status(401).json({ 
        message: 'User profile not found. Please complete registration.',
        error: 'ProfileNotFound',
        requiresRegistration: true
      });
    }

    // Check if account is active
    if (userProfile.is_active === false) {
      console.error('[Login] ❌ Account is inactive:', data.user.id);
      return res.status(403).json({ 
        message: 'Your account has been deactivated. Please contact support.',
        error: 'AccountInactive' 
      });
    }

    console.log('[Login] ✅ User profile validated');

    // Generate custom JWT token
    const token = generateToken(data.user.id);

    console.log(`[Login] 🎉 Login successful for: ${email}`);

    // Return token and user info
    res.json({
      message: 'Login successful',
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role
      },
      token,
      access_token: data.session?.access_token || null
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
    const userId = req.userId; // Set by authenticate middleware
    
    console.log('[Logout] Logout request for user:', userId || 'anonymous');

    // For Supabase, logout is primarily handled client-side
    // Server can perform any cleanup if needed (e.g., invalidate refresh tokens)
    
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
 * Get current user profile
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId; // Set by authenticate middleware
    
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
      .select('id, email, name, role, is_active, created_at')
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
        error: 'UserNotFound' 
      });
    }

    console.log('[Get Current User] ✅ Profile fetched successfully');

    res.json({
      message: 'User profile fetched successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at
      }
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
 * Refresh JWT token
 * POST /api/auth/refresh
 * Body: { token } or Headers: Authorization: Bearer <token>
 */
export const refresh = async (req, res) => {
  try {
    console.log('[Refresh Token] Token refresh request');
    
    // Get token from body or header
    const token = req.body.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('[Refresh Token] ❌ No token provided');
      return res.status(400).json({ 
        message: 'Token is required',
        error: 'MissingToken' 
      });
    }

    // Refresh the token
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
    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      console.error('[Forgot Password] ❌ Error sending reset email:', error.message);
      // Don't reveal if user exists or not for security
      // Still return success to prevent email enumeration
    } else {
      console.log('[Forgot Password] ✅ Reset email sent (if user exists)');
    }

    // Always return success to prevent email enumeration
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
 * Reset password with token
 * POST /api/auth/reset-password
 * Body: { token, newPassword }
 */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  
  console.log('[Reset Password] Password reset attempt');

  if (!token || !newPassword) {
    console.log('[Reset Password] ❌ Missing required fields');
    return res.status(400).json({ 
      message: 'Token and new password are required',
      error: 'MissingFields' 
    });
  }

  if (newPassword.length < 6) {
    console.log('[Reset Password] ❌ Password too short');
    return res.status(400).json({ 
      message: 'Password must be at least 6 characters long',
      error: 'WeakPassword' 
    });
  }

  try {
    // Update password via Supabase
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('[Reset Password] ❌ Password reset failed:', error.message);
      return res.status(400).json({ 
        message: 'Password reset failed', 
        error: error.message 
      });
    }

    console.log('[Reset Password] ✅ Password reset successful');

    res.json({
      message: 'Password reset successful. You can now log in with your new password.',
      success: true
    });

  } catch (err) {
    console.error('[Reset Password] ❌ Unexpected error:', err.message);
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
  const userId = req.userId; // Set by authenticate middleware
  
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
    // Get user email
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

    // Verify current password by attempting to sign in
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

    // Update to new password
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

/**
 * Update user profile
 * PATCH /api/auth/profile
 * Headers: Authorization: Bearer <token>
 * Body: { name?, email? }
 */
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const userId = req.userId; // Set by authenticate middleware
  
  console.log('[Update Profile] Profile update request for user:', userId);

  if (!name && !email) {
    console.log('[Update Profile] ❌ No fields to update');
    return res.status(400).json({ 
      message: 'At least one field (name or email) is required',
      error: 'NoFieldsToUpdate' 
    });
  }

  try {
    const updates = {};
    
    // Prepare updates for users table
    if (name !== undefined) {
      updates.name = name;
      console.log('[Update Profile] Updating name');
    }
    
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('[Update Profile] ❌ Invalid email format');
        return res.status(400).json({ 
          message: 'Invalid email format',
          error: 'InvalidEmail' 
        });
      }
      
      updates.email = email.toLowerCase();
      console.log('[Update Profile] Updating email');
      
      // Update email in Supabase Auth as well
      const { error: authError } = await supabase.auth.updateUser({
        email: email
      });
      
      if (authError) {
        console.error('[Update Profile] ❌ Auth email update failed:', authError.message);
        return res.status(400).json({ 
          message: 'Failed to update email', 
          error: authError.message 
        });
      }
    }

    // Update user profile in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, name, role')
      .single();

    if (updateError) {
      console.error('[Update Profile] ❌ Profile update failed:', updateError.message);
      return res.status(500).json({ 
        message: 'Failed to update profile', 
        error: updateError.message 
      });
    }

    console.log('[Update Profile] ✅ Profile updated successfully');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (err) {
    console.error('[Update Profile] ❌ Unexpected error:', err.message);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * Delete user account
 * DELETE /api/auth/account
 * Headers: Authorization: Bearer <token>
 * Body: { password }
 */
export const deleteAccount = async (req, res) => {
  const { password } = req.body;
  const userId = req.userId; // Set by authenticate middleware
  
  console.log('[Delete Account] Account deletion request for user:', userId);

  if (!password) {
    console.log('[Delete Account] ❌ Password required');
    return res.status(400).json({ 
      message: 'Password is required to delete account',
      error: 'MissingPassword' 
    });
  }

  try {
    // Get user email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (!user) {
      console.error('[Delete Account] ❌ User not found');
      return res.status(404).json({ 
        message: 'User not found',
        error: 'UserNotFound' 
      });
    }

    // Verify password before deletion
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password
    });

    if (signInError) {
      console.error('[Delete Account] ❌ Password verification failed');
      return res.status(401).json({ 
        message: 'Incorrect password',
        error: 'InvalidPassword' 
      });
    }

    // Delete user from Supabase Auth (this will cascade delete in users table if set up)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[Delete Account] ❌ Account deletion failed:', deleteError.message);
      return res.status(500).json({ 
        message: 'Failed to delete account', 
        error: deleteError.message 
      });
    }

    // Also explicitly delete from users table if not cascaded
    await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    console.log('[Delete Account] ✅ Account deleted successfully:', userId);

    res.json({
      message: 'Account deleted successfully',
      success: true
    });

  } catch (err) {
    console.error('[Delete Account] ❌ Unexpected error:', err.message);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
    console.log('[Verify Token] ✅ Token verified successfully');
    return decoded;
  } catch (error) {
    console.error('[Verify Token] ❌ Token verification failed:', error.message);
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
    console.log('[Decode Token] ✅ Token decoded successfully');
    return decoded;
  } catch (error) {
    console.error('[Decode Token] ❌ Token decode failed:', error.message);
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
    console.log('[Refresh Token] Verifying old token...');
    
    // Verify old token (allow expired tokens for refresh)
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, {
      ignoreExpiration: true
    });

    const userId = decoded.userId;

    if (!userId) {
      throw new Error('Invalid token payload');
    }

    console.log('[Refresh Token] Verifying user exists...');

    // Verify user still exists and is active
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

    // Generate new token
    const newToken = generateToken(userId);
    console.log(`[Refresh Token] ✅ Token refreshed for user: ${userId}`);
    
    return newToken;
  } catch (error) {
    console.error('[Refresh Token] ❌ Error refreshing token:', error.message);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
};

/**
 * Validate JWT secret is configured
 */
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