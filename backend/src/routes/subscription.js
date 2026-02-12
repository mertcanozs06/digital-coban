import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { initializeCheckout, getStatus } from '../controllers/subscription.js';

const router = Router();

router.post('/initialize', authMiddleware, initializeCheckout);
router.get('/status', authMiddleware, getStatus);

export default router;