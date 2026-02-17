import { Router } from 'express';
import authMiddleware from '../middleware/auth.js';
import { initializeCheckout, getStatus, retrieveCheckout } from '../controllers/subscription.js';
import iyzipay from '../config/iyzico.js';
const router = Router();

router.post('/initialize', authMiddleware, initializeCheckout);
router.get('/status', authMiddleware, getStatus);
router.post('/retrieve', retrieveCheckout); // ← YENİ – callback için auth'suz (iyzico'dan geliyor)
router.post('/callback', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.redirect('http://localhost:5173/login');
  }

  iyzipay.checkoutForm.retrieve(
    { token },
    (err, result) => {
      if (err || result.status !== 'success') {
        return res.redirect('http://localhost:5173/login');
      }

      // başarılıysa frontend'e yönlendir
      res.redirect(`http://localhost:5173/payment-callback?token=${token}`);
      console.log("CALLBACK BODY:", req.body);
    }
  );
});

export default router;