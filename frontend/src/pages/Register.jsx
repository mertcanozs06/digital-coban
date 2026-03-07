import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

export default function Register() {
  const navigate = useNavigate();

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

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    buyukbas_count: 0,
    kucukbas_count: 0,
    contract_accepted: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buyukbasPrice = 1200;
  const kucukbasPrice = 700;

  const buyukbasMonthly = form.buyukbas_count * buyukbasPrice;
  const kucukbasMonthly = form.kucukbas_count * kucukbasPrice;
  const totalMonthly = buyukbasMonthly + kucukbasMonthly;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else if (name.includes('count')) {
      setForm({ ...form, [name]: Number(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.contract_accepted) {
      setError('Lütfen kullanıcı sözleşmesini onaylayın.');
      setLoading(false);
      return;
    }

    if (form.buyukbas_count === 0 && form.kucukbas_count === 0) {
      setError('Çiftçi kayıtları için en az bir hayvan türü ve sayısı belirtmelisiniz.');
      setLoading(false);
      return;
    }

    const payload = {
      role: 'farmer',
      username: form.username,
      email: form.email,
      password: form.password,
      phone: form.phone,
      address: form.address,
      buyukbas_count: form.buyukbas_count,
      kucukbas_count: form.kucukbas_count,
      contract_accepted: form.contract_accepted,
      total_monthly: totalMonthly
    };

    try {
      await api.post('/api/auth/register', payload);
      alert('Kayıt başarılı! Sisteme giriş yapabilirsiniz.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] font-sans p-4 py-12 selection:bg-blue-200">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-emerald-800 tracking-tight mb-2">Çiftçi Üyeliği</h1>
          <p className="text-sm md:text-base text-slate-500">Sürünüzü yönetmeye başlamak için çiftlik bilgilerinizi girin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ad Soyad (Kullanıcı Adı)</label>
              <input name="username" placeholder="Mehmet Yılmaz" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-Posta</label>
              <input name="email" type="email" placeholder="mail@ornek.com" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Şifre</label>
              <input name="password" type="password" placeholder="••••••••" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefon</label>
              <input name="phone" placeholder="Örn: 0555 123 4567" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Açık Adres (İlçe, Şehir)</label>
            <input name="address" placeholder="Merkez, Kayseri" onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 md:p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition font-medium" required />
          </div>

          {/* ÇİFTÇİ ÖZEL ALANLARI (HAYVAN SAYISI) */}
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
            <h3 className="text-emerald-800 font-bold mb-4 uppercase tracking-wide text-sm text-center">Sürü Bilgileri & Abonelik</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Büyükbaş Sayısı (1.200 TL)</label>
                <input name="buyukbas_count" type="number" min="0" value={form.buyukbas_count} onChange={handleChange} className="w-full bg-white border border-emerald-200 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg" />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Küçükbaş Sayısı (700 TL)</label>
                <input name="kucukbas_count" type="number" min="0" value={form.kucukbas_count} onChange={handleChange} className="w-full bg-white border border-emerald-200 text-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg" />
              </div>
            </div>

            {totalMonthly > 0 && (
              <div className="mt-6 pt-6 border-t border-emerald-200/50 text-center">
                <p className="text-emerald-800 mb-1">Aylık Tahmini Toplam Tutar</p>
                <p className="text-3xl font-black text-emerald-600 mb-2">₺{totalMonthly.toLocaleString('tr-TR')} <span className="text-sm font-medium text-emerald-700">/ ay</span></p>
                <span className="inline-block bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">İlk 90 Gün Tamamen Ücretsiz Deneme!</span>
              </div>
            )}
          </div>

          {/* SÖZLEŞME ALANI */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-start gap-4 cursor-pointer hover:bg-slate-100 transition-colors">
            <div className="pt-1">
              <input 
                id="contract"
                name="contract_accepted" 
                type="checkbox" 
                checked={form.contract_accepted}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" 
              />
            </div>
            <label htmlFor="contract" className="text-sm font-medium text-slate-600 cursor-pointer flex-1">
              Sisteme kayıt olarak <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800 hover:underline font-bold" onClick={(e) => e.stopPropagation()}>Kullanıcı ve İş Ortaklığı Sözleşmesini</a>, Gizlilik Politikasını okuduğumu, anladığımı ve tüm şartları kabul ettiğimi onaylıyorum.
            </label>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-bold text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-black uppercase tracking-widest py-4 md:py-5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200"
          >
            {loading ? 'Kaydediliyor...' : 'Zaten Çiftçi Üyeliği Oluştur'}
          </button>

          <p className="text-center text-sm font-medium text-slate-500 mt-6">
            Zaten hesabınız var mı? <a href="/login" className="text-emerald-600 hover:underline font-bold">Giriş Yap</a>
          </p>

          <div className="pt-6 mt-6 border-t border-slate-200 text-center">
            <h4 className="text-slate-600 font-bold mb-2">Kurumsal İş Ortağımız Olmak İster Misiniz?</h4>
            <p className="text-xs text-slate-500 mb-4">Bayi veya fabrika olarak ekibimize katılmak için lütfen kurumsal başvuru formunu doldurun.</p>
            <a href="/partner-application" className="inline-block bg-white border-2 border-purple-500 text-purple-600 font-bold px-6 py-3 rounded-xl hover:bg-purple-50 transition shadow-sm text-sm uppercase tracking-wide">Bayi / Fabrika Başvurusu Yap</a>
          </div>
        </form>
      </div>
    </div>
  );
}
