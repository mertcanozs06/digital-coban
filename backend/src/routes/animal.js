import express from "express";
import { getAnimals , addAnimal } from "../controllers/animal.js";
import authMiddleware from "../middleware/auth.js"
const router = express.Router();


router.post('/animals', authMiddleware, addAnimal);
router.get('/animals', authMiddleware, getAnimals);

export default router;
