import { poolPromise } from '../config/db.js';

export const createArea = async (req, res) => {
  const { name, polygon } = req.body;
  const userId = req.user.id;

  if (!name || !polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return res.status(400).json({
      message: 'Geçerli alan adı ve en az 3 koordinat gerekli'
    });
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('name', name)
      .input('user_id', userId)
      .input('polygon_json', JSON.stringify(polygon))
      .query(`
        INSERT INTO Areas (name, user_id, polygon_json)
        VALUES (@name, @user_id, @polygon_json)
      `);

    res.status(201).json({
      success: true,
      message: 'Alan başarıyla oluşturuldu'
    });

  } catch (err) {
    console.error('ALAN OLUŞTURMA HATASI:', err.message);
    res.status(500).json({
      message: 'Alan oluşturulamadı',
      error: err.message
    });
  }
};


export const getAreas = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT 
          id,
          name,
          polygon_json,
          is_active,
          created_at
        FROM Areas
        WHERE user_id = @user_id
        ORDER BY id DESC
      `);

    const areas = result.recordset.map(area => ({
      id: area.id,
      name: area.name,
      is_active: area.is_active,
      created_at: area.created_at,
      polygon: JSON.parse(area.polygon_json)
    }));

    res.json(areas);

  } catch (err) {
    console.error('ALAN LİSTELEME HATASI:', err.message);
    res.status(500).json({
      message: 'Alanlar alınamadı',
      error: err.message
    });
  }
};