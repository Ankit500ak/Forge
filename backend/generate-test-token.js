#!/usr/bin/env node

/**
 * Generate Test Token Directly
 * Creates a JWT token without needing backend/database
 * Useful for testing when backend is unavailable
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Read the secret from .env file or use default
let SECRET = 'your-secret-key-here';
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/JWT_SECRET=(.+)/);
    if (match) {
      SECRET = match[1].trim();
    }
  }
} catch (err) {
  console.log('⚠️  Could not read .env file, using default SECRET');
}

// Create a test token
const userId = 1; // Test user ID
const token = jwt.sign(
  { userId, email: 'ankit200211222@gmail.com' },
  SECRET,
  { expiresIn: '24h' }
);

console.log('\n🔐 Test Token Generated\n');
console.log(token);
console.log('\n📋 Next Step:');
console.log(`node backend/test-api.js "${token}" 4`);
