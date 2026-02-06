import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { getRankForXp, RANK_THRESHOLDS } from '../utils/rank.js';
import { getLevelFromXp, getLevelProgress } from '../utils/level.js';
import { checkRankUp, getNextRankInfo } from '../utils/rankMonitor.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Protected route - Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user stats (6-stat system)
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('strength, speed, endurance, agility, power, recovery')
      .eq('user_id', userId)
      .single();

    const stats = statsData || {
      strength: 0,
      speed: 0,
      endurance: 0,
      agility: 0,
      power: 0,
      recovery: 0
    };

    res.json({
      message: 'User profile retrieved',
      user: data,
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

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;

    const { data, error } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

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
    console.log(`[Users] Fetching game data for user: ${userId}`);

    // Get progression - use maybeSingle() to handle when record doesn't exist
    const { data: progData, error: progError } = await supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (progError) {
      console.error('[Users] ❌ Error fetching progression:');
      console.error('  Message:', progError.message);
      console.error('  Code:', progError.code);
      console.error('  Details:', progError.details);
      console.error('  Hint:', progError.hint);
      
      // If it's RLS error (code 42501), provide helpful message
      if (progError.code === '42501') {
        return res.status(500).json({ 
          message: 'Database access denied (RLS enabled)',
          error: 'RLS_PERMISSION_DENIED',
          details: 'RLS is blocking access. It needs to be disabled in Supabase dashboard.',
          table: 'user_progression'
        });
      }
      
      return res.status(500).json({ message: 'Server error', error: progError.message });
    }

    const progression = progData || null;
    console.log(`[Users] Progression data:`, progression ? 'Found' : 'Not found');

    // Get stats - use maybeSingle() to handle when record doesn't exist
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsError) {
      console.error('[Users] ❌ Error fetching stats:');
      console.error('  Message:', statsError.message);
      console.error('  Code:', statsError.code);
      
      if (statsError.code === '42501') {
        return res.status(500).json({ 
          message: 'Database access denied (RLS enabled)',
          error: 'RLS_PERMISSION_DENIED',
          details: 'RLS is blocking access. It needs to be disabled in Supabase dashboard.',
          table: 'user_stats'
        });
      }
      // Don't block if stats error - return what we have
    }

    const stats = statsData || null;

    // Recalculate level from total XP (prestige-aware)
    if (progression) {
      const totalXp = Number(progression.total_xp || 0);
      const prestige = Number(progression.prestige || 0);
      const calculatedLevel = getLevelFromXp(totalXp, prestige);

      // Update level in Supabase if changed
      if (calculatedLevel !== progression.level) {
        await supabase
          .from('user_progression')
          .update({
            level: calculatedLevel,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        progression.level = calculatedLevel;
      }

      // Calculate level progress (XP towards next level)
      const levelProgress = getLevelProgress(totalXp, prestige);
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
      const currentThreshold = idx >= 0
        ? RANK_THRESHOLDS[idx]
        : RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];

      const nextThreshold = idx > 0 ? RANK_THRESHOLDS[idx - 1] : null;

      const pctToNext = nextThreshold
        ? Math.max(0, Math.min(100, Math.round(((total - currentThreshold.minXp) / (nextThreshold.minXp - currentThreshold.minXp)) * 100)))
        : 100;

      const projectedRank = getRankForXp(projected, prestige);
      const projectedIdx = RANK_THRESHOLDS.findIndex((t) => projected >= t.minXp);
      const projectedCurrent = projectedIdx >= 0
        ? RANK_THRESHOLDS[projectedIdx]
        : RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];

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
    console.error('[Users] Error fetching game data:', err);
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

    const { data: current, error: currError } = await supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (currError) {
      return res.status(500).json({ message: 'Server error', error: currError.message });
    }

    if (!current) {
      return res.status(404).json({ message: 'Progression not found' });
    }

    const currentXpToday = Math.max(0, Math.floor(Number(current.xp_today || 0)));
    const newXpToday = currentXpToday + xpGain;

    const { data: updated, error: updateError } = await supabase
      .from('user_progression')
      .update({
        xp_today: newXpToday,
        weekly_xp: (current.weekly_xp || 0) + xpGain,
        monthly_xp: (current.monthly_xp || 0) + xpGain,
        stat_points: (current.stat_points || 0) + statPointsGain,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Server error', error: updateError.message });
    }

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

    const { data: current, error: currError } = await supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (currError) {
      return res.status(500).json({ message: 'Server error', error: currError.message });
    }

    if (!current) {
      return res.status(404).json({ message: 'Progression not found' });
    }

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

    const { data: updated, error: updateError } = await supabase
      .from('user_progression')
      .update({
        total_xp: newTotal,
        xp_today: 0,
        level: newLevel,
        rank: newRank,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Server error', error: updateError.message });
    }

    console.log(`[Rollover] User ${userId}: xp_today ${xpToAdd} → total_xp = ${newTotal}. Level: ${current.level} → ${newLevel}`);

    res.json({
      message: 'Daily rollover complete',
      progression: updated,
      xpRolledOver: xpToAdd,
      newTotalXp: newTotal,
      levelChange: {
        old: current.level,
        new: newLevel
      },
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

    const { data: current, error: currError } = await supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (currError) {
      return res.status(500).json({ message: 'Server error', error: currError.message });
    }

    if (!current) {
      return res.status(404).json({ message: 'Progression not found' });
    }

    const total = Number(current.total_xp || 0);
    const prestige = Number(current.prestige || 0);
    const computedRank = getRankForXp(total, prestige);

    if (current.rank === computedRank) {
      return res.json({
        message: 'Rank already in sync',
        synced: false,
        progression: current
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from('user_progression')
      .update({
        rank: computedRank,
        last_active: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Server error', error: updateError.message });
    }

    res.json({
      message: 'Rank synced',
      synced: true,
      progression: updated
    });
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

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;

    const { data, error } = await supabase
      .from('users')
      .update(updateFields)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }

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
    const { data: allUsers, error } = await supabase
      .from('user_progression')
      .select('user_id, level, total_xp, users(name)')
      .order('total_xp', { ascending: false })
      .order('level', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    if (!allUsers || allUsers.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // Find current user's rank
    const userRankIndex = allUsers.findIndex(u => u.user_id === userId);
    const userGlobalRank = userRankIndex >= 0 ? userRankIndex + 1 : 999999;

    // Get top 10 for leaderboard display
    const topPlayers = allUsers.slice(0, 10).map((user, index) => ({
      rank: index + 1,
      name: user.users?.name || 'Anonymous',
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
    const { data: leaderboard, error } = await supabase
      .from('user_progression')
      .select('user_id, level, total_xp, users(name)')
      .order('total_xp', { ascending: false })
      .order('level', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }

    if (!leaderboard || leaderboard.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.json({
      message: 'Leaderboard retrieved',
      leaderboard,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Protected route - Manual rank-up (with validation)
router.post('/me/rank-up', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const { data: progression, error: progError } = await supabase
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progError) {
      return res.status(500).json({ message: 'Server error', error: progError.message });
    }

    if (!progression) {
      return res.status(404).json({ message: 'Progression not found' });
    }

    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    const statsObj = stats || {};

    // Get current rank from XP
    const currentRank = getRankForXp(progression.total_xp || 0, progression.prestige || 0);
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
      F: 10,
      E: 20,
      D: 35,
      C: 30,
      B: 50,
      A: 70,
      'A+': 85,
      S: 100
    };

    const minStatRequired = statReqs[currentRank] || 0;
    const allStatsMinMet = Object.values(statsObj).every(v => (parseInt(v) || 0) >= minStatRequired);

    if (!meetsXpRequirement || !meetsTaskRequirement || !meetsStreakRequirement || !allStatsMinMet) {
      return res.status(400).json({
        message: 'Rank-up requirements not met',
        requirements: {
          xp: {
            required: requirements.xpRequired,
            current: xpProgress,
            met: meetsXpRequirement
          },
          tasks: {
            required: requirements.tasksRequired,
            current: tasksCompleted,
            met: meetsTaskRequirement
          },
          streak: {
            required: requirements.streakRequired,
            current: currentStreak,
            met: meetsStreakRequirement
          },
          stats: {
            required: minStatRequired,
            met: allStatsMinMet
          },
        }
      });
    }

    // Update rank in progression
    const { data: updated, error: updateError } = await supabase
      .from('user_progression')
      .update({ rank: nextRank })
      .eq('user_id', userId)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Server error', error: updateError.message });
    }

    res.json({
      message: 'Rank-up successful',
      newRank: nextRank,
      progression: updated,
    });
  } catch (err) {
    console.error('[Rank-up] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;