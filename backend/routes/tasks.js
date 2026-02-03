import express from 'express';
import { 
  getTodayTasks, 
  getUserTasks, 
  completeTask, 
  createTask, 
  deleteTask,
  generateMLTaskForUser,
  generateMLTasksBatch
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - all require authentication
router.get('/today', authenticate, getTodayTasks);
router.get('/', authenticate, getUserTasks);
router.post('/complete', authenticate, completeTask);
router.post('/', authenticate, createTask);
router.delete('/:taskId', authenticate, deleteTask);

// ML task generation routes
router.post('/generate-ml', authenticate, generateMLTaskForUser);
router.post('/generate-ml-batch', authenticate, generateMLTasksBatch);

export default router;
