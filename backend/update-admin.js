import { poolPromise } from './src/config/db.js';
import bcrypt from 'bcryptjs';

async function updateAdminPassword() {
  try {
    const pool = await poolPromise;
    const hash = await bcrypt.hash('admin123', 12);
    
    const result = await pool.request()
      .input('email', 'admin@digitalcoban.com')
      .input('hash', hash)
      .query(`
        UPDATE Users
        SET password_hash = @hash
        WHERE email = @email
      `);

    console.log(`Updated ${result.rowsAffected[0]} row(s)`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating admin password:', err);
    process.exit(1);
  }
}

updateAdminPassword();
