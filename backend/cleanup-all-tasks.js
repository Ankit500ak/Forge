import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

(async () => {
  try {
    console.log('🗑️  Removing all previous tasks...\n');
    
    // Get count before deletion
    const beforeResult = await pool.query('SELECT COUNT(*) as count FROM tasks');
    const beforeCount = beforeResult.rows[0].count;
    console.log(`📊 Tasks before deletion: ${beforeCount}`);
    
    // Delete all tasks
    const deleteResult = await pool.query('DELETE FROM tasks');
    console.log(`✅ Deleted ${deleteResult.rowCount} tasks from database`);
    
    // Get count after deletion
    const afterResult = await pool.query('SELECT COUNT(*) as count FROM tasks');
    const afterCount = afterResult.rows[0].count;
    console.log(`📊 Tasks after deletion: ${afterCount}`);
    
    // Verify deletion
    if (afterCount === 0) {
      console.log('\n✅ SUCCESS! All previous tasks have been removed.');
      console.log('💾 Database is now ready for new task generation.');
    } else {
      console.log(`\n⚠️  WARNING: ${afterCount} task(s) still in database`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
