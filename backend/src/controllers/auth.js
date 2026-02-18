import { poolPromise } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req, res) => {
  const { username, email, password, phone, address, buyukbas_count = 0, kucukbas_count = 0 } = req.body;

  if (!username || !email || !password || !phone || !address) {
    return res.status(400).json({ message: 'Eksik alan' });
  }

  if (buyukbas_count === 0 && kucukbas_count === 0) {
    return res.status(400).json({ message: 'En az bir hayvan türü ve sayısı giriniz' });
  }

  try {
    const pool = await poolPromise;
    const hash = await bcrypt.hash(password, 12);
    const uuid = uuidv4();

    // Kullanıcıyı kaydet
    await pool.request()
      .input('username', username)
      .input('email', email)
      .input('password_hash', hash)
      .input('phone', phone)
      .input('address', address)
      .input('uuid', uuid)
      .query(`
        INSERT INTO Users (username, email, password_hash, phone, address, uuid)
        VALUES (@username, @email, @password_hash, @phone, @address, @uuid)
      `);

    const user = (await pool.request().input('uuid', uuid).query(`
      SELECT id FROM Users WHERE uuid = @uuid
    `)).recordset[0];

    // Aylık ücret hesapla
    const buyukbasPrice = 1200;
    const kucukbasPrice = 700;
    const buyukbasMonthly = buyukbas_count * buyukbasPrice;
    const kucukbasMonthly = kucukbas_count * kucukbasPrice;
    const totalMonthly = buyukbasMonthly + kucukbasMonthly;

    const trialEnd = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await pool.request()
      .input('user_id', user.id)
      .input('buyukbas_count', buyukbas_count)
      .input('kucukbas_count', kucukbas_count)
      .input('monthly_price', totalMonthly)
      .input('trial_end', trialEnd)
      .query(`
        INSERT INTO Subscriptions (
          user_id, buyukbas_count, kucukbas_count, monthly_price, trial_end
        ) VALUES (
          @user_id, @buyukbas_count, @kucukbas_count, @monthly_price, @trial_end
        )
      `);

    res.status(201).json({ uuid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Kayıt hatası' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await poolPromise;
    const userResult = await pool.request()
      .input('email', email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }

    const user = userResult.recordset[0];
    if (!await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ message: 'Yanlış şifre' });
    }

    const token = jwt.sign({ id: user.id, uuid: user.uuid }, process.env.JWT_SECRET, { expiresIn: '14d' });

    const subResult = await pool.request()
      .input('user_id', user.id)
      .query(`
        SELECT status, trial_end, monthly_price
        FROM Subscriptions 
        WHERE user_id = @user_id
      `);

    const sub = subResult.recordset[0] || { status: 'none', trial_end: null, monthly_price: 0 };

    const needsPayment = 
      sub.status !== 'active' && 
      new Date() > new Date(sub.trial_end);

    res.json({
      token,
      uuid: user.uuid,
      subscription: {
        status: sub.status,
        trial_end: sub.trial_end,
        monthly_price: sub.monthly_price,
        needsPayment
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Giriş hatası' });
  }
};
