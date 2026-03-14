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
      iban_no: app.iban_no,
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

export const getDealers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, uuid, username, email, company_name, phone, address FROM Users WHERE role = 'dealer'");
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Bayiler alınırken hata oluştu.' });
    }
};

export const getFarmers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT u.id, u.uuid, u.username, u.email, u.phone, u.address, 
                   s.buyukbas_count, s.kucukbas_count, s.status as sub_status
            FROM Users u
            LEFT JOIN Subscriptions s ON u.id = s.user_id
            WHERE u.role = 'farmer'
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Çiftçiler alınırken hata oluştu.' });
    }
};

export const getInstallations = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT i.*, 
                   d.company_name as dealer_name, d.username as dealer_username, d.role as dealer_role, d.phone as dealer_phone,
                   f.username as farmer_name, f.company_name as farmer_company, f.phone as farmer_phone
            FROM Installations i
            JOIN Users d ON i.dealer_id = d.id AND d.role = 'dealer'
            JOIN Users f ON i.farmer_id = f.id
            ORDER BY i.installation_date DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Kurulumlar alınırken hata oluştu.' });
    }
};

export const generateActivationCode = async (req, res) => {
    const { installationId } = req.body;
    try {
        const pool = await poolPromise;
        
        // 9 haneli benzersiz kod (Örn: 1234-5678X)
        const code = Math.random().toString(36).substring(2, 11).toUpperCase();
        
        await pool.request()
            .input('id', installationId)
            .input('code', code)
            .query("UPDATE Installations SET activation_code = @code, status = 'waiting_activation' WHERE id = @id");
            
        res.json({ success: true, code });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Kod oluşturulurken hata oluştu.' });
    }
};

export const terminateContract = async (req, res) => {
    const { applicationId } = req.body;
    try {
        const pool = await poolPromise;
        
        // 1. Başvuruyu ve e-posta adresini bul
        const appResult = await pool.request()
            .input('id', applicationId)
            .query("SELECT email, role FROM PartnerApplications WHERE id = @id");
        
        if (appResult.recordset.length === 0) return res.status(404).json({ message: 'Başvuru bulunamadı.' });
        const { email, role } = appResult.recordset[0];

        // 2. Kullanıcıyı bul
        const userResult = await pool.request()
            .input('email', email)
            .query("SELECT id FROM Users WHERE email = @email");

        if (userResult.recordset.length > 0) {
            const userId = userResult.recordset[0].id;

            // --- DEVRALMA VE TEMİZLİK İŞLEMLERİ ---
            // Dinamik olarak ilk adminin id'sini bul
            const adminRes = await pool.request().query("SELECT TOP 1 id FROM Users WHERE role = 'admin' ORDER BY id ASC");
            const adminId = adminRes.recordset.length > 0 ? adminRes.recordset[0].id : null;

            if (adminId) {
                // 1. Installations (Bayi olarak devret)
                await pool.request()
                    .input('old_user', userId)
                    .input('admin_id', adminId) 
                    .query("UPDATE Installations SET dealer_id = @admin_id WHERE dealer_id = @old_user");
                
                // 2. StockRequests - Fabrika tarafını devret (Bayiler mağdur olmasın)
                await pool.request()
                    .input('old_user', userId)
                    .input('admin_id', adminId)
                    .query("UPDATE StockRequests SET factory_id = @admin_id WHERE factory_id = @old_user");

                // 3. StockRequests - Bayi tarafını devret (Bekleyen talepler Admin'e geçsin)
                await pool.request()
                    .input('old_user', userId)
                    .input('admin_id', adminId)
                    .query("UPDATE StockRequests SET dealer_id = @admin_id WHERE dealer_id = @old_user");
            } else {
                // Admin bulunamazsa ilişkili kayıtları silmek zorundayız yoksa User tablosu silinemez (Constraint Hatası)
                await pool.request().input('uid', userId).query("DELETE FROM StockRequests WHERE dealer_id = @uid OR factory_id = @uid");
                await pool.request().input('uid', userId).query("DELETE FROM Installations WHERE dealer_id = @uid");
            }

            // 4. Diğer bağımlılıkları temizle
            await pool.request().input('uid', userId).query("DELETE FROM Subscriptions WHERE user_id = @uid");
            // Not: Animals ve Areas tabloları DB tarafında CASCADE olduğu için Users silinince otomatik silinecektir.

            // 3. Kullanıcıyı sistemden sil
            await pool.request().input('id', userId).query("DELETE FROM Users WHERE id = @id");
        }

        // 4. Başvuruyu sistemden temizle
        await pool.request().input('id', applicationId).query("DELETE FROM PartnerApplications WHERE id = @id");

        res.json({ success: true, message: 'Sözleşme feshedildi. Tüm kurulum ve stok kayıtları güvenli bir şekilde Admin hesabına devredildi.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Fesih işlemi sırasında hata oluştu: ' + err.message });
    }
};

export const reassignInstallation = async (req, res) => {
    const { installationId, newDealerId } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('instId', installationId)
            .input('dealerId', newDealerId)
            .query("UPDATE Installations SET dealer_id = @dealerId WHERE id = @instId");
        
        res.json({ success: true, message: 'Kurulum başarıyla yeni bayiye atandı.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Atama sırasında hata oluştu.' });
    }
};
