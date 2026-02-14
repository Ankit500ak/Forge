-- Migration: Add tasks_completed column to user_progression
-- Date: 2026-02-14
-- Description: Track number of tasks completed by each user

ALTER TABLE user_progression
ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_progression_tasks_completed 
ON user_progression(user_id, tasks_completed);

-- Update any existing rows that currently have NULL
UPDATE user_progression
SET tasks_completed = 0
WHERE tasks_completed IS NULL;
