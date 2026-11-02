import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
export const authRoutes = Router();
authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', authenticate, logout);
authRoutes.get('/me', authenticate, me);
