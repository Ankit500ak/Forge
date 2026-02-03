#!/usr/bin/env node

/**
 * Helper Script to Get Auth Token
 * 
 * Usage:
 *   node get-token.js <email> <password>
 * 
 * Example:
 *   node get-token.js "test@example.com" "password123"
 * 
 * Returns: Auth token for use in test-api.js
 */

import http from 'http';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

function getToken(email, password) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
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

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    log('red', '❌ Error: Email and password required');
    console.log(`
Usage:
  node get-token.js <email> <password>

Example:
  node get-token.js "test@example.com" "password123"
    `);
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];

  log('cyan', '\n🔐 Requesting Auth Token\n');
  
  console.log(`Email: ${email}`);
  console.log(`Password: ${'*'.repeat(password.length)}`);

  try {
    log('blue', '\n📤 Sending login request...');
    
    const response = await getToken(email, password);

    if (response.status !== 200) {
      log('red', `\n❌ Login Failed (${response.status})`);
      if (response.body.message) {
        console.log(`Message: ${response.body.message}`);
      }
      process.exit(1);
    }

    if (!response.body.token) {
      log('red', '\n❌ No token in response');
      console.log('Response:', JSON.stringify(response.body, null, 2));
      process.exit(1);
    }

    log('green', '\n✅ Login Successful!\n');
    
    const token = response.body.token;
    
    console.log('Token:');
    console.log(token);
    
    log('cyan', '\n📋 Next Steps:\n');
    
    console.log('1. Copy the token above');
    console.log('2. Test API with:');
    console.log(`   node backend/test-api.js "${token}" 4`);
    
    console.log('\nOr use this command:');
    console.log(`   node backend/test-api.js "$(node get-token.js ${email} ${password})" 4`);

  } catch (err) {
    log('red', `\n❌ Request Failed: ${err.message}`);
    
    if (err.code === 'ECONNREFUSED') {
      log('red', '\n⚠️  Cannot connect to backend at localhost:3000');
      log('red', 'Make sure the backend server is running:');
      log('red', '   cd backend && npm start');
    }
    
    process.exit(1);
  }
}

main();
