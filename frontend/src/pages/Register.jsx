import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    buyukbas_count: 0,
    kucukbas_count: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buyukbasPrice = 1200;
  const kucukbasPrice = 700;

  const buyukbasMonthly = form.buyukbas_count * buyukbasPrice;
  const kucukbasMonthly = form.kucukbas_count * kucukbasPrice;
  const totalMonthly = buyukbasMonthly + kucukbasMonthly;
  const totalYearly = totalMonthly * 12;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name.includes('count') ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.buyukbas_count === 0 && form.kucukbas_count === 0) {
      setError('En az bir hayvan türü ve sayısı seçmelisiniz');
      setLoading(false);
      return;
    }

    const payload = {
      username: form.username,
      email: form.email,
      password: form.password,
      phone: form.phone,
      address: form.address,
      buyukbas_count: form.buyukbas_count,
      kucukbas_count: form.kucukbas_count,
      total_monthly: totalMonthly
    };

    try {
      const data = await api.post('/api/auth/register', payload);
      alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Kayıt sırasında hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Üye Ol</h1>

        <form onSubmit={handleSubmit}>
          <input
            name="username"
            placeholder="Kullanıcı Adı"
            onChange={handleChange}
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="E-posta"
            onChange={handleChange}
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Şifre"
            onChange={handleChange}
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <input
            name="phone"
            placeholder="Telefon (ör: +905xxxxxxxxx)"
            onChange={handleChange}
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <input
            name="address"
            placeholder="Adres"
            onChange={handleChange}
            className="w-full p-3 mb-4 border rounded"
            required
          />

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Hayvan Bilgileri</h3>

            <div className="flex items-center mb-3">
              <label className="w-32">Büyükbaş sayısı:</label>
              <input
                name="buyukbas_count"
                type="number"
                min="0"
                onChange={handleChange}
                className="w-full p-3 border rounded"
              />
            </div>

            <div className="flex items-center mb-3">
              <label className="w-32">Küçükbaş sayısı:</label>
              <input
                name="kucukbas_count"
                type="number"
                min="0"
                onChange={handleChange}
                className="w-full p-3 border rounded"
              />
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded border">
              <p className="text-lg">Büyükbaş aylık: <strong>{buyukbasMonthly} TL</strong></p>
              <p className="text-lg">Küçükbaş aylık: <strong>{kucukbasMonthly} TL</strong></p>
              <p className="text-xl font-bold mt-2">Toplam aylık: <strong>{totalMonthly} TL</strong></p>
              <p className="text-lg mt-1">Toplam yıllık: <strong>{totalYearly} TL</strong></p>
              <p className="text-sm text-gray-600 mt-2">90 gün ücretsiz deneme!</p>
            </div>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Üye Ol'}
          </button>
        </form>
      </div>
    </div>
  );
}
