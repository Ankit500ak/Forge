import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import ranksRoutes from './routes/ranks.js';
import taskRoutes from './routes/tasks.js';
import debugRoutes from './routes/debug.js';
import foodRoutes from './routes/food.js';
import cameraRoutes from './routes/camera.js';
import { initXpRolloverService, triggerRollover } from './services/xpRollover.js';
import { initializeTaskScheduler } from './services/taskScheduler.js';
import { runMigrations } from './migrations.js';
import { Pool } from 'pg';

dotenv.config();

console.log('═════════════════════════════════════════════════════════════════════════════');
console.log('🚀 Environment loaded. NODE_ENV:', process.env.NODE_ENV);
console.log('🔗 POSTGRES_URL:', process.env.POSTGRES_URL ? process.env.POSTGRES_URL.replace(/:.*@/, ':****@') : 'NOT SET');
console.log('═════════════════════════════════════════════════════════════════════════════');

const app = express();

// Initialize database pool for services
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection with retry logic
const testDatabaseConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Connected to PostgreSQL database!');
      console.log('✅ Database time:', result.rows[0].now);
      return true;
    } catch (err) {
      console.error(`❌ Connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  console.error('❌ Failed to connect to PostgreSQL after all retries');
  return false;
};

testDatabaseConnection();

// Run database migrations
console.log('🔄 Running database migrations...');
await runMigrations();
console.log('✅ Migrations complete!\n');

// Initialize XP rollover service
initXpRolloverService(pool);

// Initialize Task Scheduler (resets tasks at 12 PM daily)
initializeTaskScheduler();

// Middleware
// Allow configuring CORS origins via CORS_ORIGINS (comma-separated). If not set, allow all origins.
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : null;
if (corsOrigins) {
  app.use(cors({ origin: corsOrigins, credentials: true }));
} else {
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://forge-jhsr.vercel.app' // <-- Add your deployed Vercel frontend URL here
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`➡️  [${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check (place BEFORE other /api routes)
app.get('/api/health', (req, res) => {
  console.log('✅ /api/health checked - server is healthy!');
  res.json({ status: 'Backend server is running ✅' });
});

// Routes
console.log('[Server] Mounting auth routes on /api/auth');
app.use('/api/auth', authRoutes);
console.log('[Server] Mounting users routes on /api/users');
app.use('/api/users', userRoutes);
console.log('[Server] Mounting ranks routes on /api/ranks');
app.use('/api/ranks', ranksRoutes);
console.log('[Server] Mounting tasks routes on /api/tasks');
app.use('/api/tasks', taskRoutes);
console.log('[Server] Mounting debug routes on /api/debug');
app.use('/api/debug', debugRoutes);
console.log('[Server] Mounting food detection routes on /api/food');
app.use('/api/food', foodRoutes);
console.log('[Server] Mounting camera routes on /api/camera');
app.use('/api/camera', cameraRoutes);

// ════════════════════════════════════════════════════════════════════════════
// Admin endpoints for task scheduler (DAILY RESET AT 12 PM)
// ════════════════════════════════════════════════════════════════════════════

app.post('/api/admin/tasks/reset-now', async (req, res) => {
  try {
    console.log('[Admin] Manually resetting all tasks...');
    const { resetAllTasksDaily } = await import('./services/taskScheduler.js');
    await resetAllTasksDaily();
    res.json({ message: '✅ All tasks have been reset successfully!' });
  } catch (error) {
    console.error('Error resetting tasks:', error);
    res.status(500).json({
      message: 'Task reset failed',
      error: error.message
    });
  }
});

app.get('/api/admin/tasks/next-reset', async (req, res) => {
  try {
    const { getNextResetTime } = await import('./services/taskScheduler.js');
    const nextReset = getNextResetTime();
    res.json({
      nextResetTime: nextReset.toLocaleString(),
      message: 'Tasks will reset at 12:00 PM (noon) daily',
      schedule: '0 12 * * *'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler for debugging
app.use((req, res) => {
  console.error(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  console.error(`[404] Available base paths: /api/auth, /api/users, /api/ranks, /api/tasks, /api/debug, /api/food, /api/camera`);
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availablePaths: ['/api/auth', '/api/users', '/api/ranks', '/api/tasks', '/api/debug', '/api/food', '/api/camera', '/api/health', '/api/admin']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

app.get('/', (req, res) => {
  res.send('API server is running');
});

const PORT = process.env.PORT || 5000;
// Bind to 0.0.0.0 so the server is reachable from other machines on the LAN
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log('═════════════════════════════════════════════════════════════════════════════');
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log('═════════════════════════════════════════════════════════════════════════════');
});
