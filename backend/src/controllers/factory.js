import { poolPromise } from '../config/db.js';

export const getStockRequests = async (req, res) => {
    const factoryId = req.user.id;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('factory_id', factoryId)
            .query(`
                SELECT sr.*, u.company_name as dealer_name, u.phone as dealer_phone, u.address as dealer_address
                FROM StockRequests sr
                JOIN Users u ON sr.dealer_id = u.id
                WHERE sr.factory_id = @factory_id
                ORDER BY sr.request_date DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Talepler alınırken hata oluştu.' });
    }
};

export const updateStockRequestStatus = async (req, res) => {
    const { requestId, status, sentCount, message } = req.body;
    try {
        const pool = await poolPromise;
        
        // Önce mevcut durumu al
        const currentData = await pool.request()
            .input('id', requestId)
            .query("SELECT requested_count, arrived_count, shipped_count FROM StockRequests WHERE id = @id");
            
        if (currentData.recordset.length === 0) {
            return res.status(404).json({ message: 'Talep bulunamadı.' });
        }
        
        const { requested_count, arrived_count, shipped_count } = currentData.recordset[0];

        if (status === 'cancelled') {
            await pool.request()
                .input('id', requestId)
                .input('factory_message', message)
                .query("UPDATE StockRequests SET status = 'cancelled', factory_message = @factory_message, updated_at = GETDATE() WHERE id = @id");
            return res.json({ success: true, message: 'Talep iptal edildi.' });
        }

        if (status === 'shipped') {
            const currentTotal = arrived_count + shipped_count + parseInt(sentCount);
            if (currentTotal > requested_count) {
                return res.status(400).json({ message: `Hata: Toplam gönderilen (${currentTotal}), talep edilenden (${requested_count}) fazla olamaz.` });
            }

            await pool.request()
                .input('id', requestId)
                .input('shipped_count', parseInt(sentCount))
                .input('factory_message', message)
                .query(`
                    UPDATE StockRequests 
                    SET status = 'shipped', 
                        shipped_count = @shipped_count, 
                        factory_message = @factory_message,
                        updated_at = GETDATE()
                    WHERE id = @id
                `);
            return res.json({ success: true, message: 'Ürünler miktar güncellenerek kargoya verildi.' });
        }

        res.status(400).json({ message: 'Geçersiz işlem.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Güncelleme hatası.' });
    }
};
