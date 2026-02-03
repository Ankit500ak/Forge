/**
 * Test Script: Verify new task templates with specific measurements
 */

import TaskGenerationService from './services/taskGenerationService.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const taskGen = new TaskGenerationService(pool);

console.log('\n✅ Testing new task templates with specific measurements\n');

// Display all task templates
const templates = taskGen.taskTemplates;

Object.entries(templates).forEach(([category, difficulties]) => {
  console.log(`\n📋 ${category.toUpperCase()} TASKS:`);
  Object.entries(difficulties).forEach(([difficulty, tasks]) => {
    console.log(`   ${difficulty.toUpperCase()}:`);
    tasks.forEach(task => {
      console.log(`     • ${task.title} (${task.xp_base} XP, Difficulty: ${task.difficulty})`);
      console.log(`       → ${task.description}`);
    });
  });
});

// Test stat mapping
console.log('\n\n✅ Verifying stat mappings for new tasks:\n');

const taskStatMapping = taskGen.getTaskStatMapping();
const newTasks = [
  '30 Push-ups',
  '50 Squats',
  '5km Run',
  '8x400m Sprints',
  '100 Push-ups Challenge',
  '45 Minute HIIT',
  'Drink 8 Cups Water',
  'Sleep 8 Hours',
];

newTasks.forEach(taskName => {
  const statMapping = taskStatMapping[taskName];
  if (statMapping) {
    console.log(`✅ "${taskName}" → ${JSON.stringify(statMapping)}`);
  } else {
    console.log(`❌ "${taskName}" → NO MAPPING FOUND`);
  }
});

console.log('\n✅ Task template verification complete!');

pool.end();
process.exit(0);
