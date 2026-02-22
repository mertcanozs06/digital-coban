import { poolPromise } from '../config/db.js';
import iyzipay from '../config/iyzico.js';
import { v4 as uuidv4 } from 'uuid';

/* ===============================
   iyzico tarih formatı helper
================================ */
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

/* ===============================
   YILLIK TEK SEFERLİK İLK ÖDEME BAŞLAT
   - Aylık fiyat × 12 = yıllık tutar
   - Tek seferlik ödeme (checkoutFormInitialize.create)
   - Ödeme olmadan status 'pending' kalır
================================ */
export const initializeCheckout = async (req, res) => {
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

    if (sub.status === 'active') {
      return res.status(400).json({ message: 'Abonelik zaten aktif' });
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
      basketId: `YEARLY_${userId}_${Date.now()}`,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
     callbackUrl: `http://127.0.0.1:5000/api/subscriptions/callback`,

      buyer: {
        id: userId.toString(),
        name: 'Kullanıcı',
        surname: 'Test',
        identityNumber: '11111111111',
        email: sub.email || 'zorunlu@email.com',
        gsmNumber: sub.phone || '+905551234567',
        registrationDate: formatDate(new Date()),
        lastLoginDate: formatDate(new Date()),
        registrationAddress: sub.address || 'Test Adres, İstanbul, Türkiye',
        city: 'İstanbul',
        country: 'Turkey',
        zipCode: '34000',
        ip: req.ip
      },

      billingAddress: {
        contactName: 'Fatura Adı Soyadı',
        city: 'İstanbul',
        country: 'Turkey',
        address: sub.address || 'Test Fatura Adresi, İstanbul, Türkiye',
        zipCode: '34000'
      },

      shippingAddress: {
        contactName: 'Teslimat Adı Soyadı',
        city: 'İstanbul',
        country: 'Turkey',
        address: sub.address || 'Test Teslimat Adresi, İstanbul, Türkiye',
        zipCode: '34000'
      },

      basketItems: [{
        id: 'YEARLY-001',
        name: 'Digital Çoban Yıllık Abonelik',
        category1: 'Servis',
        itemType: 'VIRTUAL',
        price: yearlyPrice
      }]
    };

    iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
      if (err) {
        console.error('iyzico ERR:', err);
        return res.status(500).json({ message: 'iyzico çağrı hatası', error: err.message });
      }

      if (result.status !== 'success') {
        console.error('Yıllık ödeme başlatılamadı:', result);
        return res.status(500).json({ message: 'Yıllık ödeme başlatılamadı', iyzicoError: result.errorMessage });
      }

      // DB'yi pending yap
      await pool.request()
        .input('user_id', userId)
        .input('checkout_token', result.token || '')
        .query(`
          UPDATE Subscriptions 
          SET 
            checkout_token = @checkout_token,
            status = 'pending',
            subscription_start = NULL,
            subscription_end = NULL
          WHERE user_id = @user_id
        `);

      res.json({
        success: true,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token
      });
    });
  } catch (err) {
    console.error("INITIALIZE CHECKOUT ERROR:", err.message, err.stack);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
};

/* ===============================
   ÖDEME SONRASI DOĞRULAMA (CALLBACK)
   - Trial içinde ise trial_end +1 yıl, değilse now +1 yıl
================================ */
export const retrieveCheckout = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token gerekli' });
  }

  iyzipay.checkoutForm.retrieve(
    { locale: 'tr', token },
    async (err, result) => {
      if (err || result.status !== 'success') {
        console.error('Retrieve hatası:', err || result);
        return res.status(400).json({ message: 'Doğrulama başarısız' });
      }

      if (result.paymentStatus === 'SUCCESS') {
        try {
          const pool = await poolPromise;

          const currentSub = (await pool.request()
            .input('token', token)
            .query(`
              SELECT trial_end, status, trial_start
              FROM Subscriptions 
              WHERE checkout_token = @token
            `)).recordset[0];

          if (!currentSub) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
          }

          const now = new Date();
          let newStart = new Date(now);
          let newEndDate = new Date(newStart);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);

          if (currentSub.status === 'trial' && 
              currentSub.trial_start && 
              currentSub.trial_end && 
              now >= new Date(currentSub.trial_start) && 
              now <= new Date(currentSub.trial_end)) {
            // Trial içindeyse trial_end +1 yıl
            newStart = new Date(currentSub.trial_end);
            newEndDate = new Date(newStart);
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          }

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
            message: 'Ödeme başarılı, abonelik aktif edildi',
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

/* ===============================
   HAYVAN SAYISI GÜNCELLEME
   - Trial veya active ise çalışır
   - Süre dolmadıysa hayvan sayısını değiştirir
================================ */
export const updateAnimalCount = async (req, res) => {
  const userId = req.user.id;
  const { buyukbas_count = 0, kucukbas_count = 0 } = req.body;

  try {
    const pool = await poolPromise;

    const subResult = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT status, subscription_end, trial_end, trial_start
        FROM Subscriptions 
        WHERE user_id = @user_id
      `);

    const sub = subResult.recordset[0];

    if (!sub) {
      return res.status(404).json({ message: 'Abonelik bulunamadı' });
    }

    if (sub.status !== 'active' && sub.status !== 'trial') {
      return res.status(400).json({ message: 'Abonelik aktif veya deneme değil' });
    }

    const endDate = sub.status === 'active' ? sub.subscription_end : sub.trial_end;
    const startDate = sub.status === 'active' ? sub.subscription_start : sub.trial_start;

    if (!endDate || new Date() > new Date(endDate)) {
      return res.status(400).json({ message: 'Süre dolmuş, yenileme yapmalısınız' });
    }

    const buyukbasPrice = 1200;
    const kucukbasPrice = 700;
    const totalMonthly = (buyukbas_count * buyukbasPrice) + (kucukbas_count * kucukbasPrice);

    await pool.request()
      .input('user_id', userId)
      .input('buyukbas_count', buyukbas_count)
      .input('kucukbas_count', kucukbas_count)
      .input('monthly_price', totalMonthly)
      .query(`
        UPDATE Subscriptions 
        SET 
          buyukbas_count = @buyukbas_count,
          kucukbas_count = @kucukbas_count,
          monthly_price = @monthly_price
        WHERE user_id = @user_id
      `);

    res.json({
      success: true,
      message: 'Hayvan sayısı güncellendi',
      new_monthly_price: totalMonthly
    });
  } catch (err) {
    console.error("UPDATE ANIMAL COUNT ERROR:", err.message, err.stack);
    res.status(500).json({ message: 'Güncelleme hatası', error: err.message });
  }
};

/* ===============================
   ABONELİK DURUMU
================================ */
export const getStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT status, trial_start, trial_end, subscription_start, subscription_end, monthly_price 
        FROM Subscriptions 
        WHERE user_id = @user_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Abonelik yok' });
    }

    res.json(result.recordset[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};