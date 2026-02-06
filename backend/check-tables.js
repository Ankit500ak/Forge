import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  const userId = '12bae8ec-2f7f-47c8-8d1b-957265c72585';

  console.log('Checking tables for user:', userId);
  console.log('============================================\n');

  // Check user_progression
  console.log('1. Checking user_progression table...');
  const { data: prog, error: progErr } = await supabase
    .from('user_progression')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('   Data:', prog ? 'EXISTS' : 'NOT FOUND');
  console.log('   Error:', progErr?.message || 'None');
  if (prog) console.log('   Record:', JSON.stringify(prog, null, 2));

  // Check user_stats
  console.log('\n2. Checking user_stats table...');
  const { data: stats, error: statsErr } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('   Data:', stats ? 'EXISTS' : 'NOT FOUND');
  console.log('   Error:', statsErr?.message || 'None');
  if (stats) console.log('   Record:', JSON.stringify(stats, null, 2));

  // Check tasks
  console.log('\n3. Checking tasks table...');
  const { data: tasks, error: tasksErr, count } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log('   Count:', count);
  console.log('   Error:', tasksErr?.message || 'None');

  // Try to list all tables
  console.log('\n4. Attempting to list all tables...');
  const { data: tables, error: tableErr } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (tableErr) {
    console.log('   Error:', tableErr.message);
  } else {
    console.log('   Tables found:');
    tables?.forEach(t => console.log('     -', t.table_name));
  }
}

checkTables().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
