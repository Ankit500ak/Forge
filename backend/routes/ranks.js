import express from 'express'
import { RANK_THRESHOLDS, getRankFromLevel } from '../utils/rank.js'
import { createClient } from '@supabase/supabase-js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

// Initialize Supabase client
let supabase = null
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Return rank thresholds for frontend to compute progress-to-next-rank
router.get('/thresholds', async (req, res) => {
  try {
    res.json({ thresholds: RANK_THRESHOLDS })
  } catch (err) {
    res.status(500).json({ message: 'Failed to return rank thresholds', error: err.message })
  }
})

// Get leaderboard with rankings - supports filtering by stat
// Query params: type (global|strength|speed|endurance|agility|power|recovery)
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const userId = req.userId
    const filterType = req.query.type || 'global'

    console.log(`[Ranks] Fetching leaderboard (${filterType}) for user: ${userId}`)

    // Fetch all users with their stats
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, name, level, total_xp')
      .order(filterType === 'global' ? 'total_xp' : filterType, { ascending: false })
      .limit(100)

    if (fetchError) {
      console.error('[Ranks] Error fetching users:', fetchError)
      return res.status(500).json({
        message: 'Failed to fetch leaderboard',
        error: fetchError.message
      })
    }

    // Get stats for all users
    const { data: allStats, error: statsError } = await supabase
      .from('user_stats')
      .select('user_id, strength, speed, endurance, agility, power, recovery')

    if (statsError) {
      console.error('[Ranks] Error fetching stats:', statsError)
      // Continue without stats if error
    }

    // Build stats map for quick lookup
    const statsMap = {}
    if (allStats) {
      allStats.forEach(stat => {
        statsMap[stat.user_id] = {
          strength: parseInt(stat.strength) || 0,
          speed: parseInt(stat.speed) || 0,
          endurance: parseInt(stat.endurance) || 0,
          agility: parseInt(stat.agility) || 0,
          power: parseInt(stat.power) || 0,
          recovery: parseInt(stat.recovery) || 0
        }
      })
    }

    // Enrich users with rank and stats
    const enrichedUsers = users.map((user, idx) => {
      const userStats = statsMap[user.id] || {
        strength: 0,
        speed: 0,
        endurance: 0,
        agility: 0,
        power: 0,
        recovery: 0
      }
      const rank = getRankFromLevel(user.level)
      return {
        id: user.id,
        name: user.name,
        level: user.level || 1,
        totalXP: user.total_xp || 0,
        rank: idx + 1,
        userRank: rank,
        strength: userStats.strength,
        speed: userStats.speed,
        endurance: userStats.endurance,
        agility: userStats.agility,
        power: userStats.power,
        recovery: userStats.recovery,
        statPoints: Math.max(
          userStats.strength,
          userStats.speed,
          userStats.endurance,
          userStats.agility,
          userStats.power,
          userStats.recovery
        )
      }
    })

    // Find current user's position
    const currentUserIdx = enrichedUsers.findIndex(u => u.id === userId)
    const currentUserRank = enrichedUsers[currentUserIdx] || {
      rank: enrichedUsers.length + 1,
      level: 1,
      totalXP: 0,
      userRank: 'F',
      statPoints: 0
    }

    console.log(`[Ranks] ✅ Leaderboard fetched. User rank: #${currentUserRank.rank}`)

    res.json({
      message: 'Leaderboard retrieved',
      rankings: enrichedUsers,
      currentUserRank,
      totalUsers: enrichedUsers.length
    })
  } catch (error) {
    console.error('[Ranks] Error:', error.message)
    res.status(500).json({
      message: 'Failed to fetch leaderboard',
      error: error.message
    })
  }
})

// Get user's rank position
router.get('/position/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, level, total_xp')
      .eq('id', targetUserId)
      .maybeSingle()

    if (userError || !user) {
      return res.status(404).json({
        message: 'User not found',
        error: userError?.message || 'UserNotFound'
      })
    }

    // Get all users ordered by XP
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, total_xp')
      .order('total_xp', { ascending: false })

    if (allUsersError) {
      return res.status(500).json({
        message: 'Failed to fetch ranking',
        error: allUsersError.message
      })
    }

    // Find position
    const position = allUsers.findIndex(u => u.id === targetUserId) + 1

    res.json({
      message: 'User rank position retrieved',
      userId: targetUserId,
      position,
      totalUsers: allUsers.length
    })
  } catch (error) {
    console.error('[Ranks] Error:', error.message)
    res.status(500).json({
      message: 'Failed to fetch user rank position',
      error: error.message
    })
  }
})

export default router
