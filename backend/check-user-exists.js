import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const userId = 'f870e16d-d8d5-4240-9685-6f3408befec5';
  const email = 'ankit200211222@gmail.com';

  console.log('Checking user in database...');
  console.log('User ID:', userId);
  console.log('Email:', email);

  // Check by ID
  const { data: byId, error: errorId } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  console.log('\n--- By ID ---');
  console.log('Found:', byId ? 'YES' : 'NO');
  if (errorId) console.log('Error:', errorId.message);
  if (byId) console.log('User:', JSON.stringify(byId, null, 2));

  // Check by email
  const { data: byEmail, error: errorEmail } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  console.log('\n--- By Email ---');
  console.log('Found:', byEmail ? 'YES' : 'NO');
  if (errorEmail) console.log('Error:', errorEmail.message);
  if (byEmail) console.log('User:', JSON.stringify(byEmail, null, 2));

  // List all users
  console.log('\n--- All Users in Database ---');
  const { data: allUsers, error: errorAll } = await supabase
    .from('users')
    .select('id, email, name, created_at');

  if (errorAll) {
    console.log('Error:', errorAll.message);
  } else {
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.id})`);
    });
  }
}

checkUser().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
