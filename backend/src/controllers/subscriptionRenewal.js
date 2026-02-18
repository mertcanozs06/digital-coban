import { poolPromise } from '../config/db.js';
import iyzipay from '../config/iyzico.js';
import { v4 as uuidv4 } from 'uuid';

/* ===============================
   PAKET YENİLEME ÖDEMESİ BAŞLAT
   - Tek seferlik yenileme ödemesi
   - Ödeme başarılı olunca 1 yıl uzatma
================================ */
export const startRenewal = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await poolPromise;

    const subResult = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT s.*, u.email, u.phone, u.address 
        FROM Subscriptions s
        LEFT JOIN Users u ON s.user_id = u.id
        WHERE s.user_id = @user_id
      `);

    const sub = subResult.recordset[0];

    if (!sub) {
      return res.status(404).json({ message: 'Abonelik bulunamadı' });
    }

    if (sub.status !== 'active') {
      return res.status(400).json({ message: 'Abonelik aktif değil' });
    }

    const monthlyPrice = Number(sub.monthly_price || 0);
    if (!monthlyPrice || isNaN(monthlyPrice)) {
      return res.status(400).json({ message: 'Geçersiz fiyat' });
    }

    const priceString = monthlyPrice.toFixed(2);

    const request = {
      locale: 'tr',
      conversationId: uuidv4(),
      price: priceString,
      paidPrice: priceString,
      currency: 'TRY',
      installment: '1',
      basketId: `RENEW_${userId}_${Date.now()}`,
      paymentChannel: 'WEB',
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: `${process.env.FRONTEND_URL}/renewal-callback`,

      buyer: {
        id: userId.toString(),
        name: 'Ad Soyad',
        surname: 'Soyad',
        identityNumber: '12345678901',
        email: sub.email || 'user@email.com',
        gsmNumber: sub.phone || '+905xxxxxxxxx',
        registrationDate: new Date().toISOString(),
        lastLoginDate: new Date().toISOString(),
        registrationAddress: sub.address || 'Adres',
        city: 'İstanbul',
        country: 'Turkey',
        zipCode: '34000',
        ip: req.ip
      },

      basketItems: [{
        id: 'RENEWAL-001',
        name: 'Digital Çoban Yenileme (1 Yıl)',
        category1: 'Servis',
        itemType: 'VIRTUAL',
        price: priceString
      }]
    };

    iyzipay.checkoutForm.initialize(request, async (err, result) => {
      if (err || result.status !== 'success') {
        console.error('Yenileme başlatılamadı:', err || result);
        return res.status(500).json({ error: err?.message || result?.errorMessage });
      }

      res.json({
        success: true,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token
      });
    });
  } catch (err) {
    console.error("RENEW INIT ERROR:", err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/* ===============================
   YENİLEME ÖDEME DOĞRULAMA
   - Mevcut subscription_end'in 1 saniye sonrası yeni start
   - Yeni start + 1 yıl = yeni end
================================ */
export const verifyRenewal = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token gerekli' });
  }

  iyzipay.checkoutForm.retrieve(
    {
      locale: 'tr',
      token
    },
    async (err, result) => {
      if (err || result.status !== 'success') {
        console.error('Yenileme retrieve hatası:', err || result);
        return res.status(400).json({ message: 'Doğrulama başarısız' });
      }

      if (result.paymentStatus === 'SUCCESS') {
        try {
          const pool = await poolPromise;

          // Mevcut abonelik bilgisini çek
          const currentSub = (await pool.request()
            .input('token', token)
            .query(`
              SELECT subscription_end
              FROM Subscriptions 
              WHERE checkout_token = @token
            `)).recordset[0];

          if (!currentSub) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
          }

          // Senin istediğin mantık: subscription_end'in 1 saniye sonrası yeni start
          const oldEnd = new Date(currentSub.subscription_end);
          const newStart = new Date(oldEnd);
          newStart.setSeconds(newStart.getSeconds() + 1); // 1 saniye sonrası

          // Yeni start + 1 yıl = yeni end
          const newEndDate = new Date(newStart);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);

          await pool.request()
            .input('token', token)
            .input('new_start', newStart)
            .input('new_end', newEndDate)
            .query(`
              UPDATE Subscriptions 
              SET 
                  status = 'active',
                  subscription_start = @new_start,
                  subscription_end = @new_end
              WHERE checkout_token = @token
            `);

          return res.json({
            success: true,
            message: 'Yenileme başarılı, abonelik 1 yıl uzatıldı',
            subscription_start: newStart.toISOString(),
            subscription_end: newEndDate.toISOString()
          });
        } catch (dbErr) {
          console.error("DB UPDATE ERROR:", dbErr);
          return res.status(500).json({ message: 'DB güncelleme hatası' });
        }
      } else {
        return res.json({
          success: false,
          message: 'Ödeme başarısız veya beklemede'
        });
      }
    }
  );
};
