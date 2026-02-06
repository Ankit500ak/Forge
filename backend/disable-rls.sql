-- Disable RLS on tables that are blocking access
ALTER TABLE public.user_progression DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_progression', 'user_stats', 'fitness_profiles', 'tasks');
