#!/usr/bin/env node
/**
 * ML Integration Test Script
 * Tests the connection between ML models and the backend API
 * Verifies that ML models are properly loaded and generating tasks
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = 'testuser@example.com';
const TEST_PASSWORD = 'TestPassword123!';

let authToken = null;
let userId = null;

console.log('🔍 ML Integration Test Suite\n');
console.log(`📡 API URL: ${API_BASE_URL}\n`);

// Helper function to make authenticated requests
async function authenticatedRequest(method, endpoint, data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` })
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  console.log('✅ Test 1: Health Check');
  const result = await authenticatedRequest('GET', '/api/health');
  if (result.success) {
    console.log('   ✓ Backend is running');
    console.log(`   Status: ${result.data.status}\n`);
    return true;
  } else {
    console.log('   ✗ Backend health check failed');
    console.log(`   Error: ${result.error}\n`);
    return false;
  }
}

// Test 2: User Authentication/Registration
async function testUserAuth() {
  console.log('✅ Test 2: User Authentication');
  
  // Try to register
  const registerResult = await authenticatedRequest('POST', '/api/auth/signup', {
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
  });

  if (!registerResult.success) {
    // Try to login if user already exists
    console.log('   User already exists, attempting login...');
    const loginResult = await authenticatedRequest('POST', '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (loginResult.success) {
      authToken = loginResult.data.token;
      userId = loginResult.data.userId || loginResult.data.user?.id;
      console.log(`   ✓ Login successful`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Token: ${authToken?.substring(0, 20)}...\n`);
      return true;
    } else {
      console.log(`   ✗ Login failed: ${loginResult.error}\n`);
      return false;
    }
  } else {
    authToken = registerResult.data.token;
    userId = registerResult.data.userId || registerResult.data.user?.id;
    console.log('   ✓ User registered successfully');
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${authToken?.substring(0, 20)}...\n`);
    return true;
  }
}

// Test 3: Check User Profile
async function testUserProfile() {
  console.log('✅ Test 3: User Profile Verification');
  const result = await authenticatedRequest('GET', '/api/users/profile');
  
  if (result.success) {
    const profile = result.data;
    console.log('   ✓ User profile loaded');
    console.log(`   Fitness Level: ${profile.fitness_level}`);
    console.log(`   Activity Level: ${profile.activity_level}`);
    console.log(`   Primary Goal: ${profile.primary_goal}`);
    console.log(`   Stats: STR=${profile.strength}, DEX=${profile.dexterity}, CON=${profile.constitution}\n`);
    return true;
  } else {
    console.log(`   ✗ Failed to load profile: ${result.error}\n`);
    return false;
  }
}

// Test 4: ML Task Generation (Single Task)
async function testMLTaskGeneration() {
  console.log('✅ Test 4: ML Task Generation (Single)');
  const result = await authenticatedRequest('POST', '/api/tasks/generate-ml');
  
  if (result.success) {
    const task = result.data.task;
    console.log('   ✓ ML task generated successfully');
    console.log(`   Title: ${task.title}`);
    console.log(`   Category: ${task.category}`);
    console.log(`   Difficulty: ${task.difficulty}`);
    console.log(`   XP Reward: ${task.xp_reward}`);
    console.log(`   Duration: ${task.duration}`);
    console.log(`   Stat Rewards: ${JSON.stringify(task.stat_rewards)}\n`);
    return true;
  } else {
    console.log(`   ✗ ML task generation failed`);
    console.log(`   Error: ${JSON.stringify(result.error)}\n`);
    return false;
  }
}

// Test 5: ML Batch Task Generation
async function testMLBatchGeneration() {
  console.log('✅ Test 5: ML Batch Task Generation');
  const result = await authenticatedRequest('POST', '/api/tasks/generate-ml-batch', {
    count: 3
  });
  
  if (result.success) {
    console.log('   ✓ ML batch tasks generated successfully');
    console.log(`   Tasks generated: ${result.data.tasks?.length || result.data.message}`);
    if (result.data.tasks && result.data.tasks.length > 0) {
      result.data.tasks.forEach((task, index) => {
        console.log(`   - Task ${index + 1}: ${task.title} (${task.category})`);
      });
    }
    console.log();
    return true;
  } else {
    console.log(`   ✗ Batch generation failed`);
    console.log(`   Error: ${JSON.stringify(result.error)}\n`);
    return false;
  }
}

// Test 6: Retrieve Today's Tasks
async function testGetTodayTasks() {
  console.log('✅ Test 6: Retrieve Today Tasks');
  const result = await authenticatedRequest('GET', '/api/tasks/today');
  
  if (result.success) {
    const tasks = result.data.tasks || result.data;
    console.log(`   ✓ Retrieved ${tasks.length} task(s) for today`);
    tasks.forEach((task, index) => {
      console.log(`   - Task ${index + 1}: ${task.title}`);
    });
    console.log();
    return true;
  } else {
    console.log(`   ✗ Failed to retrieve tasks: ${result.error}\n`);
    return false;
  }
}

// Test 7: Model Files Verification
async function testModelFilesExist() {
  console.log('✅ Test 7: ML Model Files Verification');
  
  try {
    const fs = await import('fs').then(m => m.promises);
    const path = (await import('path')).default;
    const modelPath = path.join(process.cwd(), 'ml_models');
    
    const files = await fs.readdir(modelPath);
    console.log(`   ✓ ML Models directory found`);
    console.log(`   Files in ml_models/:`);
    files.forEach(file => {
      console.log(`     - ${file}`);
    });
    console.log();
    return true;
  } catch (err) {
    console.log(`   ✗ ML Models directory not found: ${err.message}`);
    console.log('   Expected location: backend/ml_models/\n');
    return false;
  }
}

// Main test runner
async function runTests() {
  const tests = [
    testHealthCheck,
    testUserAuth,
    testUserProfile,
    testMLTaskGeneration,
    testMLBatchGeneration,
    testGetTodayTasks,
    testModelFilesExist
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
    } catch (error) {
      console.log(`   ✗ Test error: ${error.message}\n`);
      results.push(false);
    }
  }

  // Summary
  console.log('═'.repeat(50));
  console.log('📊 Test Summary');
  console.log('═'.repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`✓ Passed: ${passed}/${total}`);
  console.log(`✗ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! ML integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
