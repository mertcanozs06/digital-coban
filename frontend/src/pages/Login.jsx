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
        const userRole = data.role || 'farmer';
        if (userRole === 'admin') {
          navigate(`/admin/dashboard/${data.uuid}`);
        } else if (userRole === 'dealer') {
          navigate(`/dealer/dashboard/${data.uuid}`);
        } else if (userRole === 'factory') {
          navigate(`/factory/dashboard/${data.uuid}`);
        } else {
          navigate(`/dashboard/${data.uuid}`);
        }
      }
    } catch (err) {
      setError(err.message || 'E-Posta veya Şifre Hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 py-12 md:py-24 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Premium Animated Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-600/30 to-purple-600/30 blur-[140px] rounded-full animate-pulse style={{ animationDuration: '8s' }}"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 blur-[130px] rounded-full animate-pulse style={{ animationDuration: '12s' }}"></div>
      </div>

      <div className="w-full max-w-lg lg:max-w-xl relative z-10 animate-in fade-in zoom-in-95 duration-[800ms]">
        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 md:p-14 rounded-[3.5rem] border border-white/10 shadow-[0_0_80px_rgba(79,70,229,0.15)] relative overflow-hidden group">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/30 rotate-3 group-hover:rotate-6 transition-transform duration-500">
                <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tighter uppercase mb-2">Digital<span className="text-indigo-400 font-light lowercase">Çoban</span></h1>
            <p className="text-indigo-200/50 text-[10px] font-black uppercase tracking-[0.3em]">Merkezi Yönetim Sistemi</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-Posta Adresi</label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <span className="text-indigo-400/50">📧</span>
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="mail@digitalcoban.com"
                    onChange={handleChange}
                    className="w-full pl-12 pr-5 py-5 bg-slate-800/50 border border-slate-700 text-white rounded-3xl focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all font-bold placeholder:text-slate-600 placeholder:font-medium shadow-inner"
                    required
                  />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Giriş Şifresi</label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <span className="text-indigo-400/50">🔒</span>
                  </div>
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    onChange={handleChange}
                    className="w-full pl-12 pr-5 py-5 bg-slate-800/50 border border-slate-700 text-white rounded-3xl focus:outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all font-bold placeholder:text-slate-600 placeholder:font-medium shadow-inner"
                    required
                  />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-3xl text-[10px] font-black flex items-center justify-center gap-3 border border-red-500/20 uppercase tracking-widest animate-pulse">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-6 rounded-3xl transition-all disabled:opacity-50 text-[11px] font-black tracking-[0.25em] uppercase shadow-[0_10px_40px_rgba(79,70,229,0.3)] transform hover:-translate-y-1 active:translate-y-0 mt-6 group"
            >
              <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-[shine_1.5s_ease-in-out]"></div>
              {loading ? 'Yükleniyor...' : 'Sisteme Bağlan'}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col gap-5 text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Hesabınız yok mu?{' '}
              <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-black transition-colors ml-1 border-b border-indigo-500/30 hover:border-indigo-400 pb-0.5">
                YENİ KAYIT
              </a>
            </p>
            <div className="flex items-center justify-center gap-4 text-slate-600">
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                <a href="/partner-application" className="text-[10px] font-black hover:text-indigo-400 transition-all uppercase tracking-widest">Kurumsal İş Ortağı</a>
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-12 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] drop-shadow-md">Digital Çoban v3.4 Premium</p>
        
        <style>{`
            @keyframes shine {
                100% { left: 200%; }
            }
        `}</style>
      </div>
    </div>
  );
}
