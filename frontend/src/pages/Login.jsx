import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const startPayment = async (token) => {
    try {
      const data = await api.post('/api/subscriptions/initialize', {}, token);
      if (data.success && data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        alert('Ödeme başlatılamadı');
      }
    } catch (err) {
      alert('Ödeme hatası: ' + err.message);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.post('/api/auth/login', form);
      localStorage.setItem('token', data.token);

      if (data.subscription?.needsPayment) {
        alert('Deneme süreniz bitmiştir. Ödeme sayfasına yönlendiriliyorsunuz.');
        await startPayment(data.token);
      } else {
        navigate(`/dashboard/${data.uuid}`);
      }
    } catch (err) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">Giriş Yap</h1>

        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="E-posta"
            onChange={handleChange}
            className="w-full p-4 mb-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Şifre"
            onChange={handleChange}
            className="w-full p-4 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <p className="text-red-600 mb-4 text-center font-medium">{error}</p>}

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-lg font-medium"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Hesabın yok mu?{' '}
          <a href="/register" className="text-blue-600 underline hover:text-blue-800">
            Üye ol
          </a>
        </p>
      </div>
    </div>
  );
}
