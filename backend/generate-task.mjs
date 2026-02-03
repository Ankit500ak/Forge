#!/usr/bin/env node
/**
 * Generate ML Task - Simple Version
 * Creates an ML-generated task and stores it in database
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'testuser@example.com';
const TEST_PASSWORD = 'TestPassword123!';

async function generateTask() {
  console.log('🚀 Generating ML Task...\n');

  try {
    // Step 1: Register/Login user
    console.log('Step 1: Authenticating user...');
    let token = null;

    // Try to register
    let registerRes = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        username: 'testuser',
        password: TEST_PASSWORD,
        age: 28,
        height: 175,
        weight: 75,
        gender: 'M',
        fitness_level: 'intermediate',
        activity_level: 'moderate',
        primary_goal: 'build_strength'
      })
    });

    if (registerRes.ok) {
      let data = await registerRes.json();
      token = data.token;
      console.log('✅ User registered\n');
    } else {
      // Try login
      let loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD
        })
      });

      if (loginRes.ok) {
        let data = await loginRes.json();
        token = data.token;
        console.log('✅ User logged in\n');
      } else {
        throw new Error('Failed to authenticate');
      }
    }

    // Step 2: Generate ML task
    console.log('Step 2: Generating ML task...');
    let taskRes = await fetch(`${API_URL}/tasks/generate-ml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!taskRes.ok) {
      throw new Error(`Task generation failed: ${taskRes.status}`);
    }

    let taskData = await taskRes.json();
    const task = taskData.task;

    console.log('✅ Task generated!\n');
    console.log('Task Details:');
    console.log(`  Title: ${task.title}`);
    console.log(`  Category: ${task.category}`);
    console.log(`  Difficulty: ${task.difficulty}`);
    console.log(`  XP Reward: ${task.xp_reward}`);
    console.log(`  Duration: ${task.duration}`);
    console.log(`  Stat Rewards: ${JSON.stringify(task.stat_rewards)}\n`);

    console.log('✅ Task stored in database!\n');
    console.log('Now run the query to see it:\n');
    console.log('  & "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe" -U postgres -d fitnessdb -c "SELECT id, title, category, difficulty, xp_reward, created_at FROM tasks ORDER BY created_at DESC LIMIT 5;"\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateTask();
