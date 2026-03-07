import { poolPromise } from '../config/db.js';

export const getApplications = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM PartnerApplications
      ORDER BY created_at DESC
    `);
    
    // Convert to camelCase frontend expectations
    const applications = result.recordset.map(app => ({
      id: app.id,
      type: app.role,
      company_name: app.company_name,
      contact_name: app.contact_name,
      phone: app.phone,
      email: app.email,
      date: new Date(app.created_at).toLocaleDateString('tr-TR'),
      status: app.status
    }));

    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Başvurular alınırken hata oluştu.' });
  }
};

export const getStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    const dealersCount = await pool.request().query("SELECT COUNT(*) as count FROM Users WHERE role = 'dealer'");
    const factoriesCount = await pool.request().query("SELECT COUNT(*) as count FROM Users WHERE role = 'factory'");
    const farmersCount = await pool.request().query("SELECT COUNT(*) as count FROM Users WHERE role = 'farmer'");
    
    res.json({
      activeDealers: dealersCount.recordset[0].count,
      activeFactories: factoriesCount.recordset[0].count,
      totalFarmers: farmersCount.recordset[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'İstatistikler alınırken hata oluştu.' });
  }
};
