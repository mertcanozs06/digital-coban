import {Router} from 'express';
import {register , login, applyPartner, approvePartner, me} from '../controllers/auth.js';

const router =Router();
router.post('/register', register);
router.post('/login', login);
router.post('/apply', applyPartner);
router.post('/approve', approvePartner);
router.get('/me', me);

export default router;
