-- Insert sample tasks for today
INSERT INTO tasks (user_id, title, description, category, xp_reward, scheduled_date, created_at, updated_at)
VALUES 
  ((SELECT id FROM users ORDER BY created_at DESC LIMIT 1), 'Morning Meditation', 'Start your day with 15 minutes of meditation', 'Mindfulness', 100, CURRENT_DATE, NOW(), NOW()),
  ((SELECT id FROM users ORDER BY created_at DESC LIMIT 1), 'Strength Training', 'Complete 45 minutes of strength exercises', 'Fitness', 250, CURRENT_DATE, NOW(), NOW()),
  ((SELECT id FROM users ORDER BY created_at DESC LIMIT 1), 'Read for 30 min', 'Read a book or educational article', 'Learning', 150, CURRENT_DATE, NOW(), NOW()),
  ((SELECT id FROM users ORDER BY created_at DESC LIMIT 1), 'Evening Walk', 'Take a 20-minute walk', 'Cardio', 100, CURRENT_DATE, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Show the inserted tasks
SELECT id, title, xp_reward, completed, scheduled_date FROM tasks 
WHERE scheduled_date = CURRENT_DATE 
ORDER BY created_at DESC;
