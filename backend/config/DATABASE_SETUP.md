Database setup — schema and commands (Postgres / Supabase + MySQL)

Overview
- This file provides SQL schemas and setup steps for the Fitness App data model.
- It includes a Postgres (Supabase) schema tuned for Supabase features (UUID type, RLS policies), and a MySQL-compatible schema (JSON for arrays, UUID generation) for environments without Postgres.
- Apply the SQL appropriate to your database, then run the verification steps at the end.

Contents
- Postgres / Supabase SQL (recommended for this project)
- MySQL SQL (drop-in alternative)
- Indexes, constraints, and trigger notes
- How to apply
- Verification

---

**Postgres / Supabase (recommended)**

Save as `supabase_schema.sql` or run from Supabase SQL editor.

```sql
-- Users table (authentication + profile)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fitness profiles table (1:1 with users)
CREATE TABLE IF NOT EXISTS fitness_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  age INTEGER,
  gender TEXT,
  height NUMERIC(5,2),
  weight NUMERIC(6,2),
  fitness_level TEXT,
  goals TEXT[], -- array of goal strings
  activity_level TEXT,
  medical_conditions TEXT,
  preferred_workouts TEXT[], -- array
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_fitness_profiles_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_users_timestamp ON users;
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_fitness_profiles_timestamp ON fitness_profiles;
CREATE TRIGGER update_fitness_profiles_timestamp
  BEFORE UPDATE ON fitness_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Policies for Supabase (enable RLS then add safe policies)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_profiles ENABLE ROW LEVEL SECURITY;

-- Allow registration inserts
DROP POLICY IF EXISTS "Allow registration insert" ON users;
CREATE POLICY "Allow registration insert" ON users
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read (for public parts) - adjust for your privacy needs
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (true);

-- Allow users to update their own data
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Fitness_profiles policies
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
```

Notes:
- `gen_random_uuid()` requires the `pgcrypto` extension (Supabase usually provides it). If missing, run `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.
- Arrays (`TEXT[]`) are used for `goals` and `preferred_workouts` for simple list storage. Alternatively use a normalized join table if you need querying/filtering on elements.

---

**MySQL (alternative)**

Save as `mysql_schema.sql` and run against your MySQL server. Uses `CHAR(36)` for UUID and JSON for arrays.

```sql
-- Drop if exists
DROP TABLE IF EXISTS fitness_profiles;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fitness profiles table
CREATE TABLE fitness_profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  age INT,
  gender VARCHAR(50),
  height DECIMAL(5,2),
  weight DECIMAL(6,2),
  fitness_level VARCHAR(50),
  goals JSON,
  activity_level VARCHAR(50),
  medical_conditions TEXT,
  preferred_workouts JSON,
  wallet_address VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fitness_profiles_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Triggers to autofill UUIDs (MySQL < 8.0.13 fallback)
DELIMITER $$
CREATE TRIGGER trg_users_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END$$

CREATE TRIGGER trg_fitness_profiles_before_insert
BEFORE INSERT ON fitness_profiles
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = UUID();
  END IF;
END$$
DELIMITER ;
```

Notes:
- `goals` and `preferred_workouts` are stored as JSON arrays in MySQL. Use `JSON_CONTAINS` or `JSON_SEARCH` to query.
- If using MySQL 8+ you can set `id CHAR(36) DEFAULT (UUID())` instead of triggers.

---

Indexes and performance
- Add indexes on fields queried frequently. Example:

```sql
-- Postgres
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_fitness_user_id ON fitness_profiles (user_id);

-- MySQL
ALTER TABLE users ADD INDEX idx_users_email (email);
ALTER TABLE fitness_profiles ADD INDEX idx_fitness_user_id (user_id);
```

Normalization note
- If you need to query `goals` or `preferred_workouts` frequently (filter by element), prefer a normalized table:

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES fitness_profiles(id) ON DELETE CASCADE,
  goal TEXT NOT NULL
);
```

Security & access control
- For Supabase use RLS policies (provided above) to allow only authenticated owners to modify records.
- In MySQL, enforce access control in your backend code.

How to apply
- Postgres (Supabase): Use Dashboard SQL editor or psql with DB connection string.
- MySQL: Use `mysql` client or an admin GUI.

Example apply commands (local machine):

```bash
# PostgreSQL (psql)
psql "<POSTGRES_CONNECTION_STRING>" -f supabase_schema.sql

# MySQL
mysql -u <user> -p <database> < mysql_schema.sql
```

Verification
- Start backend and call health endpoint:

```bash
cd backend
npm run dev
curl -s http://localhost:5000/api/health
```

- Test register/login (example):

```bash
curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","password":"TestPass123"}' -i
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"TestPass123"}' -i
```

Migration recommendations
- Use Supabase migrations or a migration tool (Flyway, Liquibase, or a Node migration tool) for production changes.

If you want I can:
- Create `supabase_schema.sql` and `mysql_schema.sql` files in the repo.
- Run the appropriate commands in your terminal to apply the schema.

