import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { doctorDashboard, patientDashboard } from '../controllers/dashboardController.js';
export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);
dashboardRoutes.get('/patient', authorize('PATIENT'), patientDashboard);
dashboardRoutes.get('/doctor', authorize('DOCTOR'), doctorDashboard);
