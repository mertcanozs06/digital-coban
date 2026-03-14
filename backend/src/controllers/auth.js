import { poolPromise } from '../config/db.js';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req, res) => {
  const { 
    role = 'farmer', 
    username, email, password, phone, address, 
    company_name, tax_number, contract_accepted, 
    buyukbas_count = 0, kucukbas_count = 0 
  } = req.body;

  if (!username || !email || !password || !phone || !address) {
    return res.status(400).json({ message: 'Eksik alan' });
  }

  if (contract_accepted === undefined || contract_accepted === false) {
    return res.status(400).json({ message: 'Sözleşme onayı gereklidir' });
  }

  if (role === 'farmer' && buyukbas_count === 0 && kucukbas_count === 0) {
    return res.status(400).json({ message: 'En az bir hayvan türü ve sayısı giriniz' });
  }

  if ((role === 'dealer' || role === 'factory') && (!company_name || !tax_number)) {
     return res.status(400).json({ message: 'Kurumsal kayıtlarda şirket adı ve vergi/TC no zorunludur' });
  }

  try {
    const pool = await poolPromise;
    const hash = await bcrypt.hash(password, 12);
    const uuid = uuidv4();

    // Kullanıcıyı kaydet (Yeni Rol, Şirket Adı ve Sözleşme onay durumu dahil)
    await pool.request()
      .input('username', username)
      .input('email', email)
      .input('password_hash', hash)
      .input('phone', phone)
      .input('address', address)
      .input('uuid', uuid)
      .input('role', role)
      .input('company_name', company_name || null)
      .input('tax_number', tax_number || null)
      .input('contract_accepted', contract_accepted ? 1 : 0)
      .query(`
        INSERT INTO Users (username, email, password_hash, phone, address, uuid, role, company_name, tax_number, contract_accepted)
        VALUES (@username, @email, @password_hash, @phone, @address, @uuid, @role, @company_name, @tax_number, @contract_accepted)
      `);

    const user = (await pool.request().input('uuid', uuid).query(`
      SELECT id FROM Users WHERE uuid = @uuid
    `)).recordset[0];

    // Sadece Çiftçiler için Abonelik (Subscription) Oluştur
    if (role === 'farmer') {
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
    }

    res.status(201).json({ uuid, role });
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

    const token = jwt.sign({ id: user.id, uuid: user.uuid, role: user.role || 'farmer' }, process.env.JWT_SECRET, { expiresIn: '14d' });

    let needsPayment = false;
    let sub = { status: 'none', trial_end: null, monthly_price: 0 };

    // Sadece çiftçilerin (veya yetkisi omayanların) abonelik ödemesi olur
    if (user.role === 'farmer' || !user.role) {
      const subResult = await pool.request()
        .input('user_id', user.id)
        .query(`
          SELECT status, trial_end, monthly_price
          FROM Subscriptions 
          WHERE user_id = @user_id
        `);

      if (subResult.recordset.length > 0) {
        sub = subResult.recordset[0];
        needsPayment = sub.status !== 'active' && new Date() > new Date(sub.trial_end);
      }
    }

    res.json({
      token,
      uuid: user.uuid,
      role: user.role || 'farmer',
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

export const applyPartner = async (req, res) => {
  const { 
    role = 'dealer', 
    company_name, 
    tax_number, 
    contact_name, 
    email, 
    phone, 
    address, 
    iban_no,
    message 
  } = req.body;

  if (!company_name || !tax_number || !contact_name || !email || !phone) {
    return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları (Şirket adı, Vergi no, Yetkili, E-posta, Tel) doldurun.' });
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('role', sql.VarChar(20), role)
      .input('company_name', sql.NVarChar(255), company_name)
      .input('tax_number', sql.VarChar(50), tax_number)
      .input('contact_name', sql.NVarChar(100), contact_name)
      .input('email', sql.VarChar(255), email)
      .input('phone', sql.VarChar(20), phone)
      .input('address', sql.NVarChar(sql.MAX), address || null)
      .input('iban_no', sql.NVarChar(34), iban_no || null)
      .input('message', sql.NVarChar(sql.MAX), message || null)
      .query(`
        INSERT INTO PartnerApplications (role, company_name, tax_number, contact_name, email, phone, address, iban_no, message, status, created_at)
        VALUES (@role, @company_name, @tax_number, @contact_name, @email, @phone, @address, @iban_no, @message, 'pending', GETDATE())
      `);

    res.status(201).json({ success: true, message: 'Başvurunuz başarıyla alındı.' });
  } catch (err) {
    console.error('APPLY_PARTNER_ERROR:', err);
    res.status(500).json({ message: 'Başvuru sırasında veritabanı hatası oluştu: ' + err.message });
  }
};

export const approvePartner = async (req, res) => {
  const { applicationId } = req.body;

  try {
    const pool = await poolPromise;

    // Başvuruyu al
    const appResult = await pool.request()
      .input('id', applicationId)
      .query('SELECT * FROM PartnerApplications WHERE id = @id');

    if (appResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Başvuru bulunamadı.' });
    }

    const application = appResult.recordset[0];

    // Şifre oluştur (gerçekte kriptolanıp mail atılacak, şimdilik mock)
    const rawPassword = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(rawPassword, 12);
    const uuid = uuidv4();

    // Kullanıcı olarak kaydet
    await pool.request()
      .input('username', application.contact_name)
      .input('email', application.email)
      .input('password_hash', hash)
      .input('phone', application.phone)
      .input('address', application.address || '')
      .input('iban_no', application.iban_no || null)
      .input('uuid', uuid)
      .input('role', application.role)
      .input('company_name', application.company_name)
      .input('tax_number', application.tax_number)
      .input('contract_accepted', 1) // Onaylandı kabul ediliyor
      .query(`
        INSERT INTO Users (username, email, password_hash, phone, address, iban_no, uuid, role, company_name, tax_number, contract_accepted)
        VALUES (@username, @email, @password_hash, @phone, @address, @iban_no, @uuid, @role, @company_name, @tax_number, @contract_accepted)
      `);

    // Başvuruyu onaylandı yap
    await pool.request()
      .input('id', applicationId)
      .query(`UPDATE PartnerApplications SET status = 'approved' WHERE id = @id`);

    // Gerçekte burada bir mail servisi ile rawPassword mail atılacak.
    console.log(`[MOCK EMAIL] To: ${application.email} - Sisteme onaylandınız. Şifreniz: ${rawPassword}`);

    res.json({ success: true, message: 'Ortaklık onaylandı, e-posta gönderildi.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Onay işlemi sırasında hata oluştu.' });
  }
};

export const me = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token bulunamadı' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const pool = await poolPromise;
    
    const userResult = await pool.request()
      .input('id', decoded.id)
      .query('SELECT id, uuid, username, email, role FROM Users WHERE id = @id');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const user = userResult.recordset[0];
    res.json({
      id: user.id,
      uuid: user.uuid,
      username: user.username,
      email: user.email,
      role: user.role || 'farmer'
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Geçersiz token' });
  }
};
