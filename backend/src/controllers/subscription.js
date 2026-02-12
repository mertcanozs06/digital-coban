import { poolPromise } from '../config/db.js';
import iyzipay from '../config/iyzico.js';
import { v4 as uuidv4 } from 'uuid';

export const initializeCheckout = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await poolPromise;
    const sub = (await pool.request()
      .input('user_id', userId)
      .query(`SELECT * FROM Subscriptions WHERE user_id = @user_id`)).recordset[0];

    if (!sub) return res.status(404).json({ message: 'Abonelik bulunamadı' });

    if (new Date() < new Date(sub.trial_end)) {
      return res.status(400).json({ message: 'Deneme süresi devam ediyor' });
    }

    if (sub.status === 'active') {
      return res.status(400).json({ message: 'Abonelik zaten aktif' });
    }

    const request = {
      locale: 'tr',
      conversationId: uuidv4(),
      price: sub.monthly_price.toFixed(2),
      paidPrice: sub.monthly_price.toFixed(2),
      currency: 'TRY',
      installment: '1',
      basketId: `basket-${userId}-${Date.now()}`,
      paymentChannel: 'WEB',
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: `${process.env.FRONTEND_URL}/payment-callback`,
      enabledInstallments: [1, 2, 3, 6, 9],

      buyer: {
        id: userId.toString(),
        name: 'Ad Soyad', // DB'den çekilebilir
        surname: 'Soyad',
        identityNumber: '12345678901',
        email: 'user@email.com',
        gsmNumber: '+905xxxxxxxxx',
        registrationDate: new Date().toISOString(),
        lastLoginDate: new Date().toISOString(),
        registrationAddress: 'Adres',
        city: 'İstanbul',
        country: 'Turkey',
        zipCode: '34000',
        ip: req.ip
      },

      basketItems: [{
        id: 'SUBSCRIPTION-001',
        name: 'Digital Çoban Abonelik',
        category1: 'Servis',
        itemType: 'VIRTUAL',
        price: sub.monthly_price.toFixed(2)
      }]
    };

    iyzipay.checkoutForm.initialize(request, (err, result) => {
      if (err || result.status !== 'success') {
        return res.status(500).json({ error: err?.message || result?.errorMessage });
      }

      pool.request()
        .input('user_id', userId)
        .input('checkout_token', result.token)
        .query(`UPDATE Subscriptions SET iyzico_reference = @checkout_token WHERE user_id = @user_id`);

      res.json({
        success: true,
        paymentPageUrl: result.paymentPageUrl
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

export const getStatus = async (req, res) => {
  const userId = req.user.id;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', userId)
      .query('SELECT status, trial_end, monthly_price FROM Subscriptions WHERE user_id = @user_id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Abonelik yok' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
