/**
 * Simple task generation and display script
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import TaskGenerationService from './services/taskGenerationService.js';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function generateTasks() {
  try {
    console.log('\n🧹 CLEANUP PHASE\n');

    // Delete all tasks
    await pool.query('DELETE FROM tasks');
    console.log('✅ Deleted old tasks');

    console.log('\n🔍 FINDING TEST USER\n');

    // Get test user
    const userResult = await pool.query(
      `SELECT id, email FROM users WHERE email = $1`,
      ['alice@example.com']
    );

    if (!userResult.rows.length) {
      console.log('❌ Test user not found');
      process.exit(1);
    }

    const userId = userResult.rows[0].id;
    console.log(`✅ Found test user: alice@example.com\n`);

    console.log('🤖 GENERATING EXERCISE-SPECIFIC TASKS\n');

    // Initialize task generation
    const taskGen = new TaskGenerationService(pool);
    
    // Get all task templates
    const templates = taskGen.taskTemplates;
    const statMapping = taskGen.getTaskStatMapping();

    let inserted = 0;

    // Insert one task from each category/difficulty to showcase variety
    const selectedTasks = [];
    
    // Strength
    selectedTasks.push(templates.strength.easy[0]);
    selectedTasks.push(templates.strength.medium[1]);
    selectedTasks.push(templates.strength.hard[0]);
    
    // Cardio
    selectedTasks.push(templates.cardio.easy[1]);
    selectedTasks.push(templates.cardio.medium[0]);
    selectedTasks.push(templates.cardio.hard[1]);
    
    // Calisthenics
    selectedTasks.push(templates.calisthenics.easy[0]);
    selectedTasks.push(templates.calisthenics.medium[1]);
    selectedTasks.push(templates.calisthenics.hard[0]);
    
    // Flexibility
    selectedTasks.push(templates.flexibility.easy[0]);
    selectedTasks.push(templates.flexibility.medium[1]);
    
    // HIIT
    selectedTasks.push(templates.hiit.easy[0]);
    selectedTasks.push(templates.hiit.medium[0]);

    // Insert tasks
    for (const task of selectedTasks) {
      await pool.query(
        `INSERT INTO tasks (user_id, title, description, xp_reward, category, difficulty, scheduled_date)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, task.title, task.description, task.xp_base, 'cardio', task.difficulty]
      );
      inserted++;
    }

    console.log(`✅ Generated ${inserted} exercise-specific tasks\n`);

    // Fetch and display
    console.log('📋 NEW TASKS WITH STAT REWARDS:\n');
    const tasksResult = await pool.query(
      `SELECT title, description, xp_reward, difficulty FROM tasks WHERE user_id = $1 ORDER BY difficulty, created_at`,
      [userId]
    );

    tasksResult.rows.forEach((task, idx) => {
      const stats = statMapping[task.title] || {};
      console.log(`${idx + 1}. 💪 ${task.title}`);
      console.log(`   📝 ${task.description}`);
      console.log(`   ⭐ XP: ${task.xp_reward} | Difficulty: ${task.difficulty}`);
      console.log(`   📊 Stat Rewards: ${JSON.stringify(stats)}`);
      console.log();
    });

    console.log(`✅ SUCCESS! Ready to display in frontend\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

generateTasks();
