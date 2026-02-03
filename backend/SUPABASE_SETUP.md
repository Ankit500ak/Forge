# Supabase Authentication Setup Guide

## Overview
This backend has been configured to use Supabase for authentication and data storage. Supabase provides:
- User authentication (sign up, login, password management)
- Secure database with Row-Level Security (RLS)
- Real-time capabilities (optional)

## Prerequisites
1. Create a free Supabase account at https://supabase.com
2. Create a new Supabase project

## Setup Steps

### 1. Get Supabase Credentials
- Go to your Supabase project settings
- Navigate to **Settings > API**
- Copy:
  - **Project URL** (e.g., `https://your-project.supabase.co`)
  - **Anon Public Key** (found under "Anon (public)" section)

### 2. Configure Environment Variables
Update `.env` file in the backend directory with:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Create Database Schema
- Go to your Supabase project dashboard
- Navigate to **SQL Editor**
- Create a new query
- Copy and paste the contents from `config/supabase-schema.sql`
- Run the query to create the `users` table and policies

### 4. Enable Email/Password Authentication
- Go to **Authentication > Providers**
- Ensure **Email** provider is enabled
- Configure email settings if needed

### 5. Test the Authentication

#### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

## API Endpoints

### POST `/api/auth/register`
Register a new user
- **Request:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User registered successfully",
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```

### POST `/api/auth/login`
Login user
- **Request:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful",
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```

### POST `/api/auth/logout`
Logout user
- **Response:**
  ```json
  {
    "message": "Logout successful"
  }
  ```

## Protected Routes
To access protected routes, include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Security Notes
- Passwords are managed securely by Supabase Auth
- JWT tokens have an expiration (default: 7 days)
- Enable Row-Level Security (RLS) policies for data protection
- Keep your `SUPABASE_ANON_KEY` and `JWT_SECRET` confidential
- Never commit `.env` file to version control

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env` file exists in the backend directory
- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly

### "User already exists"
- Try registering with a different email address
- Or delete the user from Supabase dashboard

### "Invalid credentials"
- Double-check your email and password
- Ensure the user exists in Supabase

## Next Steps
- Set up email confirmation in Supabase Authentication settings
- Configure OAuth providers (Google, GitHub, etc.)
- Add additional user profile fields to the users table
- Set up real-time subscriptions for live data updates
