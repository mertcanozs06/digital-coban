import { Router } from 'express';
import { getApplications, getStats } from '../controllers/admin.js';

const router = Router();
router.get('/applications', getApplications);
router.get('/stats', getStats);

export default router;
