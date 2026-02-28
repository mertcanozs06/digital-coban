import express from 'express';
import {
  addAnimal,
  getAnimals,
  renameAnimal,
  toggleLocation
} from '../controllers/animal.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, addAnimal);
router.get('/', authMiddleware, getAnimals);
router.put('/rename', authMiddleware, renameAnimal);          // ← /rename (body'de code var)
router.put('/toggle-location', authMiddleware, toggleLocation); // ← /toggle-location (body'de code var)

export default router;
