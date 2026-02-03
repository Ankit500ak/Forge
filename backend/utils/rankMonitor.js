/**
 * Rank Monitoring System
 * Tracks and monitors rank changes, rank-ups, and progression
 * Provides logging, notifications, and rank history tracking
 */

import { getRankForXp, RANK_THRESHOLDS } from './rank.js';
import { getLevelFromXp } from './level.js';

// Rank progression history (in-memory for session, can be extended to DB)
const rankHistory = new Map(); // userId -> array of rank changes

// Rank tier ordering for comparison
const rankOrder = {
  'D': 1,
  'C': 2,
  'C+': 3,
  'B': 4,
  'B+': 5,
  'A': 6,
  'A+': 7,
  'S': 8,
  'S+': 9,
  'SS': 10,
  'SSS': 11,
};

/**
 * Check if user ranked up and return rank change info
 * @param {string} userId - User ID
 * @param {number} oldXp - Previous total XP
 * @param {number} newXp - New total XP
 * @param {number} prestige - User prestige level
 * @returns {object} Rank change info { ranked: boolean, oldRank, newRank, ranksDifference, timestamp }
 */
export function checkRankUp(userId, oldXp, newXp, prestige = 0) {
  const oldRank = getRankForXp(oldXp, prestige);
  const newRank = getRankForXp(newXp, prestige);

  const ranked = oldRank !== newRank;
  const rankDiff = rankOrder[newRank] - rankOrder[oldRank];

  const result = {
    ranked,
    oldRank,
    newRank,
    ranksDifference: rankDiff,
    xpGain: newXp - oldXp,
    timestamp: new Date().toISOString(),
  };

  if (ranked) {
    logRankChange(userId, result);
    recordRankHistory(userId, result);
  }

  return result;
}

/**
 * Get rank progression info for display
 * @param {number} totalXp - Total XP
 * @param {number} prestige - Prestige level
 * @returns {object} Current rank info with progress to next rank
 */
export function getRankInfo(totalXp, prestige = 0) {
  const xp = Number(totalXp || 0);
  const currentRank = getRankForXp(xp, prestige);
  const currentIdx = RANK_THRESHOLDS.findIndex((t) => currentRank === t.rank);

  if (currentIdx === -1) {
    return {
      rank: currentRank,
      level: 1,
      nextRank: null,
      xpInCurrentRank: 0,
      xpToNextRank: Infinity,
      percentToNext: 0,
    };
  }

  const current = RANK_THRESHOLDS[currentIdx];
  const next = currentIdx > 0 ? RANK_THRESHOLDS[currentIdx - 1] : null;

  // Calculate XP in current rank
  const rankStartXp = current.minXp;
  const xpInRank = xp - rankStartXp;

  // Calculate XP needed for next rank
  const xpToNextRank = next ? next.minXp - xp : Infinity;
  const totalXpForRank = next ? next.minXp - rankStartXp : Infinity;
  const percentToNext = next ? Math.max(0, Math.min(100, Math.round((xpInRank / (totalXpForRank - rankStartXp)) * 100))) : 100;

  const level = getLevelFromXp(xp, prestige);

  return {
    rank: currentRank,
    level,
    nextRank: next ? next.rank : null,
    xpInCurrentRank: Math.round(xpInRank),
    xpToNextRank: next ? Math.round(xpToNextRank) : 0,
    percentToNext,
    totalXp: xp,
    rankIndex: currentIdx,
  };
}

/**
 * Get all rank thresholds with progress info
 * @param {number} totalXp - Total XP
 * @param {number} prestige - Prestige level
 * @returns {array} Array of all ranks with unlock status and XP required
 */
export function getRankProgression(totalXp, prestige = 0) {
  const xp = Number(totalXp || 0);
  const currentRank = getRankForXp(xp, prestige);

  return RANK_THRESHOLDS.map((t, idx) => {
    const minXp = t.minXp || 0;
    const isUnlocked = xp >= minXp;
    const nextThreshold = idx < RANK_THRESHOLDS.length - 1 ? RANK_THRESHOLDS[idx + 1] : null;
    const xpToUnlock = Math.max(0, minXp - xp);

    return {
      rank: t.rank,
      level: t.level,
      minXp,
      isUnlocked,
      isCurrent: t.rank === currentRank,
      xpToUnlock,
      xpRequired: minXp,
    };
  });
}

/**
 * Log rank change with detailed info
 * @private
 */
function logRankChange(userId, rankInfo) {
  const { oldRank, newRank, ranksDifference, xpGain, timestamp } = rankInfo;

  const direction = ranksDifference > 0 ? '⬆️ RANK UP' : '⬇️ RANK DOWN';
  const rankJump = Math.abs(ranksDifference) > 1 ? ` (+${Math.abs(ranksDifference)} ranks!)` : '';

  console.log(
    `\n[RANK MONITOR] ${direction}${rankJump}`,
    `\n  User: ${userId}`,
    `\n  ${oldRank} → ${newRank}`,
    `\n  XP Gained: +${xpGain}`,
    `\n  Time: ${timestamp}\n`
  );
}

/**
 * Record rank change in history
 * @private
 */
function recordRankHistory(userId, rankInfo) {
  if (!rankHistory.has(userId)) {
    rankHistory.set(userId, []);
  }

  rankHistory.get(userId).push({
    ...rankInfo,
    recordedAt: new Date(),
  });

  // Keep only last 50 records per user to avoid memory bloat
  const history = rankHistory.get(userId);
  if (history.length > 50) {
    history.shift();
  }
}

/**
 * Get rank history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Max records to return
 * @returns {array} Array of rank change records
 */
export function getRankHistory(userId, limit = 10) {
  const history = rankHistory.get(userId) || [];
  return history.slice(-limit).reverse();
}

/**
 * Get rank statistics across all monitored users
 * @returns {object} Statistics about rank changes
 */
export function getRankStats() {
  let totalRankUps = 0;
  let userCount = rankHistory.size;
  const rankUpsPerRank = {};

  RANK_THRESHOLDS.forEach((t) => {
    rankUpsPerRank[t.rank] = 0;
  });

  rankHistory.forEach((history) => {
    history.forEach((record) => {
      if (record.ranked) {
        totalRankUps++;
        rankUpsPerRank[record.newRank] = (rankUpsPerRank[record.newRank] || 0) + 1;
      }
    });
  });

  return {
    totalUsers: userCount,
    totalRankUps,
    rankUpsPerRank,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Clear rank history for a user (for testing)
 * @param {string} userId - User ID, or null to clear all
 */
export function clearRankHistory(userId = null) {
  if (userId) {
    rankHistory.delete(userId);
    console.log(`[RANK MONITOR] Cleared history for user ${userId}`);
  } else {
    rankHistory.clear();
    console.log(`[RANK MONITOR] Cleared all rank histories`);
  }
}

/**
 * Get next rank info for a user
 * @param {number} totalXp - Total XP
 * @param {number} prestige - Prestige level
 * @returns {object} Next rank info with XP needed
 */
export function getNextRankInfo(totalXp, prestige = 0) {
  const xp = Number(totalXp || 0);
  const currentRank = getRankForXp(xp, prestige);
  const currentIdx = RANK_THRESHOLDS.findIndex((t) => currentRank === t.rank);

  if (currentIdx === -1 || currentIdx === 0) {
    return { nextRank: null, xpNeeded: Infinity };
  }

  const nextThreshold = RANK_THRESHOLDS[currentIdx - 1];
  const xpNeeded = Math.max(0, nextThreshold.minXp - xp);

  return {
    nextRank: nextThreshold.rank,
    nextLevel: nextThreshold.level,
    xpNeeded,
    currentXp: xp,
  };
}

/**
 * Get XP breakdown for current rank progression
 * @param {number} totalXp - Total XP
 * @param {number} prestige - Prestige level
 * @returns {object} Detailed breakdown of rank progression
 */
export function getRankXpBreakdown(totalXp, prestige = 0) {
  const xp = Number(totalXp || 0);
  const currentRank = getRankForXp(xp, prestige);
  const currentIdx = RANK_THRESHOLDS.findIndex((t) => currentRank === t.rank);

  if (currentIdx === -1) {
    return null;
  }

  const current = RANK_THRESHOLDS[currentIdx];
  const next = currentIdx > 0 ? RANK_THRESHOLDS[currentIdx - 1] : null;
  const prev = currentIdx < RANK_THRESHOLDS.length - 1 ? RANK_THRESHOLDS[currentIdx + 1] : null;

  return {
    rank: currentRank,
    currentXp: xp,
    rankStartXp: current.minXp,
    rankEndXp: next ? next.minXp : Infinity,
    xpInRank: xp - current.minXp,
    xpUntilNext: next ? Math.max(0, next.minXp - xp) : Infinity,
    prevRank: prev ? prev.rank : null,
    prevRankXp: prev ? prev.minXp : null,
    nextRank: next ? next.rank : null,
    nextRankXp: next ? next.minXp : null,
  };
}

export default {
  checkRankUp,
  getRankInfo,
  getRankProgression,
  getRankHistory,
  getRankStats,
  clearRankHistory,
  getNextRankInfo,
  getRankXpBreakdown,
};
