/**
 * Task Scheduler
 * - Clears all tasks at 12:30 AM daily
 * - Allows AI to generate fresh tasks for the new day
 */

import cron from 'node-cron';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.POSTGRES_URL 
});

/**
 * Initialize task scheduler
 * Runs at 12:30 AM every day
 */
export const initializeTaskScheduler = () => {
  console.log('⏰ Task Scheduler initialized');
  console.log('📅 Scheduled: Daily task reset at 12:30 AM');
  
  // Cron expression: 30 0 * * * 
  // Runs at 12:30 AM every day
  cron.schedule('30 0 * * *', async () => {
    await resetAllTasksDaily();
  });

  console.log('✅ Task scheduler ready\n');
};

/**
 * Reset all tasks at 12:30 AM
 * Deletes all existing tasks so AI can generate fresh ones
 */
export const resetAllTasksDaily = async () => {
  try {
    const timestamp = new Date().toLocaleString();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`⏰ DAILY TASK RESET - ${timestamp}`);
    console.log(`${'='.repeat(80)}`);
    
    // Get count before deletion
    const beforeResult = await pool.query('SELECT COUNT(*) as count FROM tasks');
    const beforeCount = beforeResult.rows[0].count;
    console.log(`📊 Tasks before reset: ${beforeCount}`);
    
    // Delete all tasks
    const deleteResult = await pool.query('DELETE FROM tasks');
    console.log(`🗑️  Deleted ${deleteResult.rowCount} tasks from database`);
    
    // Get count after deletion
    const afterResult = await pool.query('SELECT COUNT(*) as count FROM tasks');
    const afterCount = afterResult.rows[0].count;
    console.log(`📊 Tasks after reset: ${afterCount}`);
    
    console.log(`✅ Task list cleared! Ready for AI to generate fresh tasks.`);
    console.log(`💡 New tasks will be generated when users log in or request tasks.`);
    console.log(`${'='.repeat(80)}\n`);
    
  } catch (err) {
    console.error(`❌ Error resetting tasks: ${err.message}`);
  }
};

/**
 * Alternative: Manual reset function for testing
 * Call this to immediately reset all tasks
 */
export const manualResetTasks = async () => {
  console.log('🔄 Manual task reset initiated...');
  await resetAllTasksDaily();
};

/**
 * Get next scheduled reset time
 */
export const getNextResetTime = () => {
  const now = new Date();
  let next = new Date();
  next.setHours(0, 30, 0, 0); // Set to 12:30 AM
  
  // If already past 12:30 AM today, schedule for tomorrow
  if (now > next) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
};

export default {
  initializeTaskScheduler,
  resetAllTasksDaily,
  manualResetTasks,
  getNextResetTime
};
