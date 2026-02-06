import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function fixRLS() {
  console.log('🔧 Attempting to fix RLS policies...\n');

  const tables = ['user_progression', 'user_stats', 'fitness_profiles', 'tasks'];
  
  for (const table of tables) {
    console.log(`Processing: ${table}`);
    
    try {
      // First, try to disable RLS
      console.log(`  → Disabling RLS...`);
      
      const { error: disableError } = await supabaseAdmin.rpc('exec', {
        sql: `ALTER TABLE public."${table}" DISABLE ROW LEVEL SECURITY;`
      });
      
      if (disableError) {
        console.log(`    ⚠️  exec() not available, trying alternative...`);
      } else {
        console.log(`    ✅ Disabled`);
        continue;
      }

      // Try dropping policies first
      console.log(`  → Dropping existing policies...`);
      
      const { error: dropError } = await supabaseAdmin.rpc('exec', {
        sql: `
          DROP POLICY IF EXISTS "Enable read" ON public."${table}";
          DROP POLICY IF EXISTS "Enable write" ON public."${table}";
          DROP POLICY IF EXISTS "Enable delete" ON public."${table}";
          DROP POLICY IF EXISTS "Enable read for authenticated users" ON public."${table}";
          DROP POLICY IF EXISTS "Enable write for authenticated users" ON public."${table}";
          DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public."${table}";
        `
      });
      
      if (dropError) {
        console.log(`    ⚠️  Could not drop policies: ${dropError.message}`);
      } else {
        console.log(`    ✅ Dropped policies`);
      }

      // Finally disable RLS
      console.log(`  → Disabling RLS...`);
      const { error: finalError } = await supabaseAdmin.rpc('exec', {
        sql: `ALTER TABLE public."${table}" DISABLE ROW LEVEL SECURITY;`
      });

      if (finalError) {
        console.log(`    ❌ Error: ${finalError.message}`);
      } else {
        console.log(`    ✅ RLS disabled`);
      }
      
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
    
    console.log();
  }

  console.log('\n📝 If the above didn\'t work, you MUST manually run this SQL:');
  console.log('Go to: https://app.supabase.com/project/vryxqerqzepxrzjqgpqp/sql/new\n');
  console.log('Copy and paste this exact SQL:');
  console.log(`
-- DISABLE RLS ON ALL TABLES
ALTER TABLE public.user_progression DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_progression', 'user_stats', 'fitness_profiles', 'tasks');
  `);
  console.log('\nThen click RUN and confirm it says "Query executed successfully"');
}

fixRLS().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
