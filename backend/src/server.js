import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRouter from './routes/auth.js';
// Diğer route'lar (ileride ekleyeceğiz)
import subscriptionRouter from './routes/subscription.js'; // ekle
import animalRouter from './routes/animal.js';           // ekle
import areaRouter from './routes/area.js';               // ekle
import adminRouter from './routes/admin.js';
import dealerRouter from './routes/dealer.js';
import factoryRouter from './routes/factory.js';
import './cron.js';
const app = express();

// CORS ayarını yap (localhost:5173 için)
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// OPTIONS pre-flight için otomatik CORS middleware yeterli, ekstra gerek yok
// ama istersen manuel ekleyebilirsin:
// app.options('*', cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Her isteği logla (debug için çok faydalı)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});


// Gerçek rotalar
app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/animals', animalRouter);
app.use('/api/areas', areaRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dealer', dealerRouter);
app.use('/api/factory', factoryRouter);

// Hata yakalama middleware (opsiyonel ama önerilir)
app.use((err, req, res, next) => {
  console.error('EXPRESS HATASI:', err.stack);
  res.status(500).json({ success: false, message: 'Sunucu hatası', error: err.message });
});


const PORT = 5000;

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend çalışıyor → http://127.0.0.1:${PORT}`);
});
