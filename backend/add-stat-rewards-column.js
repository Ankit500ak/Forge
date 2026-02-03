import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
(async () => {
  try {
    console.log('Adding stat_rewards column to tasks table...');
    
    await pool.query(`
      ALTER TABLE tasks
      ADD COLUMN stat_rewards JSONB DEFAULT '{}'::JSONB
    `);
    
    console.log('✅ stat_rewards column added successfully!');
    process.exit(0);
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('✅ stat_rewards column already exists');
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
})();
