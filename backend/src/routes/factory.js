import { Router } from 'express';
import { getStockRequests, updateStockRequestStatus } from '../controllers/factory.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

router.get('/stock-requests', getStockRequests);
router.post('/update-stock-request', updateStockRequestStatus);

export default router;
