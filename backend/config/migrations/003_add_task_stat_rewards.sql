-- Add stat_rewards column to tasks table
-- This column stores JSON with stat increases for each task
-- Example: {"strength": 1, "speed": 2, "health": 1}

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS stat_rewards JSONB DEFAULT '{}'::jsonb;

-- Create index on stat_rewards for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_stat_rewards ON tasks USING GIN(stat_rewards);

-- Backfill existing tasks with default health stat reward
UPDATE tasks 
SET stat_rewards = '{"health": 1}'::jsonb 
WHERE stat_rewards = '{}'::jsonb OR stat_rewards IS NULL;

-- Verify the migration
SELECT COUNT(*) as tasks_updated, COUNT(stat_rewards) as tasks_with_stats 
FROM tasks;
