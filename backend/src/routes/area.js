import express from 'express';
import { createArea, getAreas, checkAnimalInArea } from '../controllers/area.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, createArea);
router.get('/', authMiddleware, getAreas);
router.post('/check-animal', authMiddleware, checkAnimalInArea);  // ← Yeni endpoint

export default router;
