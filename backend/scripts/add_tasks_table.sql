-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'workout', 'nutrition', 'sleep', 'meditation', etc.
  xp_reward INTEGER NOT NULL DEFAULT 50,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  scheduled_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_xp CHECK (xp_reward > 0)
);

CREATE INDEX idx_tasks_user_date ON tasks(user_id, scheduled_date);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);

-- Create daily_tasks view for today's tasks
CREATE OR REPLACE VIEW today_tasks AS
SELECT 
  t.*,
  u.email,
  u.name
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.scheduled_date = CURRENT_DATE;

-- Seed some example tasks for testing
INSERT INTO tasks (user_id, title, description, category, xp_reward, scheduled_date)
SELECT 
  u.id,
  'Morning Run',
  '30 minute run in the morning',
  'workout',
  100,
  CURRENT_DATE
FROM users u
WHERE u.email = 'alicetest1222077183@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, category, xp_reward, scheduled_date)
SELECT 
  u.id,
  'Drink 8 glasses of water',
  'Stay hydrated throughout the day',
  'nutrition',
  50,
  CURRENT_DATE
FROM users u
WHERE u.email = 'alicetest1222077183@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, category, xp_reward, scheduled_date)
SELECT 
  u.id,
  'Meditate for 10 minutes',
  'Morning meditation session',
  'meditation',
  75,
  CURRENT_DATE
FROM users u
WHERE u.email = 'alicetest1222077183@example.com'
ON CONFLICT DO NOTHING;
