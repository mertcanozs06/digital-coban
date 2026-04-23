import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { initializeCheckout, getStatus, retrieveCheckout , updateAnimalCount} from '../controllers/subscription.js';
import iyzipay from '../config/iyzico.js';
import { startRenewal, verifyRenewal } from '../controllers/subscriptionRenewal.js';

const router = Router();

router.post('/initialize', authMiddleware, initializeCheckout);
router.get('/status', authMiddleware, getStatus);
router.post('/retrieve', retrieveCheckout); // ← YENİ – callback için auth'suz (iyzico'dan geliyor)
router.post('/callback', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.redirect('http://localhost:5173/login');
  }

  // frontend'e yönlendiriyoruz
  return res.redirect(`http://localhost:5173/payment-callback?token=${token}`);
});

router.post('/update-animals', authMiddleware, updateAnimalCount);

// YENİ yenileme endpoint'leri
router.post('/renew', authMiddleware, startRenewal);
router.post('/renew/verify', verifyRenewal);

router.post('/renew/callback', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.redirect('http://localhost:5173/login');
  }

  // frontend'e yönlendiriyoruz
  return res.redirect(`http://localhost:5173/renewal-callback?token=${token}`);
});





export default router;