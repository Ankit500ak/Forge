import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Debug endpoint - Check RLS status and table access
 * GET /api/debug/rls-status
 */
router.get('/rls-status', async (req, res) => {
  console.log('[Debug] Checking RLS status...');
  
  const tables = ['user_progression', 'user_stats', 'fitness_profiles', 'tasks'];
  const results = {
    timestamp: new Date().toISOString(),
    tables: {},
    errors: []
  };

  for (const table of tables) {
    console.log(`[Debug] Checking ${table}...`);
    
    try {
      // Try to select from table with service role
      const { data, error } = await supabase
        .from(table)
        .select('*', { head: true, count: 'exact' })
        .limit(1);

      if (error) {
        console.error(`[Debug] Error on ${table}:`, error.code, error.message);
        
        results.tables[table] = {
          status: 'ERROR',
          code: error.code,
          message: error.message,
          rls_enabled: error.code === '42501' ? 'YES - RLS IS BLOCKING ACCESS' : 'UNKNOWN'
        };
        
        if (error.code === '42501') {
          results.errors.push({
            table,
            issue: 'RLS_ENABLED',
            solution: 'Go to Supabase dashboard SQL editor and run: ALTER TABLE public.' + table + ' DISABLE ROW LEVEL SECURITY;'
          });
        }
      } else {
        results.tables[table] = {
          status: 'OK',
          accessible: true,
          rls_enabled: 'NO'
        };
      }
    } catch (err) {
      console.error(`[Debug] Exception on ${table}:`, err.message);
      results.tables[table] = {
        status: 'EXCEPTION',
        message: err.message
      };
    }
  }

  // Summary
  results.summary = {
    all_tables_accessible: Object.values(results.tables).every(t => t.status === 'OK'),
    rls_issues_found: results.errors.length > 0
  };

  if (results.summary.rls_issues_found) {
    console.log('[Debug] ❌ RLS ISSUES DETECTED:');
    results.errors.forEach(err => {
      console.log(`  - ${err.table}: ${err.issue}`);
      console.log(`    Solution: ${err.solution}`);
    });
  } else {
    console.log('[Debug] ✅ All tables accessible!');
  }

  res.json(results);
});

/**
 * Debug endpoint - Test a specific table access
 * GET /api/debug/test-table?table=user_progression&userId=USERID
 */
router.get('/test-table', async (req, res) => {
  const { table, userId } = req.query;

  if (!table) {
    return res.status(400).json({ error: 'table parameter required' });
  }

  console.log(`[Debug] Testing access to ${table}`);

  try {
    let query = supabase.from(table).select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error, count } = await query.limit(1);

    if (error) {
      console.error(`[Debug] Error accessing ${table}:`, error);
      
      return res.status(500).json({
        table,
        status: 'ERROR',
        error_code: error.code,
        error_message: error.message,
        rls_blocking: error.code === '42501',
        solution: error.code === '42501' 
          ? `Run in Supabase SQL Editor: ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`
          : error.message
      });
    }

    res.json({
      table,
      status: 'OK',
      data_count: data?.length || 0,
      accessible: true
    });

  } catch (err) {
    console.error(`[Debug] Exception:`, err);
    res.status(500).json({
      table,
      status: 'EXCEPTION',
      error: err.message
    });
  }
});

/**
 * Debug endpoint - Test task counting for a user
 * GET /api/debug/test-task-count?userId=USERID
 */
router.get('/test-task-count', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId parameter required' });
  }

  console.log(`[Debug] Testing task count for user: ${userId}`);

  try {
    const { count, error } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error(`[Debug] Error counting tasks:`, error);
      
      return res.status(500).json({
        status: 'ERROR',
        userId,
        error_code: error.code,
        error_message: error.message,
        rls_blocking: error.code === '42501',
        solution: error.code === '42501' 
          ? 'Run in Supabase SQL Editor: ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;'
          : error.message
      });
    }

    res.json({
      status: 'OK',
      userId,
      task_count: count,
      accessible: true
    });

  } catch (err) {
    console.error(`[Debug] Exception:`, err);
    res.status(500).json({
      status: 'EXCEPTION',
      userId,
      error: err.message
    });
  }
});

export default router;
