-- Check all users in the table
SELECT id, email, created_at FROM users;

-- Delete the old/duplicate profile for this email
DELETE FROM users WHERE email = 'ankit200211222@gmail.com';

-- Verify deletion
SELECT id, email, created_at FROM users;
