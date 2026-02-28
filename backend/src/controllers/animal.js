import { poolPromise } from '../config/db.js';

const BASE_LAT = 39.93;
const BASE_LNG = 32.85;

/* ============================
   HAYVAN EKLE
============================ */
export const addAnimal = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code) {
    return res.status(400).json({ message: 'QR kod gerekli' });
  }

  try {
    const pool = await poolPromise;

    const existing = await pool.request()
      .input('code', code)
      .query(`SELECT id FROM Animals WHERE code = @code`);

    if (existing.recordset.length > 0) {
      return res.status(400).json({ message: 'Bu QR kod zaten kayıtlı' });
    }

    const countResult = await pool.request()
      .input('user_id', userId)
      .query(`SELECT COUNT(*) as total FROM Animals WHERE user_id = @user_id`);

    const animalCount = countResult.recordset[0].total;
    const offset = animalCount * 0.001;

    const newLat = BASE_LAT + offset;
    const newLng = BASE_LNG + offset;

    await pool.request()
      .input('code', code)
      .input('user_id', userId)
      .input('name', 'Yeni Hayvan')
      .input('lat', newLat)
      .input('lng', newLng)
      .query(`
        INSERT INTO Animals 
        (code, user_id, name, last_lat, last_lng, last_location_time, location_visible)
        VALUES 
        (@code, @user_id, @name, @lat, @lng, GETDATE(), 1)
      `);

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('HAYVAN EKLEME HATASI:', err.message, err.stack);
    res.status(500).json({ message: err.message });
  }
};

/* ============================
   LİSTELE
============================ */
export const getAnimals = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT id, code, name, last_lat, last_lng,
               last_location_time, location_visible
        FROM Animals
        WHERE user_id = @user_id
        ORDER BY id DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('HAYVAN LİSTELEME HATASI:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ============================
   İSİM DEĞİŞTİR (code ile)
============================ */
export const renameAnimal = async (req, res) => {
  const { code, name } = req.body;
  const userId = req.user.id;

  if (!code || !name) {
    return res.status(400).json({ message: 'Code ve yeni isim gerekli' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('code', code)
      .input('user_id', userId)
      .input('name', name)
      .query(`
        UPDATE Animals 
        SET name = @name
        WHERE code = @code AND user_id = @user_id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Hayvan bulunamadı veya yetki yok' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('İSİM DEĞİŞTİRME HATASI:', err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ============================
   KONUM GÖRÜNÜRLÜK TOGGLE (code ile)
============================ */
export const toggleLocation = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code) {
    return res.status(400).json({ message: 'Code gerekli' });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('code', code)
      .input('user_id', userId)
      .query(`
        UPDATE Animals
        SET location_visible = 
            CASE WHEN location_visible = 1 THEN 0 ELSE 1 END
        WHERE code = @code AND user_id = @user_id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Hayvan bulunamadı veya yetki yok' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('TOGGLE LOCATION HATASI:', err.message);
    res.status(500).json({ message: err.message });
  }
};
