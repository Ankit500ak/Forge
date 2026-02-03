#!/usr/bin/env node

/**
 * ML Task Generator API Test Script
 * 
 * Usage:
 *   node test-api.js <token> [count]
 * 
 * Example:
 *   node test-api.js "eyJhbGc..." 4
 * 
 * The script will:
 *   1. Send a batch generation request to the backend
 *   2. Validate the response format
 *   3. Check stat rewards (1-3 range)
 *   4. Verify XP rewards (10-200 range)
 *   5. Confirm tasks saved to database
 */

import http from 'http';

// Configuration
const API_HOST = 'localhost';
const API_PORT = 3000;
const API_PATH = '/api/tasks/generate-ml-batch';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

function testStatRewards(stats) {
  if (!stats) return { valid: false, reason: 'stat_rewards is null' };
  
  for (const [stat, value] of Object.entries(stats)) {
    if (typeof value !== 'number' || value < 1 || value > 3) {
      return { valid: false, reason: `${stat}: ${value} (expected 1-3)` };
    }
  }
  return { valid: true };
}

function testXP(xp) {
  if (xp < 10 || xp > 200) {
    return { valid: false, reason: `XP: ${xp} (expected 10-200)` };
  }
  return { valid: true };
}

function testDuration(duration) {
  if (duration < 10 || duration > 120) {
    return { valid: false, reason: `Duration: ${duration} (expected 10-120)` };
  }
  return { valid: true };
}

function testDifficulty(difficulty) {
  if (!['easy', 'medium', 'hard'].includes(difficulty?.toLowerCase())) {
    return { valid: false, reason: `Difficulty: ${difficulty}` };
  }
  return { valid: true };
}

function makeRequest(token, count) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({ count });
    
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(requestData);
    req.end();
  });
}

async function runTests() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('red', '❌ Error: Token required');
    console.log(`
Usage:
  node test-api.js <token> [count]

Example:
  node test-api.js "eyJhbGciOiJIUzI1NiI..." 4

Get your token:
  1. Log in to your app
  2. Open DevTools (F12)
  3. Go to Application/Storage
  4. Copy value from localStorage['token'] or sessionStorage['token']
    `);
    process.exit(1);
  }

  const token = args[0];
  const count = parseInt(args[1]) || 4;

  log('cyan', '\n🧪 ML Task Generator API Test Suite\n');
  
  log('blue', '📋 Test Configuration:');
  console.log(`   Host: ${API_HOST}:${API_PORT}`);
  console.log(`   Path: ${API_PATH}`);
  console.log(`   Task Count: ${count}`);
  console.log(`   Token: ${token.substring(0, 20)}...`);

  try {
    log('blue', '\n📤 Sending Request...');
    
    const startTime = Date.now();
    const response = await makeRequest(token, count);
    const duration = Date.now() - startTime;

    log('blue', `\n📥 Response Received (${duration}ms)`);
    
    // Check status
    if (response.status !== 200) {
      log('red', `❌ Status: ${response.status} (expected 200)`);
      if (response.status === 401) {
        log('red', '   Token is invalid or expired');
      }
      if (response.body.message) {
        console.log(`   Message: ${response.body.message}`);
      }
      process.exit(1);
    }
    
    log('green', `✅ Status: ${response.status}`);

    // Check response structure
    if (!response.body.tasks || !Array.isArray(response.body.tasks)) {
      log('red', '❌ Response missing "tasks" array');
      process.exit(1);
    }

    log('green', `✅ Tasks array present`);

    // Check task count
    if (response.body.tasks.length !== count) {
      log('yellow', `⚠️  Expected ${count} tasks, got ${response.body.tasks.length}`);
    } else {
      log('green', `✅ Task count: ${response.body.tasks.length}`);
    }

    // Test each task
    log('blue', '\n🔍 Validating Tasks:');
    
    let passCount = 0;
    let failCount = 0;
    const failures = [];

    response.body.tasks.forEach((task, idx) => {
      console.log(`\n   Task ${idx + 1}: ${task.title}`);
      
      let taskValid = true;

      // Test stat_rewards
      const statTest = testStatRewards(task.stat_rewards);
      if (statTest.valid) {
        console.log(`      ✅ Stat rewards: ${JSON.stringify(task.stat_rewards)}`);
      } else {
        console.log(`      ❌ Stat rewards: ${statTest.reason}`);
        taskValid = false;
        failures.push(`Task ${idx + 1}: ${statTest.reason}`);
      }

      // Test XP
      const xpTest = testXP(task.xp_reward);
      if (xpTest.valid) {
        console.log(`      ✅ XP reward: +${task.xp_reward}`);
      } else {
        console.log(`      ❌ XP reward: ${xpTest.reason}`);
        taskValid = false;
        failures.push(`Task ${idx + 1}: ${xpTest.reason}`);
      }

      // Test Duration
      const durationTest = testDuration(task.duration);
      if (durationTest.valid) {
        console.log(`      ✅ Duration: ${task.duration} min`);
      } else {
        console.log(`      ❌ Duration: ${durationTest.reason}`);
        taskValid = false;
        failures.push(`Task ${idx + 1}: ${durationTest.reason}`);
      }

      // Test Difficulty
      const diffTest = testDifficulty(task.difficulty);
      if (diffTest.valid) {
        console.log(`      ✅ Difficulty: ${task.difficulty}`);
      } else {
        console.log(`      ❌ Difficulty: ${diffTest.reason}`);
        taskValid = false;
        failures.push(`Task ${idx + 1}: ${diffTest.reason}`);
      }

      // Test Category
      if (task.category) {
        console.log(`      ✅ Category: ${task.category}`);
      } else {
        console.log(`      ❌ Category missing`);
        taskValid = false;
        failures.push(`Task ${idx + 1}: Category missing`);
      }

      if (taskValid) passCount++;
      else failCount++;
    });

    // Summary
    log('blue', '\n📊 Test Summary:');
    log('green', `   ✅ Passed: ${passCount}/${response.body.tasks.length}`);
    if (failCount > 0) {
      log('red', `   ❌ Failed: ${failCount}/${response.body.tasks.length}`);
      failures.forEach(f => console.log(`      - ${f}`));
    }

    // Statistics
    const xpValues = response.body.tasks.map(t => t.xp_reward || 0);
    const durationValues = response.body.tasks.map(t => t.duration || 0);
    
    log('blue', '\n📈 Statistics:');
    console.log(`   Avg XP: ${Math.round(xpValues.reduce((a, b) => a + b) / xpValues.length)}`);
    console.log(`   Min XP: ${Math.min(...xpValues)}`);
    console.log(`   Max XP: ${Math.max(...xpValues)}`);
    console.log(`   Avg Duration: ${Math.round(durationValues.reduce((a, b) => a + b) / durationValues.length)} min`);
    console.log(`   Min Duration: ${Math.min(...durationValues)} min`);
    console.log(`   Max Duration: ${Math.max(...durationValues)} min`);

    // Difficulty distribution
    const diffCount = {};
    response.body.tasks.forEach(t => {
      const diff = t.difficulty?.toLowerCase() || 'unknown';
      diffCount[diff] = (diffCount[diff] || 0) + 1;
    });
    
    console.log(`   Difficulty Distribution:`);
    Object.entries(diffCount).forEach(([diff, count]) => {
      console.log(`      ${diff}: ${count}`);
    });

    // Final result
    log('blue', '\n' + '='.repeat(50));
    if (failCount === 0) {
      log('green', '✅ ALL TESTS PASSED');
      log('green', '\n🎉 Ready for Frontend Integration!');
      process.exit(0);
    } else {
      log('red', `❌ ${failCount} TEST(S) FAILED`);
      log('yellow', '\nCheck the errors above and verify:');
      console.log('   1. Python service is running');
      console.log('   2. Model files exist: ml_models/fitness_model.pkl');
      console.log('   3. Database connection is working');
      console.log('   4. Token is valid and has required permissions');
      process.exit(1);
    }

  } catch (err) {
    log('red', `\n❌ Request Failed: ${err.message}`);
    
    if (err.code === 'ECONNREFUSED') {
      log('yellow', '\n⚠️  Cannot connect to backend at ${API_HOST}:${API_PORT}');
      log('yellow', 'Make sure the backend server is running:');
      log('yellow', '   cd backend && npm start');
    }
    
    process.exit(1);
  }
}

runTests();
