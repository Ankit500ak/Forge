import express from 'express';
import { Pool } from 'pg';
import { getRankForXp, RANK_THRESHOLDS } from '../utils/rank.js';
import { getLevelFromXp, getLevelProgress } from '../utils/level.js';
import { checkRankUp, getNextRankInfo } from '../utils/rankMonitor.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Parse connection string to avoid system environment variable interference
const parseConnectionString = () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is required.');
  }
  return { connectionString: process.env.POSTGRES_URL, connectionTimeoutMillis: 5000 };
};

const pool = new Pool(parseConnectionString());

// Protected route - Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const data = rows[0];
    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      message: 'User profile retrieved',
      user: data,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 👑 NEW: Get user profile with stats (6-stat system)
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    console.log(`[Users] Fetching profile with stats for user: ${userId}`);

    // Get user data + fitness profile
    const userResult = await pool.query(
      `SELECT 
        u.id, u.email, u.name,
        fp.age, fp.gender, fp.fitness_level,
        COALESCE(up.level, 1) as level,
        COALESCE(up.total_xp, 0) as total_xp
       FROM users u
       LEFT JOIN fitness_profiles fp ON u.id = fp.user_id
       LEFT JOIN user_progression up ON u.id = up.user_id
       WHERE u.id = $1`,
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

    console.log(`[Users] ✅ Profile fetched for ${user.email}`, stats);

    res.json({
      message: 'User profile with stats retrieved',
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
});

// Protected route - Update user profile
router.put('/profile/update', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.userId;

    if (!name && !email) {
      return res.status(400).json({ message: 'At least one field (name or email) is required' });
    }

    const fields = [];
    const values = [];
    let idx = 1;
    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (email) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }
    values.push(userId);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await pool.query(query, values);
    const data = rows[0];

    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: data,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Protected route - Get user's game progression and stats
router.get('/me/game', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const { rows: progRows } = await pool.query('SELECT * FROM user_progression WHERE user_id = $1', [userId]);
    const progression = progRows[0] || null;

    const { rows: statsRows } = await pool.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
    const stats = statsRows[0] || null;

    // Recalculate level from total XP (prestige-aware)
    if (progression) {
      const totalXp = Number(progression.total_xp || 0);
      const prestige = Number(progression.prestige || 0);
      const calculatedLevel = getLevelFromXp(totalXp, prestige);
      
      // Update level in database if it changed
      if (calculatedLevel !== progression.level) {
        await pool.query(
          'UPDATE user_progression SET level = $1, updated_at = NOW() WHERE user_id = $2',
          [calculatedLevel, userId]
        );
        progression.level = calculatedLevel;
      }

      // Calculate level progress (XP towards next level)
      const levelProgress = getLevelProgress(totalXp, prestige);
      
      // Update next_level_percent in progression object
      progression.next_level_percent = levelProgress.percentToNext;
    }

    // Compute rank metadata for frontend convenience
    const prog = progression;
    let rankMetadata = null;
    if (prog) {
      const total = Number(prog.total_xp || 0);
      const today = Number(prog.xp_today || 0);
      const projected = total + today;
      const prestige = Number(prog.prestige || 0);

      const idx = RANK_THRESHOLDS.findIndex((t) => total >= t.minXp);
      const currentThreshold = idx >= 0 ? RANK_THRESHOLDS[idx] : RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
      const nextThreshold = idx > 0 ? RANK_THRESHOLDS[idx - 1] : null;

      const pctToNext = nextThreshold
        ? Math.max(0, Math.min(100, Math.round(((total - currentThreshold.minXp) / (nextThreshold.minXp - currentThreshold.minXp)) * 100)))
        : 100;

      const projectedRank = getRankForXp(projected, prestige);
      const projectedIdx = RANK_THRESHOLDS.findIndex((t) => projected >= t.minXp);
      const projectedCurrent = projectedIdx >= 0 ? RANK_THRESHOLDS[projectedIdx] : RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
      const projectedNext = projectedIdx > 0 ? RANK_THRESHOLDS[projectedIdx - 1] : null;
      const projectedPctToNext = projectedNext
        ? Math.max(0, Math.min(100, Math.round(((projected - projectedCurrent.minXp) / (projectedNext.minXp - projectedCurrent.minXp)) * 100)))
        : 100;

      rankMetadata = {
        rank: prog.rank || getRankForXp(total, prestige),
        total_xp: total,
        xp_today: today,
        projected_total_xp: projected,
        projected_rank: projectedRank,
        percent_to_next: pctToNext,
        projected_percent_to_next: projectedPctToNext,
        thresholds: RANK_THRESHOLDS,
      };
    }

    res.json({
      message: 'User game data retrieved',
      progression: progression,
      stats: stats,
      rankMetadata,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Protected route - update user's progression (add XP / stat points)
// This adds to DAILY XP only - not total XP
router.post('/me/game/update', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const xpGain = Math.max(0, Math.floor(Number(req.body.xpGain || 0)));
    const statPointsGain = Math.max(0, Math.floor(Number(req.body.statPointsGain || 0)));

    const { rows: currRows } = await pool.query('SELECT * FROM user_progression WHERE user_id = $1', [userId]);
    const current = currRows[0];

    if (!current) {
      return res.status(404).json({ message: 'Progression not found' });
    }

    // Ensure all values are properly cast to BIGINT for large numbers
    const currentXpToday = Math.max(0, Math.floor(Number(current.xp_today || 0)));
    
    // Add XP to TODAY only (not total_xp)
    const newXpToday = currentXpToday + xpGain;

    const { rows: updatedRows } = await pool.query(
      `UPDATE user_progression 
       SET 
        xp_today = $1::BIGINT,
        weekly_xp = COALESCE(weekly_xp, 0)::BIGINT + $2::BIGINT,
        monthly_xp = COALESCE(monthly_xp, 0)::BIGINT + $2::BIGINT,
        stat_points = COALESCE(stat_points, 0)::INTEGER + $3::INTEGER,
        last_active = NOW(),
        updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [newXpToday, xpGain, statPointsGain, userId]
    );
    const updated = updatedRows[0];

    res.json({ 
      message: 'Daily XP updated (not yet applied to total)', 
      progression: updated,
      xpAddedToDaily: xpGain,
      xpTodayTotal: newXpToday,
      note: 'XP will be applied to total_xp on daily rollover'
    });
  } catch (err) {
    console.error('[Users] Error updating progression:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Protected route - end-of-day rollover: add xp_today to total_xp and reset xp_today
router.post('/me/game/rollover', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const { rows: currRows } = await pool.query('SELECT * FROM user_progression WHERE user_id = $1', [userId]);
    const current = currRows[0];

    if (!current) {
      return res.status(404).json({ message: 'Progression not found' });
    }

    // Get current values and ensure they're numbers
    const xpToAdd = Math.floor(Number(current.xp_today || 0));
    const currentTotalXp = Math.floor(Number(current.total_xp || 0));
    const newTotal = currentTotalXp + xpToAdd;
    const currentPrestige = Math.floor(Number(current.prestige || 0));
    
    // Check for rank up using monitor
    const rankUpInfo = checkRankUp(userId, currentTotalXp, newTotal, currentPrestige);
    const nextRank = getNextRankInfo(newTotal, currentPrestige);
    
    // Calculate new level after rollover
    const newLevel = getLevelFromXp(newTotal, currentPrestige);
    const newRank = getRankForXp(newTotal, currentPrestige);

    const { rows: updatedRows } = await pool.query(
      `UPDATE user_progression 
       SET 
        total_xp = $1::BIGINT,
        xp_today = 0::BIGINT,
        level = $2::INTEGER,
        rank = $3,
        last_active = $4,
        updated_at = NOW()
       WHERE user_id = $5 
       RETURNING *`,
      [newTotal, newLevel, newRank, new Date().toISOString(), userId]
    );
    const updated = updatedRows[0];

    console.log(`[Rollover] User ${userId}: xp_today ${xpToAdd} → total_xp = ${newTotal}. Level: ${current.level} → ${newLevel}`);

    res.json({ 
      message: 'Daily rollover complete',
      progression: updated,
      xpRolledOver: xpToAdd,
      newTotalXp: newTotal,
      levelChange: { old: current.level, new: newLevel },
      rankUp: rankUpInfo.ranked ? rankUpInfo : null,
      nextRankInfo: nextRank
    });
  } catch (err) {
    console.error('[Rollover] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Protected route - sync rank server-side based on `total_xp`
router.post('/me/game/sync-rank', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const { rows: currRows } = await pool.query('SELECT * FROM user_progression WHERE user_id = $1', [userId]);
    const current = currRows[0];

    if (!current) {
      return res.status(404).json({ message: 'Progression not found' });
    }

    const total = Number(current.total_xp || 0);
    const prestige = Number(current.prestige || 0);
    const computedRank = getRankForXp(total, prestige);

    if (current.rank === computedRank) {
      return res.json({ message: 'Rank already in sync', synced: false, progression: current });
    }

    const { rows: updatedRows } = await pool.query(
      `UPDATE user_progression SET rank = $1, last_active = $2 WHERE user_id = $3 RETURNING *`,
      [computedRank, new Date().toISOString(), userId]
    );
    const updated = updatedRows[0];

    res.json({ message: 'Rank synced', synced: true, progression: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Legacy route - Update user by ID
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.params.id;

    if (userId !== req.userId) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    if (!name && !email) {
      return res.status(400).json({ message: 'At least one field (name or email) is required' });
    }

    const fields = [];
    const values = [];
    let idx = 1;
    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (email) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }
    values.push(userId);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await pool.query(query, values);
    const data = rows[0];

    res.json({
      message: 'User updated successfully',
      user: data,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Protected route - Get global leaderboard and user's rank
router.get('/me/global-rank', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // Get all users sorted by total_xp (for ranking)
    const { rows: allUsers } = await pool.query(`
      SELECT 
        up.user_id,
        u.name,
        up.level,
        up.total_xp
      FROM user_progression up
      LEFT JOIN users u ON up.user_id = u.id
      ORDER BY up.total_xp DESC, up.level DESC
    `);

    // Find current user's rank
    const userRankIndex = allUsers.findIndex(u => u.user_id === userId);
    const userGlobalRank = userRankIndex >= 0 ? userRankIndex + 1 : 999999;

    // Get top 10 for leaderboard display
    const topPlayers = allUsers.slice(0, 10).map((user, index) => ({
      rank: index + 1,
      name: user.name || 'Anonymous',
      level: user.level,
      xp: parseInt(user.total_xp) || 0,
    }));

    res.json({
      message: 'Global ranking retrieved',
      userGlobalRank,
      totalPlayers: allUsers.length,
      topPlayers,
      qualifiesForSPlus: userGlobalRank <= 1000,
      qualifiesForSSPlus: userGlobalRank <= 100,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Protected route - Get full leaderboard (paginated)
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { rows: leaderboardUsers } = await pool.query(`
      SELECT 
        up.user_id,
        u.name,
        up.level,
        up.total_xp,
        up.rank,
        up.current_streak
      FROM user_progression up
      LEFT JOIN users u ON up.user_id = u.id
      ORDER BY up.total_xp DESC, up.level DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const { rows: totalRows } = await pool.query('SELECT COUNT(*) as count FROM user_progression');
    const totalPlayers = parseInt(totalRows[0].count);

    const leaderboard = leaderboardUsers.map((user, index) => ({
      globalRank: offset + index + 1,
      name: user.name || 'Anonymous',
      level: user.level,
      xp: parseInt(user.total_xp) || 0,
      rank: user.rank || 'F',
      streak: user.current_streak || 0,
    }));

    res.json({
      message: 'Leaderboard retrieved',
      leaderboard,
      page,
      limit,
      totalPlayers,
      totalPages: Math.ceil(totalPlayers / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Protected route - Rank up handler
router.post('/me/rank-up', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const { rows: progRows } = await pool.query(
      'SELECT * FROM user_progression WHERE user_id = $1',
      [userId]
    );
    const progression = progRows[0];

    if (!progression) {
      return res.status(404).json({ message: 'Progression not found' });
    }

    const { rows: statRows } = await pool.query(
      'SELECT * FROM user_stats WHERE user_id = $1',
      [userId]
    );
    const stats = statRows[0] || {};

    // Get current rank from XP
    const currentRank = getRankForXp(progression.total_xp || 0);
    const currentLevel = progression.level || 1;
    
    // Rank order
    const RANK_ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'A+', 'S', 'S+', 'SS+'];
    const currentRankIndex = RANK_ORDER.indexOf(currentRank);
    const nextRank = RANK_ORDER[currentRankIndex + 1];

    // CAP: Players can only reach S rank at level 100
    if (currentRank === 'S' && currentLevel >= 100) {
      return res.status(400).json({
        message: 'Maximum rank reached at level 100. Further progression determined by global ranking.',
        currentRank: 'S',
        status: 'CAPPED_AT_S_RANK',
        requiresGlobalRanking: true
      });
    }

    if (!nextRank) {
      return res.status(400).json({ message: 'Already at maximum rank' });
    }

    // Rank-up requirements (all XP values are incremental within this rank, not cumulative)
    const RANK_UP_REQUIREMENTS = {
      F: { xpRequired: 40000, tasksRequired: 10, streakRequired: 5 },
      E: { xpRequired: 160000, tasksRequired: 30, streakRequired: 14 },
      D: { xpRequired: 400000, tasksRequired: 75, streakRequired: 30 },
      C: { xpRequired: 600000, tasksRequired: 150, streakRequired: 60 },
      B: { xpRequired: 1200000, tasksRequired: 300, streakRequired: 90 },
      A: { xpRequired: 1800000, tasksRequired: 500, streakRequired: 120 },
      'A+': { xpRequired: 3600000, tasksRequired: 750, streakRequired: 150 },
      S: { xpRequired: 12000000, tasksRequired: 1000, streakRequired: 180 },
    };

    const requirements = RANK_UP_REQUIREMENTS[currentRank];
    if (!requirements) {
      return res.status(400).json({ message: 'Unknown rank' });
    }

    // Check if requirements are met
    const xpProgress = progression.total_xp % requirements.xpRequired;
    const tasksCompleted = progression.tasks_completed || 0;
    const currentStreak = progression.current_streak || 0;

    const meetsXpRequirement = xpProgress >= requirements.xpRequired;
    const meetsTaskRequirement = tasksCompleted >= requirements.tasksRequired;
    const meetsStreakRequirement = currentStreak >= requirements.streakRequired;

    // Check stat requirements (all stats must meet minimum)
    const statReqs = {
      F: 10, E: 20, D: 35, C: 30, B: 50, A: 70, 'A+': 85, S: 100
    };
    const minStatRequired = statReqs[currentRank] || 0;
    const allStatsMinMet = Object.values(stats).every(v => (parseInt(v) || 0) >= minStatRequired);

    if (!meetsXpRequirement || !meetsTaskRequirement || !meetsStreakRequirement || !allStatsMinMet) {
      return res.status(400).json({
        message: 'Rank-up requirements not met',
        requirements: {
          xp: { required: requirements.xpRequired, current: xpProgress, met: meetsXpRequirement },
          tasks: { required: requirements.tasksRequired, current: tasksCompleted, met: meetsTaskRequirement },
          streak: { required: requirements.streakRequired, current: currentStreak, met: meetsStreakRequirement },
          stats: { required: minStatRequired, met: allStatsMinMet },
        }
      });
    }

    // Update rank in progression
    const { rows: updateRows } = await pool.query(
      'UPDATE user_progression SET rank = $1 WHERE user_id = $2 RETURNING *',
      [nextRank, userId]
    );

    res.json({
      message: 'Rank up successful',
      previousRank: currentRank,
      newRank: nextRank,
      progression: updateRows[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
