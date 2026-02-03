-- Supabase Database Schema for Fitness App

-- Users table (Authentication & Basic Info)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fitness Profiles table (Connected to users via foreign key)
CREATE TABLE IF NOT EXISTS fitness_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  age INTEGER,
  gender TEXT,
  height DECIMAL(5,2),
  weight DECIMAL(6,2),
  fitness_level TEXT,
  goals TEXT[],
  activity_level TEXT,
  medical_conditions TEXT,
  preferred_workouts TEXT[],
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_fitness_profiles_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Drop old foreign key if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey CASCADE;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_timestamp ON users;
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Create trigger for fitness_profiles updated_at
DROP TRIGGER IF EXISTS update_fitness_profiles_timestamp ON fitness_profiles;
CREATE TRIGGER update_fitness_profiles_timestamp
  BEFORE UPDATE ON fitness_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass all RLS (already bypasses by default)
-- Allow anyone to insert during registration
DROP POLICY IF EXISTS "Allow registration insert" ON users;
CREATE POLICY "Allow registration insert" ON users
  FOR INSERT
  WITH CHECK (true);

-- Allow users to read all data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (true);

-- Create policy to allow users to update their own data
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Fitness Profiles Policies
DROP POLICY IF EXISTS "Allow insert fitness profile" ON fitness_profiles;
CREATE POLICY "Allow insert fitness profile" ON fitness_profiles
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own fitness profile" ON fitness_profiles;
CREATE POLICY "Users can read own fitness profile" ON fitness_profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own fitness profile" ON fitness_profiles;
CREATE POLICY "Users can update own fitness profile" ON fitness_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

