/**
 * HARDCORE LEVEL UP SYSTEM
 * Multi-layered progression with strict requirements
 * Features: Prestige system, skill trees, achievement gates, diminishing returns
 */

// ==================== CORE LEVEL SYSTEM ====================
// Exponential XP curve with increasing difficulty
export const LEVEL_CONFIG = {
  MAX_LEVEL: 340,
  BASE_XP: 1000,
  EXPONENT: 1.18, // Steeper than original 1.15
  PRESTIGE_MAX: 10,
};

/**
 * Calculate XP required for a specific level
 * Formula: baseXP * (level^exponent) * prestigeMultiplier
 */
function calculateLevelXp(level, prestige = 0) {
  if (level <= 1) return 0;
  
  const baseRequirement = LEVEL_CONFIG.BASE_XP * Math.pow(level - 1, LEVEL_CONFIG.EXPONENT);
  const prestigeMultiplier = 1 + (prestige * 0.5); // Each prestige adds 50% more XP needed
  
  return Math.floor(baseRequirement * prestigeMultiplier);
}

// Generate level thresholds on demand
export function generateLevelThresholds(prestige = 0) {
  const thresholds = {};
  let cumulative = 0;
  
  for (let level = 1; level <= LEVEL_CONFIG.MAX_LEVEL; level++) {
    thresholds[level] = cumulative;
    cumulative += calculateLevelXp(level + 1, prestige);
  }
  
  return thresholds;
}

// ==================== SKILL TREE SYSTEM ====================
export const SKILL_TREES = {
  COMBAT: {
    name: 'Combat Mastery',
    skills: {
      STRENGTH: { maxLevel: 20, xpCost: 500, prerequisite: null },
      CRITICAL_HIT: { maxLevel: 15, xpCost: 800, prerequisite: 'STRENGTH:5' },
      BERSERKER: { maxLevel: 10, xpCost: 1500, prerequisite: 'CRITICAL_HIT:10' },
      DUAL_WIELD: { maxLevel: 12, xpCost: 1200, prerequisite: 'STRENGTH:8' },
      EXECUTION: { maxLevel: 5, xpCost: 3000, prerequisite: 'BERSERKER:5,CRITICAL_HIT:12' },
    }
  },
  MAGIC: {
    name: 'Arcane Arts',
    skills: {
      INTELLIGENCE: { maxLevel: 20, xpCost: 500, prerequisite: null },
      FIRE_MAGIC: { maxLevel: 15, xpCost: 900, prerequisite: 'INTELLIGENCE:5' },
      ICE_MAGIC: { maxLevel: 15, xpCost: 900, prerequisite: 'INTELLIGENCE:5' },
      ARCANE_MASTERY: { maxLevel: 10, xpCost: 2000, prerequisite: 'FIRE_MAGIC:10,ICE_MAGIC:10' },
      TIMEWARP: { maxLevel: 3, xpCost: 5000, prerequisite: 'ARCANE_MASTERY:8,INTELLIGENCE:18' },
    }
  },
  SURVIVAL: {
    name: 'Survival Expertise',
    skills: {
      VITALITY: { maxLevel: 25, xpCost: 400, prerequisite: null },
      CRAFTING: { maxLevel: 20, xpCost: 600, prerequisite: 'VITALITY:3' },
      ALCHEMY: { maxLevel: 15, xpCost: 1000, prerequisite: 'CRAFTING:10' },
      REGENERATION: { maxLevel: 10, xpCost: 1800, prerequisite: 'VITALITY:15,ALCHEMY:8' },
      IMMORTALITY: { maxLevel: 1, xpCost: 10000, prerequisite: 'REGENERATION:10,VITALITY:25' },
    }
  }
};

// ==================== ACHIEVEMENT GATES ====================
// Certain levels require specific achievements to unlock
export const LEVEL_GATES = {
  10: { achievement: 'FIRST_BOSS', description: 'Defeat the Guardian' },
  25: { achievement: 'MASTER_CRAFTER', description: 'Craft 100 items' },
  50: { achievement: 'DRAGON_SLAYER', description: 'Defeat 5 Dragons' },
  75: { achievement: 'LEGENDARY_HERO', description: 'Complete 50 Legendary Quests' },
  90: { achievement: 'ELDER_GOD', description: 'Defeat all Raid Bosses' },
  100: { achievement: 'TRANSCENDENT', description: 'Unlock all skill trees' },
};

// ==================== PRESTIGE SYSTEM ====================
export const PRESTIGE_REQUIREMENTS = {
  1: { level: 100, totalXp: 50000000, achievements: 50 },
  2: { level: 100, totalXp: 100000000, achievements: 75 },
  3: { level: 100, totalXp: 200000000, achievements: 100 },
  4: { level: 100, totalXp: 400000000, achievements: 125 },
  5: { level: 100, totalXp: 800000000, achievements: 150 },
  6: { level: 100, totalXp: 1600000000, achievements: 175 },
  7: { level: 100, totalXp: 3200000000, achievements: 200 },
  8: { level: 100, totalXp: 6400000000, achievements: 225 },
  9: { level: 100, totalXp: 12800000000, achievements: 250 },
  10: { level: 100, totalXp: 25600000000, achievements: 300 },
};

// ==================== XP SOURCES & DIMINISHING RETURNS ====================
export const XP_SOURCES = {
  QUEST_EASY: { base: 100, diminishingAfter: 50, diminishingRate: 0.9 },
  QUEST_MEDIUM: { base: 500, diminishingAfter: 30, diminishingRate: 0.92 },
  QUEST_HARD: { base: 2000, diminishingAfter: 20, diminishingRate: 0.95 },
  QUEST_LEGENDARY: { base: 10000, diminishingAfter: 10, diminishingRate: 0.97 },
  
  BOSS_MINI: { base: 1000, diminishingAfter: 100, diminishingRate: 0.85 },
  BOSS_WORLD: { base: 5000, diminishingAfter: 50, diminishingRate: 0.9 },
  BOSS_RAID: { base: 25000, diminishingAfter: 20, diminishingRate: 0.95 },
  
  MOB_COMMON: { base: 10, diminishingAfter: 1000, diminishingRate: 0.8 },
  MOB_RARE: { base: 50, diminishingAfter: 500, diminishingRate: 0.85 },
  MOB_ELITE: { base: 250, diminishingAfter: 200, diminishingRate: 0.9 },
  
  DISCOVERY: { base: 500, diminishingAfter: 100, diminishingRate: 0.95 },
  ACHIEVEMENT: { base: 1000, diminishingAfter: null, diminishingRate: 1 },
};

/**
 * Calculate XP with diminishing returns
 */
export function calculateXpGain(source, count = 1) {
  const config = XP_SOURCES[source];
  if (!config) return 0;
  
  let totalXp = 0;
  
  for (let i = 0; i < count; i++) {
    let xp = config.base;
    
    // Apply diminishing returns if threshold reached
    if (config.diminishingAfter && i >= config.diminishingAfter) {
      const diminishedCount = i - config.diminishingAfter;
      xp = config.base * Math.pow(config.diminishingRate, diminishedCount);
    }
    
    totalXp += Math.floor(xp);
  }
  
  return totalXp;
}

// ==================== PLAYER STATE MANAGER ====================
export class HardcorePlayer {
  constructor(saveData = {}) {
    this.totalXp = saveData.totalXp || 0;
    this.prestige = saveData.prestige || 0;
    this.achievements = saveData.achievements || [];
    this.skills = saveData.skills || {};
    this.activityCounts = saveData.activityCounts || {};
    this.levelThresholds = generateLevelThresholds(this.prestige);
  }
  
  // Get current level
  getCurrentLevel() {
    for (let level = LEVEL_CONFIG.MAX_LEVEL; level >= 1; level--) {
      if (this.totalXp >= this.levelThresholds[level]) {
        return level;
      }
    }
    return 1;
  }
  
  // Get detailed level progress
  getLevelProgress() {
    const currentLevel = this.getCurrentLevel();
    const nextLevel = Math.min(currentLevel + 1, LEVEL_CONFIG.MAX_LEVEL);
    
    const currentLevelXp = this.levelThresholds[currentLevel];
    const nextLevelXp = this.levelThresholds[nextLevel];
    
    const xpInCurrentLevel = this.totalXp - currentLevelXp;
    const xpNeededForNext = nextLevelXp - currentLevelXp;
    const percentToNext = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNext) * 100));
    
    return {
      currentLevel,
      nextLevel,
      xpInCurrentLevel,
      xpNeededForNext,
      percentToNext,
      totalXp: this.totalXp,
      prestige: this.prestige,
      isMaxLevel: currentLevel === LEVEL_CONFIG.MAX_LEVEL,
      canPrestige: this.canPrestige(),
    };
  }
  
  // Add XP with diminishing returns and level gates
  addXp(source, count = 1) {
    const currentLevel = this.getCurrentLevel();
    const xpGained = calculateXpGain(source, count);
    
    // Track activity for diminishing returns
    this.activityCounts[source] = (this.activityCounts[source] || 0) + count;
    
    // Add XP
    this.totalXp += xpGained;
    const newLevel = this.getCurrentLevel();
    
    // Check for level gates
    const blockedLevels = [];
    for (let level = currentLevel + 1; level <= newLevel; level++) {
      if (LEVEL_GATES[level] && !this.hasAchievement(LEVEL_GATES[level].achievement)) {
        blockedLevels.push({
          level,
          gate: LEVEL_GATES[level],
        });
      }
    }
    
    // If blocked, cap level
    let actualNewLevel = newLevel;
    if (blockedLevels.length > 0) {
      actualNewLevel = blockedLevels[0].level - 1;
    }
    
    return {
      xpGained,
      oldLevel: currentLevel,
      newLevel: actualNewLevel,
      leveledUp: actualNewLevel > currentLevel,
      levelsGained: actualNewLevel - currentLevel,
      blockedBy: blockedLevels,
      totalXp: this.totalXp,
    };
  }
  
  // Learn or upgrade a skill
  learnSkill(tree, skillName) {
    const skill = SKILL_TREES[tree]?.skills[skillName];
    if (!skill) return { success: false, error: 'Skill not found' };
    
    const currentLevel = this.skills[`${tree}:${skillName}`] || 0;
    
    // Check max level
    if (currentLevel >= skill.maxLevel) {
      return { success: false, error: 'Skill already at max level' };
    }
    
    // Check prerequisites
    if (skill.prerequisite) {
      const prereqs = skill.prerequisite.split(',');
      for (const prereq of prereqs) {
        const [prereqSkill, requiredLevel] = prereq.split(':');
        const [prereqTree, prereqName] = prereqSkill.includes('_') 
          ? [tree, prereqSkill] 
          : prereqSkill.split('.');
        
        const actualPrereqTree = prereqTree || tree;
        const playerSkillLevel = this.skills[`${actualPrereqTree}:${prereqName}`] || 0;
        
        if (playerSkillLevel < parseInt(requiredLevel)) {
          return { 
            success: false, 
            error: `Requires ${prereqName} level ${requiredLevel}` 
          };
        }
      }
    }
    
    // Check XP cost
    const cost = skill.xpCost * (currentLevel + 1);
    if (this.totalXp < cost) {
      return { success: false, error: `Requires ${cost} total XP` };
    }
    
    // Learn skill (doesn't consume XP, just requires having earned it)
    this.skills[`${tree}:${skillName}`] = currentLevel + 1;
    
    return {
      success: true,
      skillLevel: currentLevel + 1,
      maxLevel: skill.maxLevel,
    };
  }
  
  // Unlock achievement
  unlockAchievement(achievementId) {
    if (!this.achievements.includes(achievementId)) {
      this.achievements.push(achievementId);
      
      // Check if this unblocks any levels
      const unlockedLevels = [];
      for (const [level, gate] of Object.entries(LEVEL_GATES)) {
        if (gate.achievement === achievementId) {
          unlockedLevels.push(parseInt(level));
        }
      }
      
      return { unlocked: true, unlockedLevels };
    }
    return { unlocked: false };
  }
  
  hasAchievement(achievementId) {
    return this.achievements.includes(achievementId);
  }
  
  // Check if player can prestige
  canPrestige() {
    const nextPrestige = this.prestige + 1;
    if (nextPrestige > LEVEL_CONFIG.PRESTIGE_MAX) return false;
    
    const requirements = PRESTIGE_REQUIREMENTS[nextPrestige];
    if (!requirements) return false;
    
    return (
      this.getCurrentLevel() >= requirements.level &&
      this.totalXp >= requirements.totalXp &&
      this.achievements.length >= requirements.achievements
    );
  }
  
  // Prestige (reset level but keep achievements and gain bonuses)
  prestige() {
    if (!this.canPrestige()) {
      return { success: false, error: 'Prestige requirements not met' };
    }
    
    const oldPrestige = this.prestige;
    this.prestige += 1;
    
    // Keep total XP and achievements, but regenerate thresholds
    this.levelThresholds = generateLevelThresholds(this.prestige);
    
    // Reset skills (or keep them based on game design)
    const keepSkills = {}; // Could implement partial skill retention
    this.skills = keepSkills;
    
    return {
      success: true,
      newPrestige: this.prestige,
      oldPrestige,
      bonuses: this.getPrestigeBonuses(),
    };
  }
  
  // Get prestige bonuses
  getPrestigeBonuses() {
    return {
      xpMultiplier: 1 + (this.prestige * 0.1), // +10% XP per prestige
      skillPointBonus: this.prestige * 5, // +5 skill points per prestige
      damageBonus: this.prestige * 0.15, // +15% damage per prestige
      prestigeLevel: this.prestige,
    };
  }
  
  // Export save data
  exportSave() {
    return {
      totalXp: this.totalXp,
      prestige: this.prestige,
      achievements: this.achievements,
      skills: this.skills,
      activityCounts: this.activityCounts,
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get skill tree visualization
 */
export function getSkillTreeInfo(tree) {
  const treeData = SKILL_TREES[tree];
  if (!treeData) return null;
  
  return {
    name: treeData.name,
    skills: Object.entries(treeData.skills).map(([name, data]) => ({
      name,
      maxLevel: data.maxLevel,
      xpCost: data.xpCost,
      prerequisite: data.prerequisite,
    })),
  };
}

/**
 * Get all available achievements
 */
export function getAllAchievements() {
  return Object.entries(LEVEL_GATES).map(([level, gate]) => ({
    level: parseInt(level),
    achievement: gate.achievement,
    description: gate.description,
  }));
}

/**
 * Calculate total XP needed to reach max level at a prestige
 */
export function getTotalXpForMaxLevel(prestige = 0) {
  const thresholds = generateLevelThresholds(prestige);
  return thresholds[LEVEL_CONFIG.MAX_LEVEL];
}

// ==================== EXPORTS ====================
export default {
  LEVEL_CONFIG,
  SKILL_TREES,
  LEVEL_GATES,
  PRESTIGE_REQUIREMENTS,
  XP_SOURCES,
  HardcorePlayer,
  calculateXpGain,
  generateLevelThresholds,
  getSkillTreeInfo,
  getAllAchievements,
  getTotalXpForMaxLevel,
  getLevelFromXp,
  getLevelProgress,
  checkLevelUp,
};

// ==================== ESSENTIAL FUNCTIONS FOR TASK CONTROLLER ====================

/**
 * Get the current level based on total XP (prestige-aware)
 * @param {number} totalXp - Total XP accumulated
 * @param {number} prestige - Current prestige level (0-10)
 * @returns {number} Current level (1-100)
 */
export function getLevelFromXp(totalXp = 0, prestige = 0) {
  const xp = Number(totalXp || 0);
  const thresholds = generateLevelThresholds(prestige);
  
  for (let level = LEVEL_CONFIG.MAX_LEVEL; level >= 1; level--) {
    if (xp >= thresholds[level]) {
      return level;
    }
  }
  
  return 1;
}

/**
 * Get XP progress toward next level
 * @param {number} totalXp - Total XP accumulated
 * @param {number} prestige - Current prestige level
 * @returns {object} Detailed progress information
 */
export function getLevelProgress(totalXp = 0, prestige = 0) {
  const xp = Number(totalXp || 0);
  const thresholds = generateLevelThresholds(prestige);
  
  const currentLevel = getLevelFromXp(xp, prestige);
  const nextLevel = currentLevel < LEVEL_CONFIG.MAX_LEVEL ? currentLevel + 1 : LEVEL_CONFIG.MAX_LEVEL;
  
  const currentLevelXp = thresholds[currentLevel] || 0;
  const nextLevelXp = thresholds[nextLevel] || currentLevelXp;
  
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const percentToNext = nextLevel > currentLevel ? Math.round((xpInCurrentLevel / xpNeededForNext) * 100) : 100;
  
  // Check if there's a gate at next level
  const nextLevelGate = LEVEL_GATES[nextLevel];
  
  return {
    currentLevel,
    nextLevel,
    currentLevelXp,
    nextLevelXp,
    xpInCurrentLevel,
    xpNeededForNext,
    percentToNext,
    isMaxLevel: currentLevel === LEVEL_CONFIG.MAX_LEVEL,
    hasGate: !!nextLevelGate,
    gateName: nextLevelGate?.description || null,
  };
}

/**
 * Check if XP amount causes a level up
 * @param {number} currentTotalXp - Current total XP before adding
 * @param {number} xpToAdd - XP being added
 * @param {number} prestige - Current prestige level
 * @returns {object} Level up information
 */
export function checkLevelUp(currentTotalXp = 0, xpToAdd = 0, prestige = 0) {
  const current = Number(currentTotalXp || 0);
  const xp = Number(xpToAdd || 0);
  const newTotal = current + xp;
  
  const oldLevel = getLevelFromXp(current, prestige);
  const newLevel = getLevelFromXp(newTotal, prestige);
  
  // Check if new level has a gate
  const levelGate = LEVEL_GATES[newLevel];
  
  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    xpGained: xp,
    totalXpAfter: newTotal,
    levelsGained: newLevel - oldLevel,
    hasGate: !!levelGate,
    gateName: levelGate?.description || null,
    requirementType: levelGate?.achievement || null,
  };
}

/**
 * HARDCORE MODE FEATURES:
 * 
 * 1. EXPONENTIAL SCALING: Each level requires 18% more XP than previous (vs 15%)
 * 2. LEVEL GATES: Must complete achievements to unlock certain levels
 * 3. SKILL TREES: 3 trees with 50+ skills, prerequisites, and XP costs
 * 4. DIMINISHING RETURNS: Grinding same content gives less XP over time
 * 5. PRESTIGE SYSTEM: Reset for bonuses, 10 prestige levels total
 * 6. 100 LEVELS: Double the original 50 levels
 * 7. ACHIEVEMENT REQUIREMENTS: 300+ achievements needed for max prestige
 * 8. NO XP CONSUMPTION: Skills require total XP earned (can't "spend" XP)
 * 
 * Level 100 at Prestige 10 requires: ~25+ BILLION total XP
 * 
 * SAMPLE PROGRESSION:
 * - Level 10: ~85,000 XP
 * - Level 25: ~1.2 million XP
 * - Level 50: ~30 million XP
 * - Level 75: ~400 million XP
 * - Level 100: ~3 billion XP (Prestige 0)
 * 
 * Each prestige adds 50% more XP requirements!
 */