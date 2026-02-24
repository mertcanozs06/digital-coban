import { poolPromise } from '../config/db.js';

export const addAnimal = async (req, res) => {
  const userId = req.user?.id;
  const { code } = req.body;

  console.log('╔════════════════════════════════════════╗');
  console.log('║          ADD ANIMAL İSTEĞİ GELDİ       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('Gelen kod:', code || '(boş)');
  console.log('JWT userId:', userId || '(yok)');

  if (!userId) {
    console.log('HATA: userId bulunamadı');
    return res.status(401).json({ success: false, message: 'Kullanıcı kimliği yok' });
  }

  // Test için geçici olarak kontrolü gevşet (sonra geri sıkılaştır)
  if (!code) {
    return res.status(400).json({ success: false, message: 'Kod boş' });
  }

  try {
    const pool = await poolPromise;
    console.log('DB bağlantısı kuruldu');

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const request = transaction.request();
      request.input('user_id', userId);
      request.input('code', code);
      request.input('name', `TestHayvan-${Date.now()}`); // unique isim
      request.input('last_lat', 39.93);
      request.input('last_lng', 32.85);

      const result = await request.query(`
        INSERT INTO Animals (user_id, code, name, last_lat, last_lng)
        VALUES (@user_id, @code, @name, @last_lat, @last_lng)
      `);

      console.log('INSERT sonucu:', result);
      console.log('Etkilenen satır sayısı:', result.rowsAffected[0]);

      await transaction.commit();

      res.json({ 
        success: true, 
        message: 'Hayvan eklendi',
        rowsAffected: result.rowsAffected[0],
        insertedCode: code
      });
    } catch (innerErr) {
      await transaction.rollback();
      console.error('Transaction iç hata:', innerErr.message);
      throw innerErr;
    }
  } catch (err) {
    console.error('ADD ANIMAL GENEL HATASI:', err.message);
    console.error('Hata stack:', err.stack);

    res.status(500).json({ 
      success: false,
      message: 'Hayvan eklenemedi',
      error: err.message,
      sqlCode: err.code || 'bilinmiyor'
    });
  }
};

export const getAnimals = async (req, res) => {
  const userId = req.user?.id;

  console.log('╔════════════════════════════════════════╗');
  console.log('║         GET ANIMALS İSTEĞİ GELDİ       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('Sorgulanan userId:', userId || '(yok)');

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT * FROM Animals WHERE user_id = @user_id ORDER BY id DESC
      `);

    console.log('Bulunan hayvan sayısı:', result.recordset.length);
    if (result.recordset.length > 0) {
      console.log('İlk hayvan:', result.recordset[0]);
    }

    res.json(result.recordset);
  } catch (err) {
    console.error('GET ANIMALS HATASI:', err.message);
    res.status(500).json({ success: false, message: 'Liste alınamadı', error: err.message });
  }
};