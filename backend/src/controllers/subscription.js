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
   AYLIK OTOMATİK ABONELİK BAŞLAT
   - Tek seferlik ödeme yok
   - Direkt aylık otomatik abonelik planı + abonelik oluşturur
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

    const priceString = monthlyPrice.toFixed(2);

    // 1. Aylık otomatik abonelik planı oluştur
    const planRequest = {
      locale: 'tr',
      conversationId: uuidv4(),
      name: `Aylık Abonelik - Kullanıcı ${userId}`,
      price: priceString,
      currencyCode: 'TRY',
      paymentInterval: 'MONTHLY',
      paymentIntervalCount: 1,
      trialPeriodDays: 0,
      subscriptionInitialStatus: 'ACTIVE',
      planReferenceCode: `PLAN_${userId}_${Date.now()}`
    };

    iyzipay.subscriptionPlan.create(planRequest, async (planErr, planResult) => {
      if (planErr || planResult.status !== 'success') {
        console.error('Plan oluşturulamadı:', planErr || planResult);
        return res.status(500).json({ message: 'Plan oluşturulamadı' });
      }

      // 2. Abonelik oluştur (kullanıcıyı iyzico sayfasına yönlendirir)
      const subscriptionRequest = {
        locale: 'tr',
        conversationId: uuidv4(),
        pricingPlanReferenceCode: planResult.referenceCode,
        subscriptionInitialStatus: 'ACTIVE',
        customer: {
          name: 'User',
          surname: 'Test',
          email: sub.email || 'test@example.com',
          identityNumber: '11111111111',
          gsmNumber: sub.phone || '+905555555555'
        },
        callbackUrl: `${process.env.FRONTEND_URL}/payment-callback`
      };

      iyzipay.subscription.create(subscriptionRequest, async (subErr, subResult) => {
        if (subErr || subResult.status !== 'success') {
          console.error('Abonelik oluşturulamadı:', subErr || subResult);
          return res.status(500).json({ message: 'Abonelik oluşturulamadı' });
        }

        // 3. Veritabanını güncelle (ÖDEME OLMADAN PENDING)
        await pool.request()
          .input('user_id', userId)
          .input('plan_ref', planResult.referenceCode)
          .input('sub_ref', subResult.referenceCode)
          .input('checkout_token', subResult.token || '')
          .query(`
            UPDATE Subscriptions 
            SET 
              pricing_plan_reference = @plan_ref,
              iyzico_reference = @sub_ref,
              checkout_token = @checkout_token,
              status = 'pending',
              subscription_start = NULL,
              subscription_end = NULL
            WHERE user_id = @user_id
          `);

        res.json({
          success: true,
          paymentPageUrl: subResult.checkoutFormContentUrl || subResult.paymentPageUrl,
          subscriptionReferenceCode: subResult.referenceCode
        });
      });
    });
  } catch (err) {
    console.error("INIT ERROR:", err);
    res.status(500).json({ message: 'Sunucu hatası' });
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

/* ===============================
   ÖDEME SONRASI DOĞRULAMA (CALLBACK)
   - checkout_token ile retrieve yapılır
   - subscription_end mantığı SENİN İSTEDİĞİN GİBİ
================================ */
export const retrieveCheckout = async (req, res) => {
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
        console.error('Retrieve hatası:', err || result);
        return res.status(400).json({ message: 'Doğrulama başarısız' });
      }

      if (result.paymentStatus === 'SUCCESS') {
        try {
          const pool = await poolPromise;

          // Mevcut abonelik bilgisini çek
          const currentSub = (await pool.request()
            .input('token', token)
            .query(`
              SELECT trial_start, trial_end
              FROM Subscriptions 
              WHERE checkout_token = @token
            `)).recordset[0];

          if (!currentSub) {
            return res.status(404).json({ message: 'Abonelik bulunamadı' });
          }

          const now = new Date();
          let newEndDate = new Date();

          if (currentSub.trial_start && currentSub.trial_end && now >= currentSub.trial_start && now <= currentSub.trial_end) {
            // Deneme içindeyse → trial_end + 1 yıl
            newEndDate = new Date(currentSub.trial_end);
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          } else {
            // Deneme bittikten sonra → şimdi + 1 yıl
            newEndDate.setFullYear(now.getFullYear() + 1);
          }

          await pool.request()
            .input('token', token)
            .input('new_end', newEndDate)
            .query(`
              UPDATE Subscriptions 
              SET 
                  status = 'active',
                  subscription_start = GETDATE(),
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
   - 1 yıl içinde hayvan sayısı değiştirme
   - Ödeme sayfasına gitmeden DB güncellenir
   - iyzico otomatik kesimde yeni tutar geçerli olur
================================ */
export const updateAnimalCount = async (req, res) => {
  const userId = req.user.id;
  const { buyukbas_count = 0, kucukbas_count = 0 } = req.body;

  try {
    const pool = await poolPromise;

    const subResult = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT status, subscription_end
        FROM Subscriptions 
        WHERE user_id = @user_id
      `);

    const sub = subResult.recordset[0];

    if (!sub) {
      return res.status(404).json({ message: 'Abonelik bulunamadı' });
    }

    if (sub.status !== 'active') {
      return res.status(400).json({ message: 'Abonelik aktif değil' });
    }

    if (new Date() > new Date(sub.subscription_end)) {
      return res.status(400).json({ message: 'Abonelik süresi dolmuş, yenileme yapmalısınız' });
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
    console.error("UPDATE ANIMAL COUNT ERROR:", err);
    res.status(500).json({ message: 'Güncelleme hatası' });
  }
};
