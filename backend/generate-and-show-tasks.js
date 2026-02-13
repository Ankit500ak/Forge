#!/usr/bin/env node
/**
 * Generate Task & Show Recent Tasks
 * This script generates an ML task and displays the 5 most recent tasks
 */

import axios from 'axios';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000';
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

console.log('🎯 Task Generation & Display Test\n');

async function run() {
  try {
    // Step 1: Health check
    console.log('1️⃣  Checking backend health...');
    try {
      const health = await axios.get(`${API_BASE_URL}/api/health`);
      console.log(`   ✅ Backend: ${health.data.status}\n`);
    } catch (err) {
      console.log('   ❌ Backend not running. Start with: npm run dev\n');
      process.exit(1);
    }

    // Step 2: Create test user or login
    console.log('2️⃣  Setting up test user...');
    let token = null;
    let userId = null;

    // Try to register a test user
    try {
      const registerRes = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        email: 'testuser@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        age: 28,
        height: 175,
        weight: 75,
        gender: 'M',
        fitness_level: 'intermediate',
        activity_level: 'moderate',
        primary_goal: 'build_strength'
      });
      token = registerRes.data.token;
      userId = registerRes.data.userId || registerRes.data.user?.id;
      console.log(`   ✅ User registered\n`);
    } catch (err) {
      // User might already exist, try login
      try {
        const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: 'testuser@example.com',
          password: 'TestPassword123!'
        });
        token = loginRes.data.token;
        userId = loginRes.data.userId || loginRes.data.user?.id;
        console.log(`   ✅ User logged in\n`);
      } catch (loginErr) {
        console.log(`   ❌ Failed to authenticate\n`);
        throw loginErr;
      }
    }

    // Step 3: Generate ML task
    console.log('3️⃣  Generating ML task...');
    try {
      const taskRes = await axios.post(`${API_BASE_URL}/api/tasks/generate-ml`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const task = taskRes.data.task;
      console.log(`   ✅ Task generated!`);
      console.log(`      Title: ${task.title}`);
      console.log(`      Category: ${task.category}`);
      console.log(`      Difficulty: ${task.difficulty}`);
      console.log(`      XP Reward: ${task.xp_reward}\n`);
    } catch (err) {
      console.log(`   ❌ Task generation failed: ${err.response?.data?.message || err.message}\n`);
      throw err;
    }

    // Step 4: Show recent tasks from database
    console.log('4️⃣  Recent 5 tasks in database:\n');
    console.log('   ' + '═'.repeat(100));

    const result = await pool.query(
      `SELECT 
        id,
        title,
        category,
        difficulty,
        xp_reward,
        duration,
        stat_rewards,
        TO_CHAR(created_at, 'YYYY-MM-DD HH:24:MI:SS') as created_at
      FROM tasks
      ORDER BY created_at DESC
      LIMIT 5`
    );

    if (result.rows.length === 0) {
      console.log('   ❌ No tasks found in database\n');
    } else {
      result.rows.forEach((task, index) => {
        console.log(`\n   Task ${index + 1}:`);
        console.log(`   ├─ ID: ${task.id}`);
        console.log(`   ├─ Title: ${task.title}`);
        console.log(`   ├─ Category: ${task.category}`);
        console.log(`   ├─ Difficulty: ${task.difficulty}`);
        console.log(`   ├─ XP Reward: ${task.xp_reward}`);
        console.log(`   ├─ Duration: ${task.duration}`);
        console.log(`   ├─ Stats: ${JSON.stringify(task.stat_rewards)}`);
        console.log(`   └─ Created: ${task.created_at}`);
      });

      console.log('\n   ' + '═'.repeat(100));
      console.log(`\n   ✅ Total tasks found: ${result.rows.length}\n`);
    }

    // Step 5: Show task statistics
    console.log('5️⃣  Task Statistics:\n');

    const stats = await pool.query(
      `SELECT 
        category,
        difficulty,
        COUNT(*) as count,
        AVG(xp_reward) as avg_xp
      FROM tasks
      GROUP BY category, difficulty
      ORDER BY category, difficulty`
    );

    console.log('   ' + '─'.repeat(60));
    console.log('   Category      | Difficulty | Count | Avg XP');
    console.log('   ' + '─'.repeat(60));

    stats.rows.forEach(row => {
      const cat = (row.category || 'N/A').padEnd(13);
      const diff = (row.difficulty || 'N/A').padEnd(10);
      console.log(`   ${cat} | ${diff} | ${String(row.count).padStart(5)} | ${Number(row.avg_xp).toFixed(1)}`);
    });

    console.log('   ' + '─'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
