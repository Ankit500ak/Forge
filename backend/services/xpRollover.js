import cron from 'node-cron';
import { Pool } from 'pg';

let pool;

/**
 * Initialize the XP rollover service
 * Sets up a cron job to run daily at midnight
 */
export const initXpRolloverService = (pgPool) => {
  pool = pgPool;

  // Run at 00:00 (midnight) every day
  cron.schedule('0 0 * * *', async () => {
    console.log('[XP Rollover] Running daily XP rollover...');
    await performDailyRollover();
  });

  console.log('[XP Rollover] Service initialized - will run daily at midnight');
};

/**
 * Perform the daily XP rollover:
 * - Transfer xp_today to total_xp
 * - Reset xp_today to 0
 * - Keep weekly_xp and monthly_xp accumulating
 */
export const performDailyRollover = async () => {
  if (!pool) {
    console.error('[XP Rollover] Pool not initialized');
    return;
  }

  try {
    // Update all user progressions
    const result = await pool.query(
      `UPDATE user_progression
       SET 
         total_xp = total_xp + xp_today,
         xp_today = 0,
         updated_at = NOW()
       WHERE xp_today > 0
       RETURNING user_id, xp_today, total_xp`
    );

    if (result.rows.length > 0) {
      console.log(`[XP Rollover] Successfully rolled over XP for ${result.rows.length} users`);
      result.rows.forEach(row => {
        console.log(`  - User ${row.user_id}: Added ${row.xp_today} XP (Total: ${row.total_xp})`);
      });
    } else {
      console.log('[XP Rollover] No users had XP to roll over');
    }
  } catch (err) {
    console.error('[XP Rollover] Error during rollover:', err.message);
  }
};

/**
 * Manual trigger for rollover (can be called via API if needed)
 */
export const triggerRollover = async () => {
  console.log('[XP Rollover] Manual rollover triggered');
  await performDailyRollover();
};
