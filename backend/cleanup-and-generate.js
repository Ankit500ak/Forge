/**
 * Cleanup old tasks and generate new exercise-specific tasks
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import TaskGenerationService from './services/taskGenerationService.js';
import TaskRecommendationModel from './services/mlModelNN.js';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function cleanupAndGenerate() {
  try {
    console.log('\n🧹 CLEANUP PHASE\n');

    // Delete all tasks
    const deleteResult = await pool.query('DELETE FROM tasks');
    console.log(`✅ Deleted ${deleteResult.rowCount} old tasks`);

    // Verify empty
    const countResult = await pool.query('SELECT COUNT(*) as count FROM tasks');
    console.log(`✅ Tasks remaining: ${countResult.rows[0].count}`);

    console.log('\n🔍 FINDING TEST USER\n');

    // Get test user
    const userResult = await pool.query(
      `SELECT u.id, u.email, fp.fitness_level, fp.goals
       FROM users u 
       LEFT JOIN fitness_profiles fp ON u.id = fp.user_id
       WHERE u.email = $1`,
      ['alice@example.com']
    );

    if (!userResult.rows.length) {
      console.log('❌ Test user not found');
      process.exit(1);
    }

    const { id: userId, email } = userResult.rows[0];
    console.log(`✅ Found test user: ${email}\n`);

    console.log('🤖 GENERATING NEW TASKS\n');

    // Initialize services
    const taskGen = new TaskGenerationService(pool);
    const mlModel = new TaskRecommendationModel();
    await mlModel.buildModel(32, 12);

    // Generate tasks using ML model
    const generatedTasks = await taskGen.generateTasksForUser(userId, mlModel);
    console.log(`✅ Generated ${generatedTasks.length} new exercise-specific tasks\n`);

    // Fetch and display generated tasks
    console.log('📋 NEW GENERATED TASKS WITH STATS:\n');
    const tasksResult = await pool.query(
      `SELECT title, description, xp_reward FROM tasks WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    tasksResult.rows.forEach((task, idx) => {
      // Get stat rewards from the stat mapping
      const statMapping = taskGen.getTaskStatMapping();
      const stats = statMapping[task.title] || {};
      
      console.log(`${idx + 1}. 💪 ${task.title}`);
      console.log(`   📝 ${task.description}`);
      console.log(`   ⭐ XP: ${task.xp_reward}`);
      console.log(`   📊 Stats: ${JSON.stringify(stats)}`);
      console.log();
    });

    console.log(`✅ SUCCESS! Generated ${tasksResult.rows.length} new tasks ready for frontend\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

cleanupAndGenerate();
