-- Postgres schema and seed for fitness-app (no Supabase RLS or policies)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop triggers if present
DROP TRIGGER IF EXISTS update_user_quests_timestamp ON user_quests;
DROP TRIGGER IF EXISTS update_user_achievements_timestamp ON user_achievements;
DROP TRIGGER IF EXISTS update_user_inventory_timestamp ON user_inventory;
DROP TRIGGER IF EXISTS update_user_stats_timestamp ON user_stats;
DROP TRIGGER IF EXISTS update_user_progression_timestamp ON user_progression;
DROP TRIGGER IF EXISTS update_transactions_timestamp ON transactions;
DROP TRIGGER IF EXISTS update_items_timestamp ON items;
DROP TRIGGER IF EXISTS update_quests_timestamp ON quests;
DROP TRIGGER IF EXISTS update_fitness_profiles_timestamp ON fitness_profiles;
DROP TRIGGER IF EXISTS update_users_timestamp ON users;

-- Drop tables in dependency order
DROP TABLE IF EXISTS user_quests;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS user_inventory;
DROP TABLE IF EXISTS user_stats;
DROP TABLE IF EXISTS user_progression;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS quests;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS fitness_profiles;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS quest_status;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fitness profiles table (1:1 with users)
CREATE TABLE fitness_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  -- Personal Metrics (Step 2)
  age INTEGER,
  gender TEXT,
  height NUMERIC(5,2),
  weight NUMERIC(6,2),
  target_weight NUMERIC(6,2),
  -- Fitness Profile (Step 3)
  fitness_level TEXT,
  goals TEXT[],
  activity_level TEXT,
  preferred_workouts TEXT[],
  workout_frequency TEXT,
  workout_duration TEXT,
  -- Health & Lifestyle (Step 4)
  medical_conditions TEXT[],
  injuries TEXT,
  dietary_preferences TEXT[],
  sleep_hours TEXT,
  stress_level TEXT,
  smoking_status TEXT,
  -- Preferences & Wallet (Step 5)
  preferred_workout_time TEXT,
  gym_access TEXT,
  equipment TEXT[],
  motivation_level TEXT,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_fitness_profiles_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to refresh updated_at on update
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_fitness_profiles_timestamp
  BEFORE UPDATE ON fitness_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_fitness_user_id ON fitness_profiles (user_id);

-- Seed sample data: three users with linked fitness profiles
WITH u1 AS (
  INSERT INTO users (email, name, password_hash) VALUES ('alice@example.com', 'Alice Example', '$2b$10$YR7h7Q8U5cXK8fXq1K8v4O5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v') RETURNING id
),
u2 AS (
  INSERT INTO users (email, name, password_hash) VALUES ('bob@example.com', 'Bob Example', '$2b$10$YR7h7Q8U5cXK8fXq1K8v4O5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v') RETURNING id
),
u3 AS (
  INSERT INTO users (email, name, password_hash) VALUES ('charlie@example.com', 'Charlie Example', '$2b$10$YR7h7Q8U5cXK8fXq1K8v4O5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v') RETURNING id
)
INSERT INTO fitness_profiles (id, user_id, age, gender, height, weight, fitness_level, goals, activity_level, medical_conditions, preferred_workouts, wallet_address)
SELECT gen_random_uuid(), id, 29, 'female', 165.5, 60.2, 'intermediate', ARRAY['Weight Loss', 'Endurance'], 'moderate', NULL::TEXT[], ARRAY['Running','Yoga'], NULL FROM u1
UNION ALL
SELECT gen_random_uuid(), id, 34, 'male', 180.2, 82.0, 'advanced', ARRAY['Muscle Gain'], 'active', ARRAY['None']::TEXT[], ARRAY['Weightlifting','Cycling'], NULL FROM u2
UNION ALL
SELECT gen_random_uuid(), id, 22, 'non-binary', 172.0, 70.5, 'beginner', ARRAY['General Health'], 'light', ARRAY['Asthma']::TEXT[], ARRAY['Swimming'], NULL FROM u3;

COMMIT;

-- ======================================================
-- Game data schema: progression, stats, inventory, items,
-- achievements, quests, transactions
-- ======================================================

BEGIN;

CREATE TABLE IF NOT EXISTS user_progression (
  user_id UUID PRIMARY KEY,
  level INTEGER NOT NULL DEFAULT 1,
  stat_points INTEGER NOT NULL DEFAULT 0,
  xp_today INTEGER NOT NULL DEFAULT 0,
  rank TEXT DEFAULT 'A',
  total_xp BIGINT NOT NULL DEFAULT 0,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  monthly_xp INTEGER NOT NULL DEFAULT 0,
  health INTEGER NOT NULL DEFAULT 10,
  base_stats INTEGER NOT NULL DEFAULT 10,
  experience_points BIGINT NOT NULL DEFAULT 0,
  next_level_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user_progression_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY,
  user_id_ref UUID NOT NULL,
  bench_press INTEGER,
  deadlift INTEGER,
  squat INTEGER,
  total_lifted BIGINT,
  strength_goal INTEGER,
  distance_run_km NUMERIC(8,2),
  calories_burned INTEGER,
  cardio_sessions INTEGER,
  longest_run_km NUMERIC(6,2),
  speed NUMERIC(6,2),
  reflex_time INTEGER,
  flexibility INTEGER,
  bmi NUMERIC(5,2),
  resting_heart_rate INTEGER,
  sleep_quality INTEGER,
  stress_level INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  health INTEGER NOT NULL DEFAULT 10,
  base_stats INTEGER NOT NULL DEFAULT 10,
  experience_points BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT fk_user_stats_users FOREIGN KEY (user_id_ref) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  rarity TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  price INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT fk_user_inventory_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_inventory_items FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  xp_reward INTEGER DEFAULT 0,
  badge_attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT fk_user_achiev_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_achiev_achievements FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  objectives JSONB DEFAULT '[]'::jsonb,
  rewards JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE quest_status AS ENUM ('not_started','in_progress','completed','failed');
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL,
  status quest_status NOT NULL DEFAULT 'not_started',
  progress JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user_quests_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_quests_quests FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  UNIQUE (user_id, quest_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'coins',
  item_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_transactions_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_items FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- Triggers for updated_at on new tables
CREATE TRIGGER update_user_progression_timestamp
  BEFORE UPDATE ON user_progression
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_stats_timestamp
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_items_timestamp
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_quests_timestamp
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user ON user_quests (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_id);

COMMIT;
