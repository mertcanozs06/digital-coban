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
router.put('/:id/rename', authMiddleware, renameAnimal);
router.put('/:id/toggle-location', authMiddleware, toggleLocation);

export default router;