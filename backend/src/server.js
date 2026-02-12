import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRouter from './routes/auth.js';
// Diğer route'lar (ileride ekleyeceğiz)
import subscriptionRouter from './routes/subscription.js'; // ekle
import animalRouter from './routes/animal.js';           // ekle
import areaRouter from './routes/area.js';               // ekle

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Gerçek rotalar
app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/animals', animalRouter);
app.use('/api/areas', areaRouter);

// Test / mock rotalar (geliştirme için - production'da kaldır)
app.get('/api/subscriptions/status', (req, res) => {
  res.json({
    status: 'active',
    trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    monthly_price: 1200
  });
});

app.post('/api/subscriptions/initialize', (req, res) => {
  res.json({
    success: true,
    paymentPageUrl: 'https://sandbox.iyzico.com/payment-page-url'
  });
});

app.get('/api/animals', (req, res) => res.json([]));
app.post('/api/animals', (req, res) => res.json({ success: true }));
app.get('/api/areas', (req, res) => res.json([]));
app.post('/api/areas', (req, res) => res.json({ success: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend çalışıyor → http://localhost:${PORT}`);
});