import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const userId = '12bae8ec-2f7f-47c8-8d1b-957265c72585';

console.log('Testing Supabase clients...\n');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('Service Role Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('User ID:', userId);
console.log('\n');

// Test with service role (should bypass RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test with anon key (will respect RLS)
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAccess() {
  console.log('=== Testing user_progression access ===\n');

  // Test 1: Admin client (should work)
  console.log('1️⃣  Admin Client (Service Role):');
  try {
    const { data, error } = await supabaseAdmin
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${error.details}`);
    } else {
      console.log(`   ✅ Success! Data:`, data ? 'Found' : 'Not found');
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  console.log('\n2️⃣  Anon Client (should respect RLS):');
  try {
    const { data, error } = await supabaseAnon
      .from('user_progression')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.log(`   Expected error: ${error.message}`);
    } else {
      console.log(`   Data:`, data);
    }
  } catch (err) {
    console.log(`   Exception: ${err.message}`);
  }

  console.log('\n=== Testing tasks table ===\n');

  console.log('3️⃣  Admin Client - tasks:');
  try {
    const { data, error, count } = await supabaseAdmin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Success! Count:`, count);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }

  console.log('\n=== Testing user_stats ===\n');

  console.log('4️⃣  Admin Client - user_stats:');
  try {
    const { data, error } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Success! Data:`, data ? 'Found' : 'Not found');
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
  }
}

testAccess().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
