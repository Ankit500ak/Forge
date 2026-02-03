import { Pool } from 'pg';
import TaskGenerationService from './services/taskGenerationService.js';
import { generateStatPointRecommendations } from './services/mlModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Parse connection URL or use individual parameters
const connectionUrl = process.env.POSTGRES_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'fitnessdb'}`;

const pool = new Pool({
  connectionString: connectionUrl
});

// Create a simple ML object with the needed functions
const mlModel = {
  calculateGoalProgress: (profile, stats) => {
    return { bodyTypeMatch: 0.5 };
  },
  calculateBodyTypeMatch: (profile, stats) => {
    return 0.5;
  },
  generateStatPointRecommendations: async (userId) => {
    return await generateStatPointRecommendations(userId);
  }
};

(async () => {
  try {
    const taskService = new TaskGenerationService(pool);
    
    // Get a test user with profile
    const result = await pool.query(`
      SELECT DISTINCT fp.user_id, fp.fitness_level, fp.goals, fp.age, fp.equipment, fp.injuries, fp.medical_conditions
      FROM fitness_profiles fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.goals IS NOT NULL AND array_length(fp.goals, 1) > 0
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No users with fitness profile found');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('\n🧪 Testing profile-based task design:');
    console.log('   User ID:', user.user_id);
    console.log('   Fitness Level:', user.fitness_level);
    console.log('   Goals:', user.goals?.join(', '));
    console.log('   Age:', user.age);
    console.log('   Equipment:', user.equipment?.join(', ') || 'None');
    console.log('   Injuries:', user.injuries || 'None');
    console.log('   Medical Conditions:', user.medical_conditions?.join(', ') || 'None');
    console.log('\n' + '='.repeat(80));
    
    // Generate tasks using new profile-based design
    const response = await taskService.generateTasksForUser(user.user_id, mlModel);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ TASK GENERATION RESULT:');
    console.log('\nSuccess:', response.success);
    console.log('Message:', response.message);
    console.log('Tasks Generated:', response.tasksGenerated);
    console.log('Difficulty:', response.difficulty);
    console.log('Rank:', response.rank);
    console.log('Goals:', response.goals?.join(', '));
    console.log('Fitness Level:', response.fitnessLevel);
    
    if (response.designStrategy) {
      console.log('\nDesign Strategy:');
      console.log('  - Priority Categories:', response.designStrategy.priorityCategories?.join(', '));
      console.log('  - Preferred Exercises:', response.designStrategy.preferredExercises?.join(', '));
      console.log('  - Exclude Categories:', response.designStrategy.excludeCategories?.join(', ') || 'None');
    }
    
    // Show tasks generated
    if (response.success && response.tasks.length > 0) {
      console.log('\n📋 Generated Tasks:');
      response.tasks.forEach((task, idx) => {
        console.log(`  ${idx + 1}. ${task.title}`);
        console.log(`     Category: ${task.category} | XP: ${task.xp_reward} | Difficulty: ${task.difficulty}`);
        console.log(`     Stat Rewards: ${JSON.stringify(task.stat_rewards)}`);
      });
    }
    
    console.log('\n✅ Profile-based task design completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
