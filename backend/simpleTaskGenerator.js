/**
 * Simple Task Generator - No ML Dependencies
 * Generates realistic fitness tasks without needing ML models
 * Used for testing and as fallback when ML models unavailable
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/fitnessdb'
});

/**
 * Intelligent stat rewards based on actual task properties
 * Maps real-world exercise effects to stat gains
 */
function getStatRewardsForTask(taskTitle, taskDescription, category) {
  const title = taskTitle.toLowerCase();
  const desc = taskDescription.toLowerCase();
  
  // Real-world mapping: exercise type → stat gains
  const taskKeywords = {
    // ENDURANCE: Running, cycling, rowing, long-duration cardio
    endurance: ['run', 'jog', 'cycling', 'bike', 'rowing', 'row', 'marathon', 'stamina', 'cardio', 'endurance'],
    
    // SPEED: Sprints, explosive movements, quick exercises
    speed: ['sprint', 'fast', 'quick', 'explosive', 'interval', 'burpee', 'jump', 'velocity'],
    
    // STRENGTH: Lifting, resistance, power training
    strength: ['dumbbell', 'barbell', 'lift', 'squat', 'bench', 'deadlift', 'press', 'pull', 'push', 'weight'],
    
    // POWER: Explosive force, plyometrics, heavy compound
    power: ['explosive', 'plyometric', 'power', 'olympic', 'clean', 'snatch', 'thruster', 'box jump'],
    
    // AGILITY: Quick reflexes, flexibility, coordination
    agility: ['yoga', 'pilates', 'stretch', 'flexibility', 'balance', 'mobility', 'coordination'],
    
    // RECOVERY: Low intensity, stretching, healing
    recovery: ['stretch', 'yoga', 'recovery', 'foam roll', 'meditation', 'breathing', 'mobility']
  };
  
  // Find matching stats
  const rewards = {};
  const fullText = title + ' ' + desc;
  
  // Check each stat category
  for (const [stat, keywords] of Object.entries(taskKeywords)) {
    if (keywords.some(keyword => fullText.includes(keyword))) {
      rewards[stat] = 3;  // Primary stat
      break;
    }
  }
  
  // Add secondary stat based on intensity/category
  if (category === 'strength') {
    if (!rewards.strength) rewards.strength = 3;
    rewards.power = 2;
  } else if (category === 'cardio') {
    if (!rewards.speed && !rewards.endurance) {
      rewards.endurance = 3;
      rewards.speed = 2;
    } else if (rewards.endurance) {
      rewards.speed = 2;
    }
  } else if (category === 'flexibility') {
    if (!rewards.agility) rewards.agility = 3;
    rewards.recovery = 2;
  } else if (category === 'HIIT') {
    if (!rewards.power) rewards.power = 3;
    rewards.speed = 2;
    rewards.strength = 2;
  }
  
  // Ensure at least 1-2 rewards
  if (Object.keys(rewards).length === 0) {
    rewards.wisdom = 2;
  }
  
  return rewards;
}

// Sample tasks for different fitness levels and categories
const TASK_TEMPLATES = {
  beginner: {
    strength: [
      { title: 'Bodyweight Circuit', description: 'Do 10 pushups, 15 squats, 10 situps. Rest 60s between sets. Repeat 3x', duration: 20, xp: 50 },
      { title: 'Wall Push Ups', description: 'Do 15 wall push ups. 3 sets with 30s rest', duration: 10, xp: 30 },
      { title: 'Isometric Wall Sit', description: 'Hold a wall sit for 30 seconds. Do 3 reps', duration: 5, xp: 25 },
      { title: 'Dumbbell Lifts', description: 'Dumbbell curls 12 reps x 3 sets', duration: 15, xp: 40 },
      { title: 'Kettlebell Swings', description: 'Kettlebell swings 20 reps x 3 sets', duration: 12, xp: 45 },
    ],
    cardio: [
      { title: '5K Run', description: 'Run 5 kilometers at comfortable pace', duration: 25, xp: 60 },
      { title: 'Treadmill Sprint', description: 'Run at moderate intensity for 15 minutes', duration: 15, xp: 50 },
      { title: 'Stair Climber', description: 'Stair climber intense 10 minutes', duration: 10, xp: 45 },
      { title: 'Jump Rope', description: 'Jump rope 100 reps x 3 sets', duration: 8, xp: 35 },
      { title: 'Rowing Machine', description: 'Rowing machine 1000m at high intensity', duration: 12, xp: 50 },
    ],
    flexibility: [
      { title: 'Yoga Flow', description: 'Follow a 15-minute yoga flow video', duration: 15, xp: 40 },
      { title: 'Stretching Routine', description: 'Full body stretching session', duration: 10, xp: 25 },
      { title: 'Pilates Session', description: 'Beginner pilates workout 20 minutes', duration: 20, xp: 45 },
      { title: 'Foam Rolling', description: 'Foam roll all major muscle groups', duration: 12, xp: 30 },
    ],
    HIIT: [
      { title: 'Burpee Challenge', description: 'Burpees 20 reps x 4 sets', duration: 15, xp: 70 },
      { title: 'Mountain Climbers', description: 'Mountain climbers 30 reps x 3 sets', duration: 10, xp: 50 },
      { title: 'Jump Squats', description: 'Jump squats 20 reps x 4 sets', duration: 12, xp: 60 },
      { title: 'High Knees Run', description: 'High knees running 2 minutes x 3 sets', duration: 10, xp: 50 },
    ]
  },
  intermediate: {
    strength: [
      { title: 'Upper Body Strength', description: 'Pushups (30), Pull-ups (15), Dips (20). 4 sets', duration: 40, xp: 120 },
      { title: 'Lower Body Day', description: 'Barbell Squats 5x5, Lunges 15 reps, Leg Press 4x8', duration: 45, xp: 140 },
      { title: 'Deadlift Session', description: 'Deadlifts 5 reps x 5 sets at 80% max', duration: 35, xp: 130 },
      { title: 'Bench Press', description: 'Bench press 6 reps x 5 sets at high intensity', duration: 30, xp: 120 },
      { title: 'Compound Lifts', description: 'Squats, Deadlifts, Bench Press - 4 sets each', duration: 50, xp: 150 },
    ],
    cardio: [
      { title: '10K Run', description: 'Run 10 kilometers at steady pace', duration: 50, xp: 120 },
      { title: 'Cycling Interval', description: 'Bike 30 min with 30s sprints every 5 min', duration: 30, xp: 125 },
      { title: 'Treadmill HIIT', description: 'Treadmill 1 min sprint, 30s recovery x 10 rounds', duration: 20, xp: 110 },
      { title: 'Rowing Workout', description: 'Rowing machine 5000m at moderate intensity', duration: 30, xp: 120 },
      { title: 'Stair Running', description: 'Stadium stairs 10 repetitions', duration: 25, xp: 115 },
    ],
    flexibility: [
      { title: 'Advanced Yoga', description: 'Advanced yoga with vinyasas 45 minutes', duration: 45, xp: 90 },
      { title: 'Dynamic Stretching', description: 'Full dynamic stretch routine 30 minutes', duration: 30, xp: 75 },
      { title: 'Pilates Reformer', description: 'Pilates reformer class 50 minutes', duration: 50, xp: 100 },
    ],
    HIIT: [
      { title: 'HIIT Cardio Blast', description: '30s intense work, 30s rest: burpees, mountain climbers, squat thrusts. 12 rounds', duration: 15, xp: 150 },
      { title: 'Plyometric Training', description: 'Box jumps, jump squats, clap pushups 5x5', duration: 25, xp: 140 },
      { title: 'CrossFit WOD', description: 'Complete daily CrossFit workout of the day', duration: 30, xp: 160 },
      { title: 'Tabata Blitz', description: '20s max effort, 10s rest x 8 rounds, 4 different exercises', duration: 12, xp: 130 },
    ]
  },
  advanced: {
    strength: [
      { title: 'Powerlifting Day', description: 'Heavy squats (5x3), bench press (5x3), deadlifts (3x3) at 90%+ max', duration: 70, xp: 250 },
      { title: 'Olympic Lifts', description: 'Clean and jerk (5x3), Snatch (5x3) at competition intensity', duration: 60, xp: 240 },
      { title: 'Advanced Circuit', description: 'Weighted pushups (50lb), pullups, dips, rows. Progressive overload. 5 sets', duration: 50, xp: 220 },
      { title: 'Compound Periodization', description: 'Heavy compound lifts with periodized loading', duration: 60, xp: 260 },
      { title: 'Strongman Training', description: 'Atlas stones, farmer carries, log press', duration: 55, xp: 240 },
    ],
    cardio: [
      { title: 'Marathon Training', description: 'Run 20km at steady marathon pace', duration: 100, xp: 280 },
      { title: 'High Intensity Intervals', description: 'Run 2 min hard, 1 min easy x 10 rounds', duration: 30, xp: 250 },
      { title: 'Advanced Cycling', description: 'Cycling 60km with hill repeats and sprints', duration: 90, xp: 300 },
      { title: 'Hill Sprints', description: 'Sprint up hill 15 times with full recovery', duration: 40, xp: 260 },
      { title: 'CrossFit Endurance', description: '2-hour CrossFit endurance workout', duration: 120, xp: 320 },
    ],
    flexibility: [
      { title: 'Advanced Mobility', description: 'Comprehensive mobility work 60 minutes', duration: 60, xp: 120 },
      { title: 'Advanced Yoga Intensive', description: 'Advanced yoga with arm balances 90 minutes', duration: 90, xp: 150 },
    ],
    HIIT: [
      { title: 'Extreme HIIT Challenge', description: '45s max effort, 15s rest: varied exercises at max intensity. 20 rounds', duration: 25, xp: 300 },
      { title: 'Crossfit Throwdown', description: 'Complete 60-minute CrossFit competition workout', duration: 60, xp: 350 },
      { title: 'Elite Metabolic Conditioning', description: 'Advanced conditioning with multiple energy systems', duration: 35, xp: 320 },
      { title: 'Plyometric Explosion', description: 'Max power output plyometrics - box jumps, clap pushups, medicine ball slams', duration: 30, xp: 280 },
      { title: 'Battle Rope Burnout', description: 'Battle ropes max intensity 15 min', duration: 15, xp: 200 },
    ]
  }
};

/**
 * Generate random tasks for a user with difficulty scaling
 * @param {string} userId - User ID
 * @param {string} fitnessLevel - User's fitness level (beginner/intermediate/advanced)
 * @param {number} count - Number of tasks to generate (default 5)
 * @returns {Promise<Array>} Generated tasks
 */
export async function generateSimpleTasks(userId, fitnessLevel = 'beginner', count = 5) {
  try {
    const templates = TASK_TEMPLATES[fitnessLevel] || TASK_TEMPLATES.beginner;
    const categories = Object.keys(templates);
    const generatedTasks = [];

    // Apply difficulty multiplier based on fitness level
    const difficultyMultiplier = {
      beginner: 1.0,
      intermediate: 1.5,
      advanced: 2.0
    }[fitnessLevel] || 1.0;

    console.log(`[SimpleGen] Generating ${count} tasks for user ${userId} (${fitnessLevel}, multiplier: ${difficultyMultiplier})...`);

    for (let i = 0; i < count; i++) {
      // Pick random category
      const category = categories[Math.floor(Math.random() * categories.length)];
      const tasks = templates[category];
      const template = tasks[Math.floor(Math.random() * tasks.length)];
      
      // Scale XP based on difficulty multiplier
      const scaledXp = Math.ceil(template.xp * difficultyMultiplier);
      
      // Scale difficulty (1-3) and increase based on fitness level
      const baseDifficulty = Math.ceil(Math.random() * 3);
      const scaledDifficulty = Math.min(3, Math.ceil(baseDifficulty * difficultyMultiplier));
      
      // Get realistic stat rewards based on the actual task (not ML - based on real-world exercise effects)
      const statRewards = getStatRewardsForTask(template.title, template.description, category);

      // Store in database
      const result = await pool.query(
        `INSERT INTO tasks (user_id, title, description, category, difficulty, xp_reward, duration, stat_rewards, scheduled_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, NOW())
         RETURNING id, title, category, xp_reward, difficulty, scheduled_date, stat_rewards`,
        [
          userId,
          template.title,
          template.description,
          category,
          scaledDifficulty,
          scaledXp,
          template.duration,
          JSON.stringify(statRewards)
        ]
      );

      generatedTasks.push(result.rows[0]);
      console.log(`[SimpleGen] ✅ Generated: ${template.title} (Difficulty: ${scaledDifficulty}, XP: ${scaledXp}, Stats: ${Object.entries(statRewards).map(([k,v]) => v > 0 ? `${k}:${v}` : null).filter(Boolean).join(', ')})`);
    }

    console.log(`[SimpleGen] ✅ Generated ${count} tasks successfully with ${difficultyMultiplier}x difficulty multiplier`);
    return generatedTasks;
  } catch (error) {
    console.error('[SimpleGen] ❌ Error generating tasks:', error.message);
    throw error;
  }
}

/**
 * Generate and store a single task
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created task
 */
export async function generateSimpleTaskForUser(userId) {
  try {
    // Get user's fitness level
    const userResult = await pool.query(
      `SELECT fp.fitness_level FROM users u
       LEFT JOIN fitness_profiles fp ON u.id = fp.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const fitnessLevel = userResult.rows[0]?.fitness_level || 'beginner';
    const tasks = await generateSimpleTasks(userId, fitnessLevel, 1);
    return tasks[0];
  } catch (error) {
    console.error('[SimpleGen] Error:', error.message);
    throw error;
  }
}
