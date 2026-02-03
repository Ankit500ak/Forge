-- Migration: Add missing stat columns to user_stats table
-- Purpose: Ensure user_stats tracks all 5 primary stats (strength, constitution, dexterity, wisdom, charisma)

BEGIN;

-- Add missing stat columns if they don't exist
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS strength INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS constitution INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS dexterity INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS wisdom INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS charisma INTEGER DEFAULT 10;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);

-- Add comment explaining the stats
COMMENT ON TABLE user_stats IS 'User fitness stats and game stats - tracks 5 primary attributes that are earned through task completion';
COMMENT ON COLUMN user_stats.strength IS 'Physical power - increased by strength training tasks. Affects lift capacity and health';
COMMENT ON COLUMN user_stats.constitution IS 'Endurance and stamina - increased by cardio tasks. Affects max stamina and recovery speed';
COMMENT ON COLUMN user_stats.dexterity IS 'Agility and coordination - increased by flexibility tasks. Affects reflexes and injury prevention';
COMMENT ON COLUMN user_stats.wisdom IS 'Mental clarity and focus - increased by meditation/wellness tasks. Affects stress management and sleep quality';
COMMENT ON COLUMN user_stats.charisma IS 'Motivation and confidence - increased by all tasks. Affects workout consistency and motivation';

COMMIT;
