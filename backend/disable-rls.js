import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function disableRLS() {
  console.log('Disabling RLS on tables...\n');

  // The SQL to disable RLS on specific tables
  const sql = `
    -- Disable RLS on user_progression
    ALTER TABLE public.user_progression DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS on user_stats
    ALTER TABLE public.user_stats DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS on fitness_profiles
    ALTER TABLE public.fitness_profiles DISABLE ROW LEVEL SECURITY;
    
    -- Disable RLS on tasks
    ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
  `;

  try {
    const { error } = await supabaseAdmin.rpc('exec', {
      sql: sql
    });

    if (error) {
      console.error('Error disabling RLS:', error);
    } else {
      console.log('✅ RLS disabled successfully on all tables');
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.log('\nNote: RLS can only be disabled via SQL Editor in Supabase Dashboard');
    console.log('Instructions:');
    console.log('1. Go to https://app.supabase.com/project/vryxqerqzepxrzjqgpqp/sql');
    console.log('2. Run the SQL statements above');
    console.log('3. Or use the Supabase CLI: supabase db pull, modify sql files, then db push');
  }
}

disableRLS();
