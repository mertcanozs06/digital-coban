import { Router } from 'express';
import { getApplications, getStats, getDealers, getFarmers, getInstallations, generateActivationCode, terminateContract, reassignInstallation } from '../controllers/admin.js';
import auth from '../middleware/auth.js';

const router = Router();

// Tüm admin rotaları auth gerektirir (aslında admin yetkisi de bakılmalı ama şimdilik auth yeterli)
router.use(auth);

router.get('/applications', getApplications);
router.get('/stats', getStats);
router.get('/dealers', getDealers);
router.get('/farmers', getFarmers);
router.get('/installations', getInstallations);
router.post('/generate-code', generateActivationCode);
router.post('/terminate-contract', terminateContract);
router.post('/reassign-installation', reassignInstallation);

export default router;
