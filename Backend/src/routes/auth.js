// backend/src/routes/auth.js
import express from 'express';
import { loginUser, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', loginUser);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

export default router;
