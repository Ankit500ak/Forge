-- SQL alternative to backfill ranks based on total_xp
-- Run in psql or Supabase SQL editor

UPDATE user_progression
SET rank = CASE
  WHEN total_xp >= 50000000 THEN 'SSS'
  WHEN total_xp >= 24000000 THEN 'SS'
  WHEN total_xp >= 12000000 THEN 'S++'
  WHEN total_xp >= 6000000 THEN 'S+'
  WHEN total_xp >= 3000000 THEN 'S'
  WHEN total_xp >= 1400000 THEN 'A'
  WHEN total_xp >= 600000 THEN 'B'
  WHEN total_xp >= 240000 THEN 'C'
  WHEN total_xp >= 100000 THEN 'D'
  WHEN total_xp >= 40000 THEN 'E'
  ELSE 'F'
END;

-- Optionally verify:
-- SELECT rank, COUNT(*) FROM user_progression GROUP BY rank ORDER BY rank;
