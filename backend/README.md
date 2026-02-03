# Fitness App Backend

Backend server for the Fitness App with JWT authentication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

## Running the Server

### Development mode (with hot reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register a new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```

- **POST** `/api/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **POST** `/api/auth/logout` - Logout user

### Users (Protected Routes)
- **GET** `/api/users/me` - Get current user profile
- **PUT** `/api/users/:id` - Update user profile

### Health Check
- **GET** `/api/health` - Check server status

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After login/register, include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Project Structure

```
backend/
├── controllers/     # Business logic
├── middleware/      # Authentication & other middleware
├── models/          # Data models (add MongoDB models here)
├── routes/          # API routes
├── config/          # Configuration files
├── server.js        # Main server file
├── package.json
└── .env.example
```
