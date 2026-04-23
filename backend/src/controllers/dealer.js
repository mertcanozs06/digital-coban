import { poolPromise } from '../config/db.js';

export const getFactories = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, company_name FROM Users WHERE role = 'factory'");
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Fabrikalar alınırken hata oluştu.' });
    }
};

export const createStockRequest = async (req, res) => {
    const { factoryId, count, message } = req.body;
    const dealerId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase().trim();
    if (userRole !== 'dealer' && userRole !== 'admin') {
        return res.status(403).json({ message: `Sadece bayiler stok talebi oluşturabilir. (Sistemdeki Rolünüz: ${req.user.role || 'Tanımsız'})` });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('dealer_id', dealerId)
            .input('factory_id', factoryId)
            .input('requested_count', count)
            .input('dealer_message', message || null)
            .query(`
                INSERT INTO StockRequests (dealer_id, factory_id, requested_count, dealer_message)
                VALUES (@dealer_id, @factory_id, @requested_count, @dealer_message)
            `);
        res.status(201).json({ success: true, message: 'Talep oluşturuldu.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Talep oluşturulurken hata oluştu.' });
    }
};

export const getStockRequests = async (req, res) => {
    const dealerId = req.user.id;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('dealer_id', dealerId)
            .query(`
                SELECT sr.*, u.company_name as factory_name
                FROM StockRequests sr
                JOIN Users u ON sr.factory_id = u.id
                WHERE sr.dealer_id = @dealer_id
                ORDER BY sr.request_date DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Talepler alınırken hata oluştu.' });
    }
};

export const confirmStockArrival = async (req, res) => {
    const { requestId, message, receivedCount } = req.body;
    try {
        const pool = await poolPromise;
        
        const currentData = await pool.request()
            .input('id', requestId)
            .query("SELECT requested_count, arrived_count, shipped_count FROM StockRequests WHERE id = @id");
            
        if (currentData.recordset.length === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });

        const { requested_count, arrived_count, shipped_count } = currentData.recordset[0];
        
        // Eğer receivedCount gönderilmemişse, gönderilenin tamamı geldi kabul et (eski davranış uyumluluğu için)
        const countToAdd = receivedCount !== undefined ? parseInt(receivedCount) : shipped_count;
        
        const newArrivedTotal = arrived_count + countToAdd;
        const status = newArrivedTotal >= requested_count ? 'completed' : 'partial';

        await pool.request()
            .input('id', requestId)
            .input('arrived_count', newArrivedTotal)
            .input('dealer_message', message)
            .input('status', status)
            .query(`
                UPDATE StockRequests 
                SET arrived_count = @arrived_count, 
                    shipped_count = 0,
                    dealer_message = @dealer_message, 
                    status = @status,
                    updated_at = GETDATE()
                WHERE id = @id
            `);
        res.json({ success: true, message: `Ürün girişi (${countToAdd} adet) onaylandı.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Onay hatası.' });
    }
};

export const getInstallations = async (req, res) => {
    const dealerId = req.user.id;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('dealer_id', dealerId)
            .query(`
                SELECT i.*, u.username as farmer_name, u.phone as farmer_phone, u.address as address,
                       s.buyukbas_count, s.kucukbas_count, s.status as sub_status
                FROM Installations i
                JOIN Users u ON i.farmer_id = u.id
                LEFT JOIN Subscriptions s ON u.id = s.user_id
                WHERE i.dealer_id = @dealer_id
                ORDER BY i.installation_date DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Kurulumlar alınırken hata oluştu.' });
    }
};

export const submitActivationCode = async (req, res) => {
    const { installationId, code } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', installationId)
            .query("SELECT activation_code FROM Installations WHERE id = @id");
            
        if (result.recordset.length === 0) return res.status(404).json({ message: 'Kurulum bulunamadı' });
        
        if (result.recordset[0].activation_code === code) {
            await pool.request()
                .input('id', installationId)
                .query("UPDATE Installations SET status = 'verified' WHERE id = @id");
            res.json({ success: true, message: 'Sistem aktif edildi.' });
        } else {
            res.status(400).json({ message: 'Geçersiz aktivasyon kodu.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Doğrulama hatası.' });
    }
};

export const getAllFarmers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, username, email, phone FROM Users WHERE role = 'farmer'");
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Çiftçiler alınırken hata oluştu.' });
    }
};

export const createInstallation = async (req, res) => {
    const { farmerId, hwMacAddress, type, description } = req.body;
    const dealerId = req.user.id;
    const userRole = (req.user.role || '').toLowerCase().trim();
    if (userRole !== 'dealer' && userRole !== 'admin') {
        return res.status(403).json({ message: `Hata: Bu işlemi sadece bayiler yapabilir. (Sistemdeki Rolünüz: ${req.user.role || 'Tanımsız'})` });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('dealer_id', dealerId)
            .input('farmer_id', farmerId)
            .input('hw_mac_address', hwMacAddress || null)
            .input('type', type || 'installation')
            .input('description', description || null)
            .input('status', 'waiting_admin')
            .query(`
                INSERT INTO Installations (dealer_id, farmer_id, hw_mac_address, type, description, status, installation_date)
                VALUES (@dealer_id, @farmer_id, @hw_mac_address, @type, @description, @status, GETDATE())
            `);
        res.status(201).json({ success: true, message: 'İstek oluşturuldu. Admin kodu bekleniyor.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'İstek oluşturulurken hata oluştu.' });
    }
};
