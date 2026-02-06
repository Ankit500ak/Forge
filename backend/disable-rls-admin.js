import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disableRLS() {
  console.log('🔐 Disabling RLS on tables...\n');

  const tables = ['user_progression', 'user_stats', 'fitness_profiles', 'tasks'];
  const results = [];

  for (const table of tables) {
    try {
      console.log(`⏳ Disabling RLS on ${table}...`);
      
      // Execute SQL to disable RLS
      const { data, error } = await supabaseAdmin.rpc('exec', {
        sql: `ALTER TABLE public."${table}" DISABLE ROW LEVEL SECURITY;`
      });

      if (error) {
        console.log(`   ⚠️  RPC method not available, trying direct SQL...`);
        throw error;
      }

      results.push({ table, status: 'disabled', error: null });
      console.log(`   ✅ RLS disabled on ${table}`);
    } catch (err) {
      console.log(`   ❌ Error on ${table}: ${err.message}`);
      results.push({ table, status: 'failed', error: err.message });
    }
  }

  console.log('\n📊 Summary:');
  console.log(JSON.stringify(results, null, 2));

  // Try alternative approach - check what RLS policies exist
  console.log('\n🔍 Checking RLS status via information_schema...');
  try {
    const { data, error } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity');

    if (!error && data) {
      console.log('Tables RLS status:');
      data.forEach(t => {
        if (tables.includes(t.tablename)) {
          console.log(`  ${t.tablename}: ${t.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
        }
      });
    }
  } catch (err) {
    console.log('Could not query table status');
  }

  console.log('\n✨ Note: If the above didn\'t work, you need to:');
  console.log('1. Go to https://app.supabase.com/project/vryxqerqzepxrzjqgpqp/sql');
  console.log('2. Create a new query and run:');
  console.log('   ALTER TABLE public.user_progression DISABLE ROW LEVEL SECURITY;');
  console.log('   ALTER TABLE public.user_stats DISABLE ROW LEVEL SECURITY;');
  console.log('   ALTER TABLE public.fitness_profiles DISABLE ROW LEVEL SECURITY;');
  console.log('   ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;');
}

disableRLS().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
