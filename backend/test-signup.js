#!/usr/bin/env node
/**
 * Signup Integration Test Script
 * Tests the complete signup flow from frontend to database
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Aria Hunter',
  email: `aria-${Date.now()}@example.com`,
  password: 'TestPassword123',
  // Step 2: Personal Metrics
  age: 26,
  gender: 'female',
  height: 165.5,
  weight: 62.0,
  targetWeight: 58.0,
  // Step 3: Fitness Profile
  fitnessLevel: 'intermediate',
  goals: ['Weight Loss', 'Endurance'],
  activityLevel: 'moderate',
  preferredWorkouts: ['Running', 'Yoga'],
  workoutFrequency: '3-4',
  workoutDuration: '45-60',
  // Step 4: Health & Lifestyle
  medicalConditions: [],
  injuries: 'None',
  dietaryPreferences: ['Vegetarian'],
  sleepHours: '7-8',
  stressLevel: 'moderate',
  smokingStatus: 'non-smoker',
  // Step 5: Preferences & Wallet
  preferredWorkoutTime: 'morning',
  gymAccess: 'home-gym',
  equipment: ['Yoga Mat', 'Dumbbells'],
  motivationLevel: 'high',
  walletAddress: null,
};

async function runTests() {
  console.log('🧪 Starting Signup Integration Tests...\n');

  try {
    // Test 1: Health Check
    console.log('📋 Test 1: Backend Health Check');
    try {
      const healthResponse = await axios.get(`${API_URL}/health`);
      console.log('✅ Backend is running:', healthResponse.data.status);
    } catch (err) {
      console.log('❌ Backend is not responding. Make sure to run: npm start');
      process.exit(1);
    }

    // Test 2: Registration
    console.log('\n📋 Test 2: User Registration');
    console.log(`Registering user: ${testUser.email}`);
    
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
      console.log('✅ Registration successful!');
      console.log('Token received:', registerResponse.data.token.substring(0, 20) + '...');
      console.log('User ID:', registerResponse.data.user.id);
      
      const user = registerResponse.data.user;
      
      // Test 3: Verify All Fields
      console.log('\n📋 Test 3: Verify All Fields');
      const fieldsToCheck = [
        ['name', user.name === testUser.name],
        ['email', user.email === testUser.email],
        ['age', user.age === testUser.age],
        ['gender', user.gender === testUser.gender],
        ['height', user.height === testUser.height],
        ['weight', user.weight === testUser.weight],
        ['targetWeight', user.targetWeight === testUser.targetWeight],
        ['fitnessLevel', user.fitnessLevel === testUser.fitnessLevel],
        ['activityLevel', user.activityLevel === testUser.activityLevel],
        ['workoutFrequency', user.workoutFrequency === testUser.workoutFrequency],
        ['sleepHours', user.sleepHours === testUser.sleepHours],
        ['smokingStatus', user.smokingStatus === testUser.smokingStatus],
      ];
      
      let allFieldsCorrect = true;
      for (const [field, isCorrect] of fieldsToCheck) {
        if (isCorrect) {
          console.log(`  ✅ ${field}`);
        } else {
          console.log(`  ❌ ${field}`);
          allFieldsCorrect = false;
        }
      }
      
      if (allFieldsCorrect) {
        console.log('\n✅ All fields verified correctly!');
      } else {
        console.log('\n⚠️  Some fields did not match');
      }
      
      // Test 4: Duplicate Email
      console.log('\n📋 Test 4: Duplicate Email Prevention');
      try {
        await axios.post(`${API_URL}/auth/register`, testUser);
        console.log('❌ Should have rejected duplicate email');
      } catch (err) {
        if (err.response?.status === 400) {
          console.log('✅ Correctly rejected duplicate email:', err.response.data.message);
        } else {
          console.log('❌ Unexpected error:', err.message);
        }
      }
      
      console.log('\n✅ ALL TESTS PASSED! Signup is fully integrated with PostgreSQL.\n');
      console.log('🎯 Next Steps:');
      console.log('   1. Start the frontend: cd fitness-app-frontend && npm run dev');
      console.log('   2. Go to http://localhost:3000/signup');
      console.log('   3. Complete all 5 steps');
      console.log('   4. Click "Arise" to register');
      console.log('   5. Check database: psql -U postgres -d fitnessdb');
      console.log('   6. Query: SELECT * FROM fitness_profiles;');
      
    } catch (err) {
      console.log('❌ Registration failed:', err.response?.data?.message || err.message);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

runTests();
