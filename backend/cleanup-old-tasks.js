import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

(async () => {
  try {
    console.log('🔍 Searching for old task names in database...\n');
    
    const result = await pool.query(`
      SELECT DISTINCT title FROM tasks 
      WHERE title LIKE '%Moderate%' 
      OR title LIKE '%HIIT%'
      OR title LIKE '%Meal Prep%'
      OR title LIKE '%Nutrition%'
      OR title LIKE '%Circuit%'
      ORDER BY title
    `);
    
    if (result.rows.length > 0) {
      console.log('❌ Found old tasks in database:');
      result.rows.forEach(row => {
        console.log(`  - ${row.title}`);
      });
      
      // Delete them
      console.log('\n🗑️  Deleting old tasks...\n');
      const deleteResult = await pool.query(`
        DELETE FROM tasks 
        WHERE title LIKE '%Moderate%' 
        OR title LIKE '%HIIT%'
        OR title LIKE '%Meal Prep%'
        OR title LIKE '%Nutrition%'
        OR title LIKE '%Circuit%'
      `);
      
      console.log(`✅ Deleted ${deleteResult.rowCount} old tasks`);
    } else {
      console.log('✅ No old tasks found in database');
    }
    
    // Show current tasks
    const countResult = await pool.query('SELECT COUNT(*) as count FROM tasks');
    console.log(`\n📊 Total tasks remaining: ${countResult.rows[0].count}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
