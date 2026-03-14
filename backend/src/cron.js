import cron from 'node-cron';
import { poolPromise } from './config/db.js';
import iyzipay from './config/iyzico.js';

// Her gün saat 00:05'te çalış (gece yarısından 5 dakika sonra)
cron.schedule('5 0 * * *', async () => {
  console.log('Abonelik süre kontrolü başladı...');

  try {
    const pool = await poolPromise;
    const expiredSubs = await pool.request().query(`
      SELECT iyzico_reference 
      FROM Subscriptions 
      WHERE status = 'active' 
      AND subscription_end < GETDATE()
    `);

    for (const row of expiredSubs.recordset) {
      const refCode = row.iyzico_reference;
      if (!refCode) continue;

      iyzipay.subscription.cancel(
        {
          referenceCode: refCode,
          locale: 'tr'
        },
        async (err, cancelResult) => {
          if (err || cancelResult.status !== 'success') {
            console.error(`Abonelik iptal hatası (${refCode}):`, err || cancelResult);
          } else {
            await pool.request()
              .input('ref', refCode)
              .query(`
                UPDATE Subscriptions 
                SET status = 'expired' 
                WHERE iyzico_reference = @ref
              `);
            console.log(`Abonelik iptal edildi: ${refCode}`);
          }
        }
      );
    }
  } catch (err) {
    console.error('Cron job hatası:', err);
  }
});

console.log('Abonelik iptal cron job başlatıldı.');
