import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import ranksRoutes from './routes/ranks.js';
import taskRoutes from './routes/tasks.js';
import { initXpRolloverService, triggerRollover } from './services/xpRollover.js';
import { initializeTaskScheduler } from './services/taskScheduler.js';
import { Pool } from 'pg';

dotenv.config();

console.log('Environment loaded. NODE_ENV:', process.env.NODE_ENV);
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? process.env.POSTGRES_URL.replace(/:.*@/, ':****@') : 'NOT SET');

const app = express();

// Initialize database pool for services
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

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
      'https://your-vercel-app.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ranks', ranksRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend server is running' });
});

// Manual XP rollover trigger (for testing/admin)
app.post('/api/admin/rollover', async (req, res) => {
  try {
    await triggerRollover();
    res.json({ message: 'XP rollover completed successfully' });
  } catch (error) {
    console.error('Error triggering rollover:', error);
    res.status(500).json({ message: 'Rollover failed', error: error.message });
  }
});

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

const PORT = process.env.PORT || 5000;
// Bind to 0.0.0.0 so the server is reachable from other machines on the LAN
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
