import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/fitnessdb'
});

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
    const userResult = await pool.query(
      `SELECT 
        id, email, name, age, gender, fitness_level,
        level, total_xp
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user stats (6-stat system)
    const statsResult = await pool.query(
      `SELECT 
        strength, speed, endurance, agility, power, recovery
       FROM user_stats 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = statsResult.rows[0] || {
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
        level: user.level,
        total_xp: user.total_xp
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
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
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

    const result = await pool.query(
      `SELECT * FROM user_stats WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Stats not found' });
    }

    const stats = result.rows[0];

    console.log(`[Users] ✅ Stats fetched`);

    res.json({
      message: 'User stats retrieved',
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
    console.error('[Users] Error fetching stats:', error.message);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};
