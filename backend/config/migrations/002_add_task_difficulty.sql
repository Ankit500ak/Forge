-- Add difficulty column to tasks table if it doesn't exist
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;

-- Add duration_min column
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS duration_min INTEGER DEFAULT 30;

-- Create index on difficulty
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON tasks(difficulty);
