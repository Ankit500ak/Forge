-- Database Schema Update for ML Task Generation
-- This script adds necessary columns to support the ML task generation system

-- Add missing columns to tasks table if they don't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS stat_rewards JSONB DEFAULT '{}';

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30;

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS scheduled_date DATE DEFAULT CURRENT_DATE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_scheduled 
ON tasks(user_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_category_difficulty 
ON tasks(category, difficulty);

CREATE INDEX IF NOT EXISTS idx_tasks_completed_date 
ON tasks(user_id, completed, scheduled_date);

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
