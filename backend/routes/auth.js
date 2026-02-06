import express from 'express';
import { 
  register, 
  login, 
  logout,
  initializeUserData
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/initialize', authenticate, initializeUserData);

export default router;
