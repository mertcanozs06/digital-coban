import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // TAILWIND CSS V4 CDN Injector
  useEffect(() => {
    let tailwindScript = document.getElementById('tailwind-cdn');
    if (!tailwindScript) {
      tailwindScript = document.createElement('script');
      tailwindScript.id = 'tailwind-cdn';
      tailwindScript.src = 'https://unpkg.com/@tailwindcss/browser@4';
      document.head.appendChild(tailwindScript);
    }
    document.body.style.setProperty('display', 'block', 'important');
    document.body.style.setProperty('width', '100%', 'important');
  }, []);

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
        // Rol bazlı yönlendirme kurgusu
        const userRole = data.role || 'farmer';

        if (userRole === 'admin') {
          navigate(`/admin/dashboard/${data.uuid}`);
        } else if (userRole === 'dealer') {
          navigate(`/dealer/dashboard/${data.uuid}`);
        } else if (userRole === 'factory') {
          navigate(`/factory/dashboard/${data.uuid}`);
        } else {
          // Çiftçi ise normal dashboard paneli
          navigate(`/dashboard/${data.uuid}`);
        }
      }
    } catch (err) {
      setError(err.message || 'E-Posta veya Şifre Hatalı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-sans selection:bg-blue-200">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl shadow-blue-900/5 w-full max-w-[420px] border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Hoş Geldiniz</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Sisteme girmek için bilgilerinizi yazın.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-Posta Adresiniz</label>
            <input
              name="email"
              type="email"
              placeholder="mail@ornek.com"
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium placeholder:text-slate-300"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Şifreniz</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium placeholder:text-slate-300"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center border border-red-100 animate-pulse">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-50 text-base font-black tracking-widest uppercase shadow-lg shadow-blue-200 transform hover:-translate-y-1 mt-4"
          >
            {loading ? 'Bağlanıyor...' : 'Sisteme Giriş Yap'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          İlk defa mı geliyorsunuz?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-500 underline font-bold transition-colors">
            Yeni Hesap Oluştur
          </a>
        </p>
      </div>
    </div>
  );
}
