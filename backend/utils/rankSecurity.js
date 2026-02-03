/**
 * Rank Security System
 * Validates rank progression and prevents rank manipulation
 * Ensures exponential XP requirements for ranks
 */

import { getRankForXp, generateRankThresholds, getXpRequiredForRank } from './rank.js';

/**
 * Validate user's rank against their XP
 * Returns correction info if rank doesn't match XP
 */
export function validateRankAgainstXp(currentRank, totalXp, prestige = 0) {
  const xp = Number(totalXp || 0);
  const calculatedRank = getRankForXp(xp, prestige);

  const isValid = currentRank === calculatedRank;

  return {
    isValid,
    currentRank,
    calculatedRank,
    totalXp: xp,
    prestige,
    needsCorrection: !isValid,
    correction: !isValid ? {
      from: currentRank,
      to: calculatedRank,
      reason: `Rank mismatch: XP ${xp} corresponds to ${calculatedRank}, not ${currentRank}`,
    } : null,
  };
}

/**
 * Get rank progression chain with security info
 */
export function getRankSecurityChain(totalXp, prestige = 0) {
  const xp = Number(totalXp || 0);
  const thresholds = generateRankThresholds(prestige);

  return {
    totalXp: xp,
    prestige,
    timestamp: new Date().toISOString(),
    ranks: thresholds.map((t, idx) => ({
      rank: t.rank,
      level: t.level,
      rankIndex: idx,
      xpRequired: t.minXp,
      isUnlocked: xp >= t.minXp,
      xpToUnlock: Math.max(0, t.minXp - xp),
      percentProgress: Math.max(0, Math.min(100, Math.round(((xp - t.minXp) / (thresholds[idx + 1]?.minXp - t.minXp || 1)) * 100))),
    })),
  };
}

/**
 * Calculate XP difference for security audit
 */
export function auditXpProgression(userId, currentXp, previousXp, gainedXp) {
  const expected = previousXp + gainedXp;
  const xpMatches = currentXp === expected;

  return {
    userId,
    previousXp,
    gainedXp,
    expected,
    actual: currentXp,
    xpMatches,
    discrepancy: currentXp - expected,
    audit: {
      passed: xpMatches,
      status: xpMatches ? 'VALID' : 'ALERT',
      reason: xpMatches ? 'XP progression valid' : `XP mismatch: Expected ${expected}, got ${currentXp}`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get next rank requirements with security breakdown
 */
export function getNextRankRequirements(totalXp, prestige = 0) {
  const xp = Number(totalXp || 0);
  const thresholds = generateRankThresholds(prestige);

  // Find current rank index
  let currentIdx = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i].minXp) {
      currentIdx = i;
      break;
    }
  }

  const current = thresholds[currentIdx];
  const next = currentIdx < thresholds.length - 1 ? thresholds[currentIdx + 1] : null;

  if (!next) {
    return {
      rank: current.rank,
      level: current.level,
      nextRank: null,
      nextLevel: null,
      currentXp: xp,
      xpAtCurrentRank: current.minXp,
      xpForNextRank: null,
      xpNeeded: 0,
      isMaxRank: true,
      percentToNext: 100,
    };
  }

  const xpGap = next.minXp - current.minXp;
  const xpInRank = xp - current.minXp;
  const xpNeeded = Math.max(0, next.minXp - xp);

  return {
    rank: current.rank,
    level: current.level,
    nextRank: next.rank,
    nextLevel: next.level,
    currentXp: xp,
    xpAtCurrentRank: current.minXp,
    xpForNextRank: next.minXp,
    xpInCurrentRank: xpInRank,
    xpNeeded,
    xpGap,
    percentToNext: Math.round((xpInRank / xpGap) * 100),
    isMaxRank: false,
    security: {
      minXpRequired: next.minXp,
      difficulty: 'Exponential (1.5x multiplier)',
      prestigeAdjusted: prestige > 0,
      prestigeMultiplier: prestige > 0 ? `+${prestige * 50}%` : 'None',
    },
  };
}

/**
 * Verify rank transition is legitimate
 */
export function verifyRankTransition(oldRank, newRank, xpBefore, xpAfter, prestige = 0) {
  const xpBefore_num = Number(xpBefore || 0);
  const xpAfter_num = Number(xpAfter || 0);

  const calculatedOldRank = getRankForXp(xpBefore_num, prestige);
  const calculatedNewRank = getRankForXp(xpAfter_num, prestige);

  const oldRankValid = oldRank === calculatedOldRank;
  const newRankValid = newRank === calculatedNewRank;
  const xpIncreased = xpAfter_num >= xpBefore_num;

  return {
    isLegitimate: oldRankValid && newRankValid && xpIncreased,
    verification: {
      oldRankMatches: oldRankValid,
      newRankMatches: newRankValid,
      xpProgression: xpIncreased ? 'VALID' : 'INVALID',
    },
    details: {
      oldRank: { provided: oldRank, calculated: calculatedOldRank },
      newRank: { provided: newRank, calculated: calculatedNewRank },
      xp: { before: xpBefore_num, after: xpAfter_num, delta: xpAfter_num - xpBefore_num },
    },
    alerts: [
      !oldRankValid ? `Old rank mismatch: ${oldRank} vs calculated ${calculatedOldRank}` : null,
      !newRankValid ? `New rank mismatch: ${newRank} vs calculated ${calculatedNewRank}` : null,
      !xpIncreased ? `XP decreased: ${xpBefore_num} → ${xpAfter_num}` : null,
    ].filter(Boolean),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate rank difficulty report
 */
export function getRankDifficultyReport(prestige = 0) {
  const thresholds = generateRankThresholds(prestige);

  const report = {
    prestige,
    timestamp: new Date().toISOString(),
    config: {
      baseXp: 100000,
      exponent: 1.5,
      prestigeMultiplier: prestige > 0 ? `+${prestige * 50}%` : 'None',
    },
    ranks: thresholds.map((t, idx) => {
      const next = idx < thresholds.length - 1 ? thresholds[idx + 1] : null;
      const xpGap = next ? next.minXp - t.minXp : 0;
      const difficulty = next ? (xpGap / (t.minXp || 1) * 100).toFixed(1) : 'MAX';

      return {
        rank: t.rank,
        level: t.level,
        xpRequired: t.minXp,
        nextRankXp: next?.minXp || 'FINAL',
        xpGap: xpGap,
        difficultyIncrease: difficulty + '%',
      };
    }),
    summary: {
      totalRanks: thresholds.length,
      xpToMaxRank: thresholds[thresholds.length - 1].minXp,
      estimatedHours: Math.round(thresholds[thresholds.length - 1].minXp / 1000), // Rough estimate
    },
  };

  return report;
}

export default {
  validateRankAgainstXp,
  getRankSecurityChain,
  auditXpProgression,
  getNextRankRequirements,
  verifyRankTransition,
  getRankDifficultyReport,
};
