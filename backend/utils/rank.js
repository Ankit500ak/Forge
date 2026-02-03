// Rank thresholds based on LEVELS
// Complete rank system: F → E → E+ → D → D+ → C → C+ → B → B+ → B++ → A → A+ → S → S+ → S++ → SS → SS+ → Monarch
// 20 levels per rank gap for balanced progression
// S Rank at level 240, SS+ at level 320, Monarch (ULTIMATE) at level 340

import { generateLevelThresholds } from './level.js';

// RANK CONFIG - Direct level-based rank system
const RANK_CONFIG = {
  LEVEL_PER_RANK: 10,              // Each rank covers 10 levels
  PRESTIGE_MULTIPLIER: 0.5,        // Each prestige adds 50% XP requirement per level
};

// Helper function to calculate XP needed for a specific level at prestige 0
export function getXpForLevel(level, prestige = 0) {
  const thresholds = generateLevelThresholds(prestige);
  if (level <= 1) return 0;
  const maxLevel = Math.max(...Object.keys(thresholds).map(Number));
  if (level > maxLevel) return thresholds[maxLevel];
  return thresholds[level] || 0;
}

/**
 * Direct mapping: Level → Rank
 * Complete rank progression: F → E → E+ → D → D+ → C → C+ → B → B+ → B++ → A → A+ → S → S+ → S++ → SS → SS+ → Monarch
 * 20 levels per rank for consistent difficulty gap
 * S Rank at level 260, SS+ at level 320, Monarch (maximum) at level 340
 */
export function getRankFromLevel(level) {
  const lvl = Math.max(1, Math.floor(Number(level || 1)));
  
  // Define rank tiers - Complete system F to Monarch
  const rankTiers = [
    { rank: 'F', minLevel: 1, maxLevel: 19 },       // Levels 1-19
    { rank: 'E', minLevel: 20, maxLevel: 39 },      // Levels 20-39
    { rank: 'E+', minLevel: 40, maxLevel: 59 },     // Levels 40-59
    { rank: 'D', minLevel: 60, maxLevel: 79 },      // Levels 60-79
    { rank: 'D+', minLevel: 80, maxLevel: 99 },     // Levels 80-99
    { rank: 'C', minLevel: 100, maxLevel: 119 },    // Levels 100-119
    { rank: 'C+', minLevel: 120, maxLevel: 139 },   // Levels 120-139
    { rank: 'B', minLevel: 140, maxLevel: 159 },    // Levels 140-159
    { rank: 'B+', minLevel: 160, maxLevel: 179 },   // Levels 160-179
    { rank: 'B++', minLevel: 180, maxLevel: 199 },  // Levels 180-199
    { rank: 'A', minLevel: 200, maxLevel: 219 },    // Levels 200-219
    { rank: 'A+', minLevel: 220, maxLevel: 239 },   // Levels 220-239
    { rank: 'S', minLevel: 240, maxLevel: 259 },    // Levels 240-259
    { rank: 'S+', minLevel: 260, maxLevel: 279 },   // Levels 260-279
    { rank: 'S++', minLevel: 280, maxLevel: 299 },  // Levels 280-299
    { rank: 'SS', minLevel: 300, maxLevel: 319 },   // Levels 300-319
    { rank: 'SS+', minLevel: 320, maxLevel: 339 },  // Levels 320-339
    { rank: 'Monarch', minLevel: 340, maxLevel: 999 }, // Levels 340+ (ULTIMATE)
  ];

  // Find matching rank tier
  for (const tier of rankTiers) {
    if (lvl >= tier.minLevel && lvl <= tier.maxLevel) {
      return tier.rank;
    }
  }

  return 'F'; // Default
}

/**
 * Get all rank thresholds with level-based system
 * Complete progression: 18 ranks total F → E → E+ → D → D+ → C → C+ → B → B+ → B++ → A → A+ → S → S+ → S++ → SS → SS+ → Monarch
 * 20 levels per rank (consistent difficulty gap)
 * Ultimate rank: Monarch (level 340+)
 */
export function generateRankThresholds(prestige = 0) {
  const rankTiers = [
    { rank: 'F', minLevel: 1, maxLevel: 19 },       // Levels 1-19
    { rank: 'E', minLevel: 20, maxLevel: 39 },      // Levels 20-39
    { rank: 'E+', minLevel: 40, maxLevel: 59 },     // Levels 40-59
    { rank: 'D', minLevel: 60, maxLevel: 79 },      // Levels 60-79
    { rank: 'D+', minLevel: 80, maxLevel: 99 },     // Levels 80-99
    { rank: 'C', minLevel: 100, maxLevel: 119 },    // Levels 100-119
    { rank: 'C+', minLevel: 120, maxLevel: 139 },   // Levels 120-139
    { rank: 'B', minLevel: 140, maxLevel: 159 },    // Levels 140-159
    { rank: 'B+', minLevel: 160, maxLevel: 179 },   // Levels 160-179
    { rank: 'B++', minLevel: 180, maxLevel: 199 },  // Levels 180-199
    { rank: 'A', minLevel: 200, maxLevel: 219 },    // Levels 200-219
    { rank: 'A+', minLevel: 220, maxLevel: 239 },   // Levels 220-239
    { rank: 'S', minLevel: 240, maxLevel: 259 },    // Levels 240-259
    { rank: 'S+', minLevel: 260, maxLevel: 279 },   // Levels 260-279
    { rank: 'S++', minLevel: 280, maxLevel: 299 },  // Levels 280-299
    { rank: 'SS', minLevel: 300, maxLevel: 319 },   // Levels 300-319
    { rank: 'SS+', minLevel: 320, maxLevel: 339 },  // Levels 320-339
    { rank: 'Monarch', minLevel: 340, maxLevel: 999 }, // Levels 340+ (ULTIMATE)
  ];

  return rankTiers.map((t, idx) => ({
    ...t,
    rankIndex: idx,
    minXp: getXpForLevel(t.minLevel, prestige),
    midXp: getXpForLevel(Math.floor((t.minLevel + Math.min(t.maxLevel, 339)) / 2), prestige),
    maxXp: getXpForLevel(Math.min(t.maxLevel, 339), prestige),
  }));
}
    
 

// Legacy RANK_THRESHOLDS for backward compatibility (prestige 0)
export const RANK_THRESHOLDS = generateRankThresholds(0);

export function getRankForXp(totalXp = 0, prestige = 0) {
  const xp = Number(totalXp || 0);
  const thresholds = generateLevelThresholds(prestige);
  
  // Find the highest level the user can achieve with their XP
  let userLevel = 1;
  const levelNumbers = Object.keys(thresholds).map(Number).sort((a, b) => a - b);
  
  for (const level of levelNumbers) {
    if (xp >= thresholds[level]) {
      userLevel = level;
    } else {
      break;
    }
  }

  // Get rank from level
  return getRankFromLevel(userLevel);
}

export default { getRankForXp, getRankFromLevel, generateRankThresholds, RANK_CONFIG }
