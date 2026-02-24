import { poolPromise } from '../config/db.js';
import iyzipay from '../config/iyzico.js';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

function formatDate(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => n.toString().padStart(2, '0');

  return (
    d.getFullYear() + '-' +
    pad(d.getMonth() + 1) + '-' +
    pad(d.getDate()) + ' ' +
    pad(d.getHours()) + ':' +
    pad(d.getMinutes()) + ':' +
    pad(d.getSeconds())
  );
}

/* =========================================
   YILLIK YENİLEME BAŞLAT
========================================= */
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

    const yearlyPrice = (monthlyPrice * 12).toFixed(2);

    const request = {
      locale: 'tr',
      conversationId: uuidv4(),
      price: yearlyPrice,
      paidPrice: yearlyPrice,
      currency: 'TRY',
      installment: '1',
      basketId: `RENEW_${userId}_${Date.now()}`,
      paymentChannel: 'WEB',
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: "http://localhost:5000/api/subscriptions/renew/verify",

      buyer: {
        id: userId.toString(),
        name: 'Ad',
        surname: 'Soyad',
        identityNumber: '12345678901',
        email: sub.email,
        gsmNumber: sub.phone || '+905551234567',
        registrationDate: formatDate(new Date()),
        lastLoginDate: formatDate(new Date()),
        registrationAddress: sub.address || 'İstanbul',
        city: 'İstanbul',
        country: 'Turkey',
        zipCode: '34000',
        ip: req.ip
      },

      billingAddress: {
        contactName: 'Ad Soyad',
        city: 'İstanbul',
        country: 'Turkey',
        address: sub.address || 'İstanbul',
        zipCode: '34000'
      },

      shippingAddress: {
        contactName: 'Ad Soyad',
        city: 'İstanbul',
        country: 'Turkey',
        address: sub.address || 'İstanbul',
        zipCode: '34000'
      },

      basketItems: [{
        id: 'RENEWAL-001',
        name: 'Digital Çoban Yıllık Yenileme',
        category1: 'Servis',
        itemType: 'VIRTUAL',
        price: yearlyPrice
      }]
    };

    iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
      if (err) {
        console.error('iyzico ERR:', err);
        return res.status(500).json({ message: 'iyzico çağrı hatası' });
      }

      if (result.status !== 'success') {
        console.error('Yenileme başlatılamadı:', result);
        return res.status(500).json({ message: result.errorMessage });
      }

      /* 🔥 TOKEN DB'YE KAYDEDİLİYOR */
      await pool.request()
        .input('user_id', userId)
        .input('token', result.token)
        .query(`
          UPDATE Subscriptions
          SET checkout_token = @token
          WHERE user_id = @user_id
        `);

      return res.json({
        success: true,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token
      });
    });

  } catch (err) {
    console.error("RENEW INIT ERROR:", err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};


/* =========================================
   YENİLEME DOĞRULAMA
========================================= */
export const verifyRenewal = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token gerekli' });
  }

  iyzipay.checkoutForm.retrieve(
    { locale: 'tr', token },
    async (err, result) => {

      if (err || result.status !== 'success') {
        console.error("Retrieve hata:", err || result);
        return res.status(400).json({ message: 'Doğrulama başarısız' });
      }

      if (result.paymentStatus !== 'SUCCESS') {
        return res.json({
          success: false,
          message: 'Ödeme başarısız veya beklemede'
        });
      }

      try {
        const pool = await poolPromise;

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

        const oldEnd = new Date(currentSub.subscription_end);
        const newStart = new Date(oldEnd);
        newStart.setSeconds(newStart.getSeconds() + 1);

        const newEnd = new Date(newStart);
        newEnd.setFullYear(newEnd.getFullYear() + 1);

        await pool.request()
          .input('token', token)
          .input('new_start', newStart)
          .input('new_end', newEnd)
          .query(`
            UPDATE Subscriptions
            SET 
              subscription_start = @new_start,
              subscription_end = @new_end,
              status = 'active',
              checkout_token = NULL
            WHERE checkout_token = @token
          `);

        return res.json({
          success: true,
          message: 'Yenileme başarılı, abonelik 1 yıl uzatıldı',
          subscription_start: newStart.toISOString(),
          subscription_end: newEnd.toISOString()
        });

      } catch (dbErr) {
        console.error("DB UPDATE ERROR:", dbErr);
        return res.status(500).json({ message: 'DB güncelleme hatası' });
      }
    }
  );
};