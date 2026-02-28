import { poolPromise } from '../config/db.js';

// Point-in-Polygon algoritması (Ray Casting)
function isPointInPolygon(point, polygon) {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]; // lng
    const yi = polygon[i][1]; // lat
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

export const createArea = async (req, res) => {
  const { name, polygon } = req.body;
  const userId = req.user.id;

  if (!name || !polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return res.status(400).json({ message: 'Geçerli alan adı ve en az 3 koordinat gerekli' });
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('name', name)
      .input('user_id', userId)
      .input('polygon', JSON.stringify(polygon))
      .query(`
        INSERT INTO Areas (name, user_id, polygon, created_at)
        VALUES (@name, @user_id, @polygon, GETDATE())
      `);

    res.status(201).json({ success: true, message: 'Alan başarıyla oluşturuldu' });
  } catch (err) {
    console.error('ALAN OLUŞTURMA HATASI:', err);
    res.status(500).json({ message: 'Alan oluşturulamadı' });
  }
};

export const getAreas = async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT id, name, polygon, created_at
        FROM Areas 
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    const areas = result.recordset.map(area => ({
      ...area,
      polygon: JSON.parse(area.polygon)
    }));

    res.json(areas);
  } catch (err) {
    console.error('ALAN LİSTELEME HATASI:', err);
    res.status(500).json({ message: 'Alanlar alınamadı' });
  }
};

/* ===============================
   HAYVANIN ALANDA OLUP OLMADIĞINI KONTROL ET
   - Body: { code, lat, lng }
   - Tüm kullanıcı alanlarını kontrol eder
   - İçinde ise hangi alanda olduğunu döner
=============================== */
export const checkAnimalInArea = async (req, res) => {
  const { code, lat, lng } = req.body;
  const userId = req.user.id;

  if (!code || !lat || !lng) {
    return res.status(400).json({ message: 'Code, lat ve lng gerekli' });
  }

  try {
    const pool = await poolPromise;

    // Hayvanı bul
    const animalResult = await pool.request()
      .input('code', code)
      .input('user_id', userId)
      .query(`
        SELECT id, code, last_lat, last_lng 
        FROM Animals 
        WHERE code = @code AND user_id = @user_id
      `);

    if (animalResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Hayvan bulunamadı' });
    }

    // Kullanıcının tüm alanlarını çek
    const areasResult = await pool.request()
      .input('user_id', userId)
      .query(`
        SELECT id, name, polygon 
        FROM Areas 
        WHERE user_id = @user_id
      `);

    const areas = areasResult.recordset.map(area => ({
      ...area,
      polygon: JSON.parse(area.polygon)
    }));

    let insideAnyArea = false;
    let insideAreaName = null;

    for (const area of areas) {
      if (isPointInPolygon({ lat, lng }, area.polygon)) {
        insideAnyArea = true;
        insideAreaName = area.name;
        break;
      }
    }

    res.json({
      success: true,
      insideArea: insideAnyArea,
      areaName: insideAreaName || null,
      message: insideAnyArea 
        ? `Hayvan "${code}" ${insideAreaName} alanında!` 
        : `Hayvan "${code}" hiçbir alanda değil.`
    });
  } catch (err) {
    console.error('ALAN KONTROL HATASI:', err);
    res.status(500).json({ message: 'Kontrol yapılamadı', error: err.message });
  }
};
