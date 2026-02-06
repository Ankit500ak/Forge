#!/usr/bin/env node

/**
 * Direct Database Check
 * Checks if the user exists and shows available accounts
 */

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function main() {
  try {
    console.log('🔍 Checking database for user...\n');
    
    const result = await pool.query(
      'SELECT id, email, username FROM users WHERE email = $1 LIMIT 1',
      ['ankit200211222@gmail.com']
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User Found!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
    } else {
      console.log('❌ User NOT found in database');
      console.log('\n📋 Available users:');
      
      const allUsers = await pool.query(
        'SELECT id, email, username FROM users LIMIT 10'
      );
      
      if (allUsers.rows.length > 0) {
        allUsers.rows.forEach(user => {
          console.log(`   - ${user.email} (${user.username})`);
        });
      } else {
        console.log('   No users in database yet');
      }
    }

  } catch (err) {
    console.error('❌ Database Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
