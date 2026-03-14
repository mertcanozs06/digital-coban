import { Router } from 'express';
import { getFactories, createStockRequest, getStockRequests, confirmStockArrival, getInstallations, submitActivationCode, getAllFarmers, createInstallation } from '../controllers/dealer.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

router.get('/factories', getFactories);
router.post('/stock-request', createStockRequest);
router.get('/stock-requests', getStockRequests);
router.post('/confirm-stock', confirmStockArrival);
router.get('/installations', getInstallations);
router.post('/activate', submitActivationCode);
router.get('/farmers', getAllFarmers);
router.post('/create-installation', createInstallation);

export default router;
