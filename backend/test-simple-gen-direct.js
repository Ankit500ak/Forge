#!/usr/bin/env node

/**
 * Direct Test: Simple Task Generator
 * Tests the task generation directly without API
 */

import { generateSimpleTasks } from './simpleTaskGenerator.js';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/fitnessdb'
});

async function testGenerator() {
  try {
    console.log('🚀 Testing Simple Task Generator\n');

    // Get a test user
    console.log('1️⃣  Getting a test user...');
    const userRes = await pool.query('SELECT id, email FROM users LIMIT 1');
    
    if (userRes.rows.length === 0) {
      console.error('❌ No users found in database');
      process.exit(1);
    }

    const userId = userRes.rows[0].id;
    const email = userRes.rows[0].email;
    console.log(`✅ Found user: ${email}\n`);

    // Count tasks before
    console.log('2️⃣  Counting tasks before generation...');
    const countBefore = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE user_id = $1', [userId]);
    console.log(`📊 Tasks before: ${countBefore.rows[0].count}\n`);

    // Generate tasks
    console.log('3️⃣  Generating 3 tasks...');
    const generated = await generateSimpleTasks(userId, 'beginner', 3);
    console.log(`✅ Generator returned: ${generated.length} tasks\n`);

    // Count tasks after
    console.log('4️⃣  Counting tasks after generation...');
    const countAfter = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE user_id = $1', [userId]);
    console.log(`📊 Tasks after: ${countAfter.rows[0].count}\n`);

    // Show the generated tasks
    console.log('5️⃣  Verifying tasks in database...');
    const dbTasks = await pool.query(
      'SELECT id, title, category, xp_reward FROM tasks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    console.log(`📝 Latest tasks in database:\n`);
    dbTasks.rows.forEach((task, idx) => {
      console.log(`  ${idx + 1}. ${task.title}`);
      console.log(`     Category: ${task.category} | XP: ${task.xp_reward}`);
    });

    // Final result
    console.log('\n✅ TEST RESULTS:');
    console.log('================================');
    console.log(`Initial count: ${countBefore.rows[0].count}`);
    console.log(`Final count: ${countAfter.rows[0].count}`);
    console.log(`Added: ${countAfter.rows[0].count - countBefore.rows[0].count}`);
    
    if (countAfter.rows[0].count > countBefore.rows[0].count) {
      console.log('\n✅ SUCCESS! Tasks are being generated and stored!');
    } else {
      console.log('\n❌ FAILED! No tasks were stored!');
    }

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

testGenerator();
