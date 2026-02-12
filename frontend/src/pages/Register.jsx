import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    animal_type: 'buyukbas',
    animal_count: 1
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unitPrice = form.animal_type === 'buyukbas' ? 1200 : 700;
  const monthly = form.animal_count * unitPrice;
  const yearly = monthly * 12;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'animal_count' ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.post('/api/auth/register', form);
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
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
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

          <select name="animal_type" onChange={handleChange} className="w-full p-3 mb-4 border rounded" required>
            <option value="buyukbas">Büyükbaş</option>
            <option value="kucukbas">Küçükbaş</option>
          </select>

          <input
            name="animal_count"
            type="number"
            min="1"
            placeholder="Hayvan Sayısı"
            onChange={handleChange}
            className="w-full p-3 mb-4 border rounded"
            required
          />

          <div className="mb-6">
            <p className="text-lg">Aylık: <strong>{monthly} TL</strong></p>
            <p className="text-lg">Yıllık: <strong>{yearly} TL</strong></p>
            <p className="text-sm text-gray-600">90 gün ücretsiz deneme!</p>
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
