import express from 'express';
import { createArea, getAreas } from '../controllers/area.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createArea);
router.get('/', authMiddleware, getAreas);

export default router;
