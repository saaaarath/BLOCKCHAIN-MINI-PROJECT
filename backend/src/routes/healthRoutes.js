import { Router } from 'express';
import { healthCheck } from '../controllers/healthController.js';

export const healthRoutes = Router();
healthRoutes.get('/', healthCheck);
