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
   ÖDEME BAŞLAT
================================ */
export const initializeCheckout = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await poolPromise;

    const subResult = await pool.request()
      .input('user_id', userId)
      .query(`SELECT * FROM Subscriptions WHERE user_id = @user_id`);

    const sub = subResult.recordset[0];

    if (!sub) {
      return res.status(404).json({ message: 'Abonelik bulunamadi' });
    }

    if (sub.status === 'active') {
      return res.status(400).json({ message: 'Abonelik zaten aktif' });
    }

    const price = Number(sub.monthly_price);

    if (!price || isNaN(price)) {
      return res.status(400).json({ message: 'Gecersiz fiyat' });
    }

    const priceString = price.toFixed(2);

    const request = {
      locale: 'tr',
      conversationId: uuidv4(),
      price: priceString,
      paidPrice: priceString,
      currency: 'TRY',
      installment: "1",
      basketId: `BASKET_${userId}_${Date.now()}`,
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: "http://localhost:5000/api/subscriptions/callback",

      buyer: {
        id: userId.toString(),
        name: 'User',
        surname: 'Test',
        identityNumber: '11111111111',
        email: 'test@example.com',
        gsmNumber: '+905555555555',
        registrationDate: formatDate(),
        lastLoginDate: formatDate(),
        registrationAddress: 'Turkey',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34000',
        ip: '85.110.245.12'
      },

      shippingAddress: {
        contactName: 'User Test',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Online Service'
      },

      billingAddress: {
        contactName: 'User Test',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Online Service'
      },

      basketItems: [
        {
          id: 'SUBSCRIPTION-001',
          name: 'Digital Coban Abonelik',
          category1: 'Abonelik',
          category2: 'Yazilim',
          itemType: 'VIRTUAL',
          price: priceString
        }
      ]
    };

    iyzipay.checkoutFormInitialize.create(request, async (err, result) => {

      if (err || result.status !== 'success') {
        console.error('iyzico initialize hatasi:', err || result);
        return res.status(500).json({
          message: result?.errorMessage || err?.message || 'Odeme baslatilamadi'
        });
      }

      await pool.request()
        .input('user_id', userId)
        .input('checkout_token', result.token)
        .query(`
          UPDATE Subscriptions 
          SET iyzico_reference = @checkout_token 
          WHERE user_id = @user_id
        `);

      return res.json({
        success: true,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token
      });
    });

  } catch (err) {
    console.error("INIT ERROR:", err);
    res.status(500).json({ message: 'Sunucu hatasi' });
  }
};

/* ===============================
   ABONELIK DURUMU
================================ */
export const getStatus = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT status, trial_end, monthly_price 
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
   ODEME SONRASI DOGrULAMA
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
        console.error('Retrieve hatasi:', err || result);
        return res.status(400).json({ message: 'Dogrulama basarisiz' });
      }

      if (result.paymentStatus === 'SUCCESS') {
        try {
          const pool = await poolPromise;

          await pool.request()
            .input('token', token)
            .query(`
              UPDATE Subscriptions 
              SET status = 'active',
                  subscription_start = GETDATE(),
                  subscription_end = DATEADD(year, 1, GETDATE())
              WHERE iyzico_reference = @token
            `);

          return res.json({
            success: true,
            message: 'Odeme basarili, abonelik aktif'
          });

        } catch (dbErr) {
          console.error("DB UPDATE ERROR:", dbErr);
          return res.status(500).json({ message: 'DB guncelleme hatasi' });
        }

      } else {
        return res.json({
          success: false,
          message: 'Odeme basarisiz veya beklemede'
        });
      }
    }
  );
};
